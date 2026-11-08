export type ChatErrorKind = "invalidKey" | "noCredit" | "temporary" | "badRequest" | "network";

export interface ChatError {
  kind: ChatErrorKind;
  detail: string;
}

export interface ApiFailure {
  status: number | undefined;
  message: string;
}

const CREDIT_HINT = /credit|billing|balance|purchase/i;

export function classifyApiFailure({ status, message }: ApiFailure): ChatError {
  if (status === undefined) return { kind: "network", detail: message };
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
