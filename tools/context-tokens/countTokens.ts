import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const model = "claude-sonnet-5-5";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is not set. Export it and run again.");
  process.exit(1);
}

const systemPrompt = await readFile(join(root, "src", "prompt", "system-prompt.md"), "utf8");
const schulinfo = await readFile(join(root, "context", "schulinfo.md"), "utf8");
const staticPrefix = `${systemPrompt}\n\n<school_info>\n${schulinfo}\n</school_info>\n`;

const response = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model,
    system: staticPrefix,
    messages: [{ role: "user", content: "Hallo" }],
  }),
});

if (!response.ok) {
  console.error(`count_tokens failed: HTTP ${response.status}\n${await response.text()}`);
  process.exit(1);
}

const { input_tokens: inputTokens } = (await response.json()) as { input_tokens: number };
console.log(`Static prefix: ${staticPrefix.length} chars, ${inputTokens} input tokens (incl. a short user message)`);
