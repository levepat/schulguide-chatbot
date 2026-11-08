import { EFFORT_BETA, MAX_TOKENS, MODEL } from "../config";
import type { ApiContentBlock, Conversation, Effort } from "../domain/types";
import { STATIC_PREFIX } from "../prompt/staticPrefix";

export interface SystemTextBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral"; ttl: "1h" };
}

export interface UserMessage {
  role: "user";
  content: { type: "text"; text: string }[];
}

export interface AssistantMessage {
  role: "assistant";
  content: ApiContentBlock[];
}

export interface EffortMessage {
  role: "system";
  content: [];
  output_config: { effort: Effort };
}

export type RequestMessage = UserMessage | AssistantMessage | EffortMessage;

export interface MessageRequest {
  model: string;
  max_tokens: number;
  betas: string[];
  cache_control: { type: "ephemeral" };
  output_config: { effort: Effort };
  thinking: { type: "adaptive"; display: "summarized" };
  system: SystemTextBlock[];
  messages: RequestMessage[];
}

export function dateBlockText(today: string): string {
  return `Today's date: ${today}.`;
}

export function buildMessages(conversation: Conversation): RequestMessage[] {
  const messages: RequestMessage[] = [];
  let effectiveEffort = conversation.initialEffort;
  for (const turn of conversation.turns) {
    if (turn.role === "assistant") {
      messages.push({ role: "assistant", content: turn.content });
      continue;
    }
    if (turn.effort !== effectiveEffort) {
      messages.push({ role: "system", content: [], output_config: { effort: turn.effort } });
      effectiveEffort = turn.effort;
    }
    messages.push({ role: "user", content: [{ type: "text", text: turn.text }] });
  }
  return messages;
}

export function buildRequest(conversation: Conversation, today: string): MessageRequest {
  return {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    betas: [EFFORT_BETA],
    cache_control: { type: "ephemeral" },
    output_config: { effort: conversation.initialEffort },
    thinking: { type: "adaptive", display: "summarized" },
    system: [
      { type: "text", text: STATIC_PREFIX, cache_control: { type: "ephemeral", ttl: "1h" } },
      { type: "text", text: dateBlockText(today) },
    ],
    messages: buildMessages(conversation),
  };
}
