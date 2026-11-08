export const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;

export type Effort = (typeof EFFORTS)[number];

export interface TextContent {
  type: "text";
  text: string;
}

export interface ThinkingContent {
  type: "thinking";
  thinking: string;
  signature: string;
}

export interface RedactedThinkingContent {
  type: "redacted_thinking";
  data: string;
}

export type ApiContentBlock = TextContent | ThinkingContent | RedactedThinkingContent;

export interface TurnUsage {
  inputTokens: number;
  cacheCreationInputTokens: number;
  cacheCreation: { ephemeral5mInputTokens: number; ephemeral1hInputTokens: number } | null;
  cacheReadInputTokens: number;
  outputTokens: number;
  thinkingTokens: number | null;
}

export interface UserTurn {
  id: string;
  role: "user";
  text: string;
  effort: Effort;
}

export interface AssistantTurn {
  id: string;
  role: "assistant";
  content: ApiContentBlock[];
  usage: TurnUsage;
  effort: Effort;
  timing: { firstTokenMs: number | null; totalMs: number };
  stopReason: string | null;
}

export type Turn = UserTurn | AssistantTurn;

export interface Conversation {
  initialEffort: Effort;
  turns: Turn[];
}
