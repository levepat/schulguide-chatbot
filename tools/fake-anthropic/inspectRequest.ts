import type { MessagesRequest } from "./requestTypes.ts";

export const EFFORT_BETA = "mid-conversation-output-config-2026-07-01";

export function effectiveEffort(request: MessagesRequest): string {
  const messages = request.messages ?? [];
  const lastUser = messages.findLastIndex((message) => message.role === "user");
  let effort = request.output_config?.effort ?? "high";
  messages.slice(0, Math.max(lastUser, 0)).forEach((message) => {
    if (message.role === "system" && message.output_config?.effort) effort = message.output_config.effort;
  });
  return effort;
}

export function countUserTurns(request: MessagesRequest): number {
  return (request.messages ?? []).filter((message) => message.role === "user").length;
}

export function validationError(request: MessagesRequest, betaHeader: string | undefined): string | null {
  const betas = (betaHeader ?? "").split(",").map((beta) => beta.trim());
  const messages = request.messages ?? [];
  if (messages.some((message) => message.role === "system") && !betas.includes(EFFORT_BETA)) {
    return `messages: role "system" with output_config requires the anthropic-beta header ${EFFORT_BETA}`;
  }
  for (const [index, message] of messages.entries()) {
    if (message.role !== "assistant" || typeof message.content === "string") continue;
    for (const block of message.content ?? []) {
      if (block.type === "thinking" && !block.signature) {
        return `messages.${index}.content: thinking block is missing its signature`;
      }
    }
  }
  return null;
}
