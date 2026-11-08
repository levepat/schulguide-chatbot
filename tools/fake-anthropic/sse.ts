import { estimateTokens } from "./cacheSimulator.ts";
import type { Usage } from "./requestTypes.ts";

export const FAKE_SIGNATURE = "fake-signature";
export const FAKE_THINKING =
  "Die Frage betrifft die Schule. Ich suche die passenden Angaben in der Schulinformation und antworte kurz.";

const MARKDOWN_BODY = [
  "Das ist eine **Testantwort** des Fake-Servers. Sie enthält:",
  "",
  "- eine Liste mit **fettem** Text",
  "- einen [Link zur Schule](https://www.spengergasse.at)",
  "",
  "| Gegenstand | 1. Jg. | 2. Jg. | 3. Jg. | 4. Jg. | 5. Jg. | Summe |",
  "|---|---|---|---|---|---|---|",
  "| Softwareentwicklung und Projektmanagement | 3 | 3 | 4 | 4 | 4 | 18 |",
  "| Datenbanken und Informationssysteme | 2 | 2 | 2 | 2 | 2 | 10 |",
].join("\n");

export interface SseEvent {
  event: string;
  data: unknown;
  delayMs: number;
}

export interface ReplyOptions {
  turn: number;
  effort: string;
  withThinking: boolean;
  usage: Usage;
  model: string;
  chunkDelayMs?: number;
}

export function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function replyText(turn: number, effort: string): string {
  return `Fake-Antwort #${turn}, effort=${effort}.\n\n${MARKDOWN_BODY}`;
}

export function chunk(text: string, size = 24): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) chunks.push(text.slice(index, index + size));
  return chunks;
}

export function buildReplyEvents(options: ReplyOptions): SseEvent[] {
  const delay = options.chunkDelayMs ?? 30;
  const text = replyText(options.turn, options.effort);
  const thinkingTokens = options.withThinking ? estimateTokens(FAKE_THINKING) * 4 : 0;
  const outputTokens = estimateTokens(text) + thinkingTokens;
  const events: SseEvent[] = [];
  const push = (event: string, data: unknown, delayMs = 0) => events.push({ event, data, delayMs });

  push("message_start", {
    type: "message_start",
    message: {
      id: `msg_fake_${options.turn}_${Date.now()}`,
      type: "message",
      role: "assistant",
      model: options.model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { ...options.usage, output_tokens: 1, service_tier: "standard", inference_geo: "global" },
    },
  });

  let index = 0;
  if (options.withThinking) {
    push("content_block_start", {
      type: "content_block_start",
      index,
      content_block: { type: "thinking", thinking: "", signature: "" },
    });
    for (const piece of chunk(FAKE_THINKING)) {
      push("content_block_delta", { type: "content_block_delta", index, delta: { type: "thinking_delta", thinking: piece } }, delay);
    }
    push("content_block_delta", { type: "content_block_delta", index, delta: { type: "signature_delta", signature: FAKE_SIGNATURE } });
    push("content_block_stop", { type: "content_block_stop", index });
    index += 1;
  }

  push("content_block_start", { type: "content_block_start", index, content_block: { type: "text", text: "" } });
  for (const piece of chunk(text)) {
    push("content_block_delta", { type: "content_block_delta", index, delta: { type: "text_delta", text: piece } }, delay);
  }
  push("content_block_stop", { type: "content_block_stop", index });

  push("message_delta", {
    type: "message_delta",
    delta: { stop_reason: "end_turn", stop_sequence: null },
    usage: {
      ...options.usage,
      output_tokens: outputTokens,
      output_tokens_details: { thinking_tokens: thinkingTokens },
    },
  });
  push("message_stop", { type: "message_stop" });
  return events;
}
