import Anthropic, { APIError } from "@anthropic-ai/sdk";
import type { BetaContentBlock, BetaUsage } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { API_BASE_URL } from "../config";
import type { ApiContentBlock, AssistantTurn, Conversation, Effort, TurnUsage } from "../domain/types";
import { ChatRequestError, classifyApiFailure, type ChatError } from "./apiErrors";
import { buildRequest } from "./requestBuilder";

export type KeyValidationResult = { ok: true } | { ok: false; error: ChatError };

export interface StreamReplyParams {
  apiKey: string;
  conversation: Conversation;
  today: string;
  turnId: string;
  effort: Effort;
}

export interface StreamHandlers {
  onThinkingDelta(text: string): void;
  onTextDelta(text: string): void;
}

export interface ChatClient {
  validateKey(apiKey: string, signal?: AbortSignal): Promise<KeyValidationResult>;
  streamReply(params: StreamReplyParams, handlers: StreamHandlers, signal: AbortSignal): Promise<AssistantTurn>;
}

function createSdk(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, baseURL: API_BASE_URL, dangerouslyAllowBrowser: true });
}

function toChatError(error: unknown): ChatError {
  if (error instanceof APIError) {
    return classifyApiFailure({ status: error.status, message: error.apiMessage ?? error.message, type: error.type });
  }
  return classifyApiFailure({ status: undefined, message: error instanceof Error ? error.message : String(error) });
}

function isApiContentBlock(block: BetaContentBlock): block is BetaContentBlock & ApiContentBlock {
  return block.type === "text" || block.type === "thinking" || block.type === "redacted_thinking";
}

function toTurnUsage(usage: BetaUsage): TurnUsage {
  return {
    inputTokens: usage.input_tokens,
    cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
    cacheCreation: usage.cache_creation
      ? {
          ephemeral5mInputTokens: usage.cache_creation.ephemeral_5m_input_tokens,
          ephemeral1hInputTokens: usage.cache_creation.ephemeral_1h_input_tokens,
        }
      : null,
    cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
    outputTokens: usage.output_tokens,
    thinkingTokens: usage.output_tokens_details?.thinking_tokens ?? null,
  };
}

export const chatClient: ChatClient = {
  async validateKey(apiKey, signal) {
    try {
      await createSdk(apiKey).models.list({ limit: 1 }, { signal });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: toChatError(error) };
    }
  },

  async streamReply({ apiKey, conversation, today, turnId, effort }, handlers, signal) {
    const startedAt = performance.now();
    let firstTokenMs: number | null = null;
    const markFirstToken = () => {
      firstTokenMs ??= performance.now() - startedAt;
    };

    try {
      const stream = createSdk(apiKey).beta.messages.stream(buildRequest(conversation, today), { signal });
      stream.on("thinking", (delta) => {
        markFirstToken();
        handlers.onThinkingDelta(delta);
      });
      stream.on("text", (delta) => {
        markFirstToken();
        handlers.onTextDelta(delta);
      });
      const message = await stream.finalMessage();
      return {
        id: turnId,
        role: "assistant",
        content: message.content.filter(isApiContentBlock),
        usage: toTurnUsage(message.usage),
        effort,
        timing: { firstTokenMs, totalMs: performance.now() - startedAt },
        stopReason: message.stop_reason,
      };
    } catch (error) {
      if (signal.aborted) throw error;
      throw new ChatRequestError(toChatError(error));
    }
  },
};
