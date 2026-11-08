import { useCallback, useEffect, useRef, useState } from "react";
import { chatClient as defaultClient, type ChatClient } from "../api/chatClient";
import { readStorage, removeStorage, writeStorage } from "../storage";

const STORAGE_KEY = "schulguide.apiKey";

export type KeyProblem = "invalidKey" | "checkFailed";

export interface ApiKeyState {
  apiKey: string | null;
  checking: boolean;
  problem: KeyProblem | null;
  submitKey: (key: string) => Promise<boolean>;
  clearKey: (problem?: KeyProblem) => void;
}

export function useApiKey(client: ChatClient = defaultClient): ApiKeyState {
  const [apiKey, setApiKey] = useState<string | null>(() => readStorage(STORAGE_KEY));
  const [checking, setChecking] = useState(false);
  const [problem, setProblem] = useState<KeyProblem | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const submitKey = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      if (!trimmed) return false;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setChecking(true);
      setProblem(null);
      const result = await client.validateKey(trimmed, controller.signal);
      if (controller.signal.aborted) return false;
      controllerRef.current = null;
      setChecking(false);
      if (!result.ok) {
        setProblem(result.error.kind === "invalidKey" ? "invalidKey" : "checkFailed");
        return false;
      }
      writeStorage(STORAGE_KEY, trimmed);
      setApiKey(trimmed);
      return true;
    },
    [client],
  );

  const clearKey = useCallback((reason?: KeyProblem) => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setChecking(false);
    removeStorage(STORAGE_KEY);
    setApiKey(null);
    setProblem(reason ?? null);
  }, []);

  return { apiKey, checking, problem, submitKey, clearKey };
}
