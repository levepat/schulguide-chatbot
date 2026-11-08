import type { Effort } from "./domain/types";

export const MODEL = "claude-sonnet-5-5";
export const MAX_TOKENS = 32_000; // upper bound only, not billed; thinking counts towards it
export const EFFORT_BETA = "mid-conversation-output-config-2026-07-01";
export const DEFAULT_EFFORT: Effort = "low";
export const API_BASE_URL: string | undefined = import.meta.env.VITE_ANTHROPIC_BASE_URL || undefined;
