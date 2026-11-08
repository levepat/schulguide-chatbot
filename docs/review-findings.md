# Review findings

Review round 1 (2026-11-08): two Haiku verifiers (spec conformance; checks + code quality), triaged by Opus against the code. Checks after fixes: typecheck, lint, 77 unit tests, 22/22 e2e (iPhone WebKit + Android Chromium), build all green; no key in `dist/`, assets under `/schulguide/`.

| # | Severity | Location | Finding | Resolution |
|---|---|---|---|---|
| 1 | major | `src/api/apiErrors.ts`, `chatClient.ts` | Mid-stream SSE `error` events (e.g. `overloaded_error`) arrive as `APIError` without status → shown as "Keine Verbindung" instead of "Nochmal versuchen" (§6.7). | Fixed: `classifyApiFailure` takes the SDK error `type`; overloaded/api/rate-limit → `temporary`, other typed errors → `badRequest`. Unit tests added. |
| 2 | minor | `src/App.tsx` | QR/fragment key that fails validation on a phone that already has a key: no message shown (§7.3 "wie in 7.2"). | Fixed: failed fragment check opens the setup screen with the problem; "cancel" returns to the existing key. |
| 3 | minor | `src/hooks/useApiKey.ts` | `clearKey` did not abort a pending validation, which could re-save a key after deletion; controller ref never reset. | Fixed: `clearKey` aborts and resets; ref cleared after completion. |
| 4 | minor | `src/hooks/useChat.ts` | `send`/`retry` guarded only on render-time `status`; a double submit before re-render could start two streams. | Fixed: also guard on the in-flight `AbortController` ref (set synchronously in `run`). |
| 5 | minor | `tools/fake-anthropic/server.test.ts` | Imports the SDK outside `chatClient.ts`. | Accepted (test drives the fake server through the real SDK); AGENTS.md wording narrowed to app modules. |
| 6 | nit | `src/i18n/detectLocale.ts` | `in` on a plain object matches prototype keys. | Fixed: `Object.hasOwn`. |
| 7 | minor | `src/styles/*` | Contrast white on `#ED1944` = 4.36:1. | Rejected: primary buttons use `--color-primary-dark` `#c40f35` (≈ 5.9:1); brand red only behind large header text. |
| 8 | minor | `src/api/chatClient.ts` | Non-`APIError` failures map to `network`. | Kept: mid-stream connection drops surface as plain `TypeError`s, so `network` is the right message. |
| 9 | minor | `src/components/MessageList.tsx` | `aria-live` covers the whole log, not only the streaming bubble. | Kept: `role="log"` only announces additions; needs a screen-reader check on a real phone. |
| 10 | nit | `useApiKey`, `main.tsx` | `submitKey` vs. spec's `saveKey`; fragment removal in `main.tsx` instead of `keyFragment.ts`. | Kept: behaviour and order (replaceState before render/validation) match the spec; pure parsing stays in `keyFragment.ts`. |
| 11 | nit | `src/i18n/detectLocale.ts` | `sr-Cyrl` also maps to `bks`. | Kept: Serbian speakers are better served by the Latin BKS UI than by German. |
| 12 | nit | `src/components/Markdown.tsx` | Focusable table wrapper has no accessible name. | Open (low priority): the focus is there so keyboard users can scroll wide tables. |
| 13 | nit | `SetupScreen.tsx` | `sk-ant-…` placeholder not from i18n. | Kept: key format example, not prose. |
