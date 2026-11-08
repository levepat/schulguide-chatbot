---
paths:
  - "src/hooks/**"
  - "src/**/*State.ts"
---

# State management

- No global store library. State lives in hooks: `useChat` (conversation, streaming draft, status, error, retry, reset) and `useApiKey` (key + persistence). Locale lives in `LocaleProvider`.
- `Conversation` is immutable: produce new objects on every change; the request builder relies on unchanged assistant content.
- Streaming draft (partial text/thinking) is separate from committed turns; a turn is committed only after `finalMessage()`.
- Every in-flight request owns an `AbortController`; "Neues Gespräch" and unmount abort it. An abort is discarded silently (no error state).
- `initialEffort` is fixed when the first user turn of a conversation is sent and reset on "Neues Gespräch"; per-turn effort is stored on each `UserTurn`.
- Persistence: only `schulguide.apiKey` and `schulguide.locale` in `localStorage`, accessed in try/catch. Never persist turns.
- Errors are domain error kinds from `apiErrors.ts` (`invalidKey`, `noCredit`, `temporary`, `badRequest`, `network`). `invalidKey` triggers `clearKey()`.

```ts
type ChatStatus = "idle" | "streaming" | "error";
```
