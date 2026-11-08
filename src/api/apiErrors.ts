export type ChatErrorKind = "invalidKey" | "noCredit" | "temporary" | "badRequest" | "network";

export interface ChatError {
  kind: ChatErrorKind;
  detail: string;
}

export interface ApiFailure {
  status: number | undefined;
  message: string;
  type?: string | null;
}

const CREDIT_HINT = /credit|billing|balance|purchase/i;
const TEMPORARY_TYPES = new Set(["overloaded_error", "api_error", "rate_limit_error"]);

export function classifyApiFailure({ status, message, type }: ApiFailure): ChatError {
  if (status === undefined) {
    if (!type) return { kind: "network", detail: message };
    return { kind: TEMPORARY_TYPES.has(type) ? "temporary" : "badRequest", detail: message };
  }
  if (status === 401) return { kind: "invalidKey", detail: message };
  if ((status === 400 || status === 402) && CREDIT_HINT.test(message)) return { kind: "noCredit", detail: message };
  if (status === 429 || status >= 500) return { kind: "temporary", detail: message };
  return { kind: "badRequest", detail: message };
}

export class ChatRequestError extends Error {
  readonly chatError: ChatError;

  constructor(chatError: ChatError) {
    super(chatError.detail);
    this.name = "ChatRequestError";
    this.chatError = chatError;
  }
}
