import { useCallback, useEffect, useRef, useState } from "react";
import { ChatRequestError, type ChatError } from "../api/apiErrors";
import { chatClient as defaultClient, type ChatClient } from "../api/chatClient";
import { DEFAULT_EFFORT } from "../config";
import type { Conversation, Effort, UserTurn } from "../domain/types";
import { viennaDate } from "../domain/viennaDate";

export type { ChatError, ChatErrorKind } from "../api/apiErrors";

export type ChatStatus = "idle" | "streaming" | "error";

export interface StreamDraft {
  thinking: string;
  text: string;
}

export interface UseChatOptions {
  apiKey: string;
  client?: ChatClient;
  onInvalidKey: () => void;
}

export interface ChatState {
  conversation: Conversation;
  effort: Effort;
  setEffort: (effort: Effort) => void;
  draft: StreamDraft | null;
  status: ChatStatus;
  error: ChatError | null;
  send: (text: string) => void;
  retry: () => void;
  reset: () => void;
}

let turnCounter = 0;
function nextTurnId(): string {
  turnCounter += 1;
  return `turn-${turnCounter}`;
}

function pendingUserTurn(conversation: Conversation): UserTurn | null {
  const last = conversation.turns.at(-1);
  return last?.role === "user" ? last : null;
}

export function useChat({ apiKey, client = defaultClient, onInvalidKey }: UseChatOptions): ChatState {
  const [conversation, setConversation] = useState<Conversation>({ initialEffort: DEFAULT_EFFORT, turns: [] });
  const [effort, setEffort] = useState<Effort>(DEFAULT_EFFORT);
  const [draft, setDraft] = useState<StreamDraft | null>(null);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<ChatError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = useCallback(
    async (request: Conversation, userTurn: UserTurn) => {
      const controller = new AbortController();
      controllerRef.current = controller;
      setConversation(request);
      setDraft({ thinking: "", text: "" });
      setStatus("streaming");
      setError(null);
      try {
        const answer = await client.streamReply(
          { apiKey, conversation: request, today: viennaDate(new Date()), turnId: nextTurnId(), effort: userTurn.effort },
          {
            onThinkingDelta: (delta) => setDraft((prev) => prev && { ...prev, thinking: prev.thinking + delta }),
            onTextDelta: (delta) => setDraft((prev) => prev && { ...prev, text: prev.text + delta }),
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setConversation({ ...request, turns: [...request.turns, answer] });
        setDraft(null);
        setStatus("idle");
      } catch (caught) {
        if (controller.signal.aborted) return;
        const chatError: ChatError =
          caught instanceof ChatRequestError ? caught.chatError : { kind: "network", detail: String(caught) };
        setDraft(null);
        if (chatError.kind === "invalidKey") {
          onInvalidKey();
          return;
        }
        setError(chatError);
        setStatus("error");
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [apiKey, client, onInvalidKey],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === "streaming") return;
      const base = pendingUserTurn(conversation) ? conversation.turns.slice(0, -1) : conversation.turns;
      const userTurn: UserTurn = { id: nextTurnId(), role: "user", text: trimmed, effort };
      const initialEffort = base.length === 0 ? effort : conversation.initialEffort;
      void run({ initialEffort, turns: [...base, userTurn] }, userTurn);
    },
    [conversation, effort, run, status],
  );

  const retry = useCallback(() => {
    const userTurn = pendingUserTurn(conversation);
    if (userTurn && status !== "streaming") void run(conversation, userTurn);
  }, [conversation, run, status]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setConversation({ initialEffort: effort, turns: [] });
    setDraft(null);
    setStatus("idle");
    setError(null);
  }, [effort]);

  return { conversation, effort, setEffort, draft, status, error, send, retry, reset };
}
