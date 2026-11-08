# Architecture

Static React SPA (Vite, TypeScript strict) on GitHub Pages. The browser calls the Anthropic API directly with a key stored in `localStorage`. `SPEC.md` §2 has the overview diagram; this page maps it onto the code.

## Module map

| Layer | Module | Responsibility |
|---|---|---|
| Entry | `src/main.tsx` | Reads `#key=` from `location.hash`, removes the fragment with `history.replaceState` **before** React renders, mounts `LocaleProvider` + `App` |
| | `src/App.tsx` | Chooses `SetupScreen` / `ChatScreen`, validates a fragment key, settings dialog, "replace key" flow |
| Config | `src/config.ts` | `MODEL`, `MAX_TOKENS`, `EFFORT_BETA`, `DEFAULT_EFFORT`, `API_BASE_URL` (`VITE_ANTHROPIC_BASE_URL`) |
| Domain (pure) | `src/domain/types.ts` | `Effort`, `Conversation`, `UserTurn`, `AssistantTurn`, `TurnUsage`, `ApiContentBlock` |
| | `src/domain/pricing.ts`, `costCalculator.ts` | Prices, token counts, cost / cost without cache, hit rate, USD/cent formatting |
| | `src/domain/keyFragment.ts` | Read key from fragment, build share URL, mask key |
| | `src/domain/viennaDate.ts` | `YYYY-MM-DD (Weekday)` in Europe/Vienna for an injected `Date` |
| Prompt | `src/prompt/system-prompt.md`, `staticPrefix.ts` | `?raw` imports of the prompt and `context/schulinfo.md`, composed into the byte-stable `STATIC_PREFIX` |
| API | `src/api/requestBuilder.ts` (pure) | `buildRequest(conversation, today)` → request params (SDK-free type) |
| | `src/api/apiErrors.ts` (pure) | HTTP status/message → `invalidKey` · `noCredit` · `temporary` · `badRequest` · `network` |
| | `src/api/chatClient.ts` | **Only** SDK importer: `validateKey` (`GET /v1/models`), `streamReply` (`client.beta.messages.stream`, deltas, `finalMessage()`, timing) |
| i18n | `src/i18n/*` | `Translations` interface, 7 locale files, `detectLocale`, `LocaleProvider` (persists `schulguide.locale`, sets `<html lang>`), number formatting |
| State | `src/hooks/useApiKey.ts` | Key in `localStorage` (`schulguide.apiKey`), validation, problem notice |
| | `src/hooks/useChat.ts` | Conversation, effort selection, streaming draft, status, error, send / retry / reset, `AbortController` |
| | `src/storage.ts` | `localStorage` access in try/catch, typed to the two allowed keys |
| UI | `src/components/*` | One presentational component per file with a CSS module; never imports `src/api` |
| Test infra | `tools/fake-anthropic/*` | Zero-dependency fake API: `server.ts` (HTTP), `sse.ts`, `cacheSimulator.ts`, `inspectRequest.ts` |

## Data flow of one question

1. `Composer` / `ExampleQuestions` → `useChat.send(text)`. A new `UserTurn` carries the currently selected effort; for the first turn the selection also becomes `conversation.initialEffort`.
2. `useChat` passes the conversation and `viennaDate(new Date())` to `chatClient.streamReply`.
3. `buildRequest` produces the request (see below); `chatClient` streams it. `thinking` / `text` deltas update the draft (`DraftBubble`, `aria-live` log).
4. `finalMessage()` yields content, `stop_reason` and full usage. The `AssistantTurn` stores the content blocks **as received** (thinking incl. `signature`), the usage, effort and timing, and is appended to the conversation.
5. `MessageBubble` renders Markdown (`react-markdown` + `remark-gfm`, no raw HTML, tables in a scroll wrapper), `ThinkingDisclosure` and `UsagePanel`; `ConversationTotals` sums all answers.
6. Errors become `ChatRequestError` with a domain kind. `invalidKey` clears the key and returns to setup; aborts ("Neues Gespräch", unmount) are dropped silently.

## Cache layout

```
system[0]  STATIC_PREFIX (system-prompt.md + <school_info>)   cache_control: ephemeral, ttl 1h
system[1]  "Today's date: 2026-11-13 (Friday)."                no marker
messages   user / assistant (unchanged) / effort messages     no markers
top level  cache_control: { type: "ephemeral" }               automatic 5-min breakpoint on the last block
```

- Block 1 is byte-identical for every device and conversation (same bundle, same key/workspace), so all phones share one 1-hour cache entry.
- The date sits behind the 1h breakpoint and changes once a day.
- The automatic top-level breakpoint moves with the conversation: each follow-up reads the previous request's prefix and writes only the last answer plus the new question.
- `thinking` and top-level `output_config` never change within a conversation; changing them would invalidate the message cache.

## Effort switching

`initialEffort` is fixed when the conversation starts and stays the top-level `output_config.effort`. When a user turn's effort differs from the last effective effort, `buildMessages` inserts

```json
{ "role": "system", "content": [], "output_config": { "effort": "high" } }
```

directly before that user turn. Requires the beta header `mid-conversation-output-config-2026-07-01` (`betas`) and adaptive thinking. Earlier messages are untouched, so the cached prefix still hits.

## SDK typing

`@anthropic-ai/sdk` 1.6.0 covers all fields (decision D9): no local type, no cast. `requestBuilder`'s `MessageRequest` is checked structurally against the SDK params at the single call site in `chatClient.ts`.
