import { createHash } from "node:crypto";
import type { ContentBlock, MessagesRequest, RequestMessage, Usage } from "./requestTypes.ts";

type Ttl = "5m" | "1h";

interface Segment {
  key: string;
  tokens: number;
  breakpoint: Ttl | null;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function blockText(block: ContentBlock): string {
  return (block.text ?? "") + (block.thinking ?? "");
}

function messageTokens(message: RequestMessage): number {
  if (typeof message.content === "string") return estimateTokens(message.content);
  return estimateTokens((message.content ?? []).map(blockText).join(""));
}

function ttlOf(block: ContentBlock): Ttl | null {
  if (!block.cache_control) return null;
  return block.cache_control.ttl === "1h" ? "1h" : "5m";
}

function toSegments(request: MessagesRequest): Segment[] {
  const segments: Segment[] = [];
  if (request.tools?.length) {
    const json = JSON.stringify(request.tools);
    segments.push({ key: `tools:${json}`, tokens: estimateTokens(json), breakpoint: null });
  }
  const system = typeof request.system === "string" ? [{ type: "text", text: request.system }] : (request.system ?? []);
  for (const block of system) {
    const { cache_control: _marker, ...content } = block;
    segments.push({ key: `system:${JSON.stringify(content)}`, tokens: estimateTokens(blockText(block)), breakpoint: ttlOf(block) });
  }
  segments.push({
    key: `config:${JSON.stringify({ thinking: request.thinking ?? null, effort: request.output_config?.effort ?? null })}`,
    tokens: 0,
    breakpoint: null,
  });
  for (const message of request.messages ?? []) {
    segments.push({ key: `message:${JSON.stringify(message)}`, tokens: messageTokens(message), breakpoint: null });
  }
  const last = segments.at(-1);
  if (request.cache_control && last && last.breakpoint === null) {
    last.breakpoint = request.cache_control.ttl === "1h" ? "1h" : "5m";
  }
  return segments;
}

function prefixHashes(segments: Segment[]): string[] {
  const hashes: string[] = [];
  let previous = "";
  for (const segment of segments) {
    previous = createHash("sha256").update(previous).update("\n").update(segment.key).digest("hex");
    hashes.push(previous);
  }
  return hashes;
}

export interface CacheSimulator {
  simulate(request: MessagesRequest): Usage;
  reset(): void;
}

export function createCacheSimulator(): CacheSimulator {
  const known = new Set<string>();

  return {
    reset() {
      known.clear();
    },

    simulate(request) {
      const segments = toSegments(request);
      const hashes = prefixHashes(segments);
      const breakpoints = segments.flatMap((segment, index) => (segment.breakpoint ? [index] : []));
      const lastBreakpoint = breakpoints.at(-1) ?? -1;

      let readEnd = -1;
      for (let index = 0; index <= lastBreakpoint; index++) {
        if (known.has(hashes[index])) readEnd = index;
      }

      const usage: Usage = {
        input_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
      };
      segments.forEach((segment, index) => {
        if (index <= readEnd) {
          usage.cache_read_input_tokens += segment.tokens;
        } else if (index <= lastBreakpoint) {
          const covering = segments[breakpoints.find((bp) => bp >= index) ?? lastBreakpoint].breakpoint;
          if (covering === "1h") usage.cache_creation.ephemeral_1h_input_tokens += segment.tokens;
          else usage.cache_creation.ephemeral_5m_input_tokens += segment.tokens;
        } else {
          usage.input_tokens += segment.tokens;
        }
      });
      usage.cache_creation_input_tokens =
        usage.cache_creation.ephemeral_5m_input_tokens + usage.cache_creation.ephemeral_1h_input_tokens;

      for (let index = 0; index <= lastBreakpoint; index++) known.add(hashes[index]);
      return usage;
    },
  };
}
