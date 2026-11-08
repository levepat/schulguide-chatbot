# Testing

| Command | What it runs |
|---|---|
| `npm run typecheck` | `tsc -b` over `src/` (app) and `vite.config.ts`, `playwright.config.ts`, `e2e/`, `tools/` |
| `npm run lint` | ESLint flat config (typescript-eslint strict, react-hooks) |
| `npm test` | Vitest: `src/**/*.test.ts(x)` and `tools/**/*.test.ts` |
| `npm run e2e` | Playwright; starts the fake server (port 4010) and `vite build` + `vite preview` (port 4173) with `VITE_ANTHROPIC_BASE_URL=http://localhost:4010` |
| `npm run dev:fake` | Fake server + Vite dev server for manual exploration, no API cost |

First-time setup: `npx playwright install chromium webkit` (CI: `npx playwright install --with-deps`). On a machine without WebKit system libraries see decision D13. Run one project with `npx playwright test --project=android` or `--project=iphone`.

E2E tests never touch the real API. Each test starts with `POST /__reset` on the fake server and a fresh browser context (empty `localStorage`). Tests run with one worker because they share the fake server's state.

## Unit tests (SPEC §10.1)

| SPEC bullet | Test |
|---|---|
| `costCalculator`: all items, missing breakdown, "without cache" | `src/domain/costCalculator.test.ts` |
| Block 1 has `ttl: "1h"`, block 2 only the date without marker, top-level `cache_control` | `src/api/requestBuilder.test.ts` › "cache layout" |
| `STATIC_PREFIX` byte-identical across calls, no date | `requestBuilder.test.ts` › "static prefix", `src/prompt/staticPrefix.test.ts` |
| Top-level effort stays `initialEffort` after changes | `requestBuilder.test.ts` › "effort" |
| Effort message exactly before the changed user turn, none when unchanged | `requestBuilder.test.ts` › "effort" |
| Assistant content incl. thinking `signature` unchanged | `requestBuilder.test.ts` › "assistant content" |
| Beta header set | `requestBuilder.test.ts` › "headers and fixed settings" |
| `keyFragment`: read, URL decoding, missing/empty key, other params, URL with `BASE_URL` | `src/domain/keyFragment.test.ts` |
| `viennaDate`: midnight boundary in Vienna (injected time) | `src/domain/viennaDate.test.ts` |
| `detectLocale`: prefix matching, BKS variants, fallback | `src/i18n/detectLocale.test.ts` |
| (extra) error mapping | `src/api/apiErrors.test.ts` |

Unit tests use `src/prompt/fixtures/schulinfo.fixture.md` instead of the real knowledge base (decision D11).

## Fake server tests (SPEC §10.2)

| File | Covers |
|---|---|
| `tools/fake-anthropic/cacheSimulator.test.ts` | 1h write then read of block 1, 5m writes via top-level `cache_control`, longest known prefix, effort message keeps cache, top-level effort change loses message cache, no `cache_control` → no caching, reset |
| `tools/fake-anthropic/inspectRequest.test.ts` | Effective effort, user-turn count, 400 rules (system message without beta header, thinking block without signature) |
| `tools/fake-anthropic/server.test.ts` | Integration on an ephemeral port with the real SDK: models/401, SSE stream accumulated by the SDK incl. usage details, signed thinking at `high`, `/__last-request`, `/__fail-next`, CORS preflight |

## E2E tests (SPEC §10.3)

Both projects: `iphone` (WebKit, iPhone 15) and `android` (Chromium, Pixel 7), locale `de-AT`. Strings come from `src/i18n/locales/de.ts`.

| # | Case | Spec file › test |
|---|---|---|
| 1 | Setup without key, wrong key error, valid key → chat | `e2e/setup.spec.ts` › "shows setup without a key…" |
| 2 | `#key=` stores the key and removes the fragment | `e2e/setup.spec.ts` › "stores the key from the URL fragment…" |
| 3 | Example question streams a Markdown answer (list, table) | `e2e/chat.spec.ts` › "sends an example question…" |
| 4 | Second question: cache read > 0, 1h marker + top-level `cache_control` in request | `e2e/cache.spec.ts` |
| 5 | Effort `high`: `effort=high`, thinking disclosure toggles, cache read > 0, top-level effort unchanged | `e2e/effort.spec.ts` |
| 6 | Türkçe switches UI and examples, persists after reload | `e2e/i18n.spec.ts` |
| 7 | 401 → setup; 529 → "Nochmal versuchen" works | `e2e/errors.spec.ts` |
| 8 | "Neues Gespräch" clears history, shows examples | `e2e/chat.spec.ts` › "new conversation…" |
| 9 | "Key teilen" shows QR; "Key löschen" → setup | `e2e/settings.spec.ts` |
| + | 360 px: no horizontal page scroll, table scrolls in its wrapper | `e2e/chat.spec.ts` › "fits 360 px…" |
