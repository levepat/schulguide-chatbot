import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

type PageEntry = { id: number; group: string; title: string };
type WpPage = {
  id: number;
  title: { rendered: string };
  link: string;
  modified: string;
  content: { rendered: string };
};
type FetchedPage = { entry: PageEntry; file: string; markdown: string };

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const contextDir = join(root, "context");
const rawDir = join(contextDir, "raw");
const endpoint = "https://www.spengergasse.at/index.php";

const entities: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»",
  bdquo: "„", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith("#x")) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return entities[code.toLowerCase()] ?? match;
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cellText(service: TurndownService, cell: Element): string {
  return service
    .turndown(cell.innerHTML)
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function tableToMarkdown(service: TurndownService, table: HTMLElement): string {
  const rows = Array.from(table.querySelectorAll("tr")).map((row) =>
    Array.from(row.children)
      .filter((cell) => cell.nodeName === "TD" || cell.nodeName === "TH")
      .map((cell) => cellText(service, cell)),
  );
  const width = Math.max(0, ...rows.map((row) => row.length));
  const isGrid = rows.length > 1 && width >= 3 && rows.every((row) => row.every((cell) => !cell.includes("\n")));
  if (isGrid) {
    const line = (row: string[]) =>
      `| ${Array.from({ length: width }, (_, i) => (row[i] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`;
    const [head, ...body] = rows;
    return `\n\n${[line(head), `|${" --- |".repeat(width)}`, ...body.map(line)].join("\n")}\n\n`;
  }
  const items = rows
    .map((row) => row.filter((cell) => cell !== ""))
    .flatMap((cells) => (cells.some((cell) => cell.includes("\n")) ? cells : [cells.join(" | ")]))
    .filter((item) => item !== "")
    .map((item) => `- ${item.replace(/\n/g, "\n  ")}`);
  return `\n\n${items.join("\n")}\n\n`;
}

function toMarkdown(html: string): string {
  const service = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });
  service.use(gfm);
  service.remove(["script", "style"]);
  service.addRule("dropImages", { filter: ["img", "picture", "video", "iframe"], replacement: () => "" });
  service.addRule("dropEmptyLinks", {
    filter: (node) => node.nodeName === "A" && (node.textContent ?? "").trim() === "",
    replacement: () => "",
  });
  service.addRule("tables", {
    filter: "table",
    replacement: (_content, node) => tableToMarkdown(service, node as HTMLElement),
  });
  return service
    .turndown(html)
    .replace(/\[\/?[a-z_][a-z0-9_-]*(?:\s[^\]\n]*)?\](?!\()/gi, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchPage(entry: PageEntry): Promise<WpPage> {
  const url = `${endpoint}?rest_route=/wp/v2/pages/${entry.id}&_fields=id,title,link,modified,content`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; schulguide-context-fetch)" } });
  if (response.status !== 200) {
    throw new Error(`Page ${entry.id} (${entry.title}): HTTP ${response.status}`);
  }
  return (await response.json()) as WpPage;
}

async function main(): Promise<void> {
  const entries = JSON.parse(await readFile(join(contextDir, "pages.json"), "utf8")) as PageEntry[];
  const fetchedAt = new Date().toISOString();

  const results = await Promise.allSettled(entries.map(fetchPage));
  const failures = results.flatMap((result) => (result.status === "rejected" ? [String(result.reason)] : []));
  if (failures.length > 0) {
    console.error(`Fetch failed, context/raw untouched:\n${failures.join("\n")}`);
    process.exit(1);
  }

  const pages: FetchedPage[] = entries.map((entry, index) => {
    const result = results[index] as PromiseFulfilledResult<WpPage>;
    const page = result.value;
    const title = decodeEntities(page.title.rendered);
    const file = `${entry.id}-${slugify(title)}.md`;
    const markdown = [
      `# ${title}`,
      "",
      `- URL: ${page.link}`,
      `- Modified: ${page.modified}`,
      `- Fetched: ${fetchedAt}`,
      "",
      "---",
      "",
      toMarkdown(page.content.rendered),
      "",
    ].join("\n");
    return { entry, file, markdown };
  });

  await mkdir(rawDir, { recursive: true });
  for (const name of await readdir(rawDir)) {
    if (name.endsWith(".md") || name === "_meta.json") await rm(join(rawDir, name));
  }
  for (const page of pages) await writeFile(join(rawDir, page.file), page.markdown);
  const meta = {
    fetchedAt,
    files: pages.map((page) => ({ id: page.entry.id, group: page.entry.group, file: page.file })),
  };
  await writeFile(join(rawDir, "_meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`Fetched ${pages.length} pages into context/raw`);
}

await main();
