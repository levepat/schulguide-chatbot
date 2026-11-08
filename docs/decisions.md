# Decisions

Short ADR log. Newest last. Format: context → decision → consequence.

## D1 – Repo layout (2026-11-08)
Local folder `chatbot_tag_der_offenen` is the repo root; the spec's `schulguide/` tree is laid out directly at the root. The Vite `base: "/schulguide/"` is the GitHub Pages path and depends on the **GitHub repo name**, not the local folder → the GitHub repo must be named `schulguide` (otherwise change `base` in `vite.config.ts`).

## D2 – Node version (2026-11-08)
Local Node is 22.22; the spec targets Node 26. Node ≥ 22.18 strips TS types natively, so `tools/*.ts` stays erasable-syntax and runs on both. CI uses Node 26 as specified; `engines` is `>=22.18`.

## D3 – playwright-cli (2026-11-08)
Not installed locally; interactive exploration uses `@playwright/test` with screenshots instead. No impact on the test suite.

## D4 – Agent guidance (2026-11-08)
`AGENTS.md` holds global rules (`CLAUDE.md` imports it). Path-scoped rules in `.claude/rules/` with `paths:` frontmatter; review checklist as skill `.claude/skills/pr-review`. Code comments are kept minimal by project rule.

## D5 – Git (2026-11-08)
The project had no own repo; git resolved to a stray empty repo at `~` with an invalid `core.autocrlf = {input}`. Fixed that value to `input`, initialised a dedicated repo here on branch `main`.

## D6 – Local Node lacks TS stripping (2026-11-08)
Correction to D2: the distro build of Node 22.22.1 here has `process.features.typescript === false` (`ERR_NO_TYPESCRIPT`), so `npm run context:fetch` cannot run locally as is. The fetch was run by transpiling `fetchPages.ts` with the project's `typescript` (`transpileModule`) into a temporary `.mjs` next to it, then deleting it. Scripts stay erasable TS for Node 26 (CI) or an official Node ≥ 22.18 build; no tooling change.

## D7 – Context build: converter and editorial choices (2026-11-08)
The fetch converter dropped all WordPress tables (`<figure class="wp-block-table">` was removed) and kept images; fixed with own rules: header-less grid tables → GFM tables, other tables → lists, images/empty links dropped, shortcode regex no longer eats Markdown link texts. In `schulinfo.md`: events before 08.11.2026 dropped; per-year sum rows in timetables computed from the website values where the sources have none (marked „Summe Wochenstunden“); HIF „auslaufend“ timetable and „ab 2025 auch U5“ omitted. All brochure/website conflicts are in `context/CONFLICTS.md`. „(prüfen)“ pages (Freifächer, Cybersecurity, Bachelor KI Management) are current enough and stay in `pages.json`.

## D8 – Tool scripts run via `tsx` (2026-11-08)
Follow-up to D6: `npm run fake`, `dev:fake`, the Playwright fake-server `webServer`, `context:fetch` and `context:tokens` run through the devDependency `tsx` instead of `node <file>.ts`, so they work on the local distro Node 22 (no TS stripping) and on CI Node 26 alike. `tools/**` stays erasable syntax with `.ts` import extensions, so plain `node` keeps working wherever type stripping is available.

## D9 – SDK typing: no local type, no cast (2026-11-08)
`@anthropic-ai/sdk` 1.6.0 types everything the spec needs on `client.beta.messages.stream`: top-level `cache_control`, `output_config.effort`, `thinking: { type: "adaptive", display: "summarized" }`, `betas`, `BetaSystemMessageParam` with `output_config` and empty `content`, plus `usage.cache_creation` and `usage.output_tokens_details.thinking_tokens`. `requestBuilder` returns its own SDK-free `MessageRequest`, which is structurally assignable to the SDK params, so `chatClient.ts` needs neither the allowed local type nor a cast. `finalMessage()` adds `parsed_output` to text blocks only as non-enumerable properties, so assistant content round-trips unchanged.

## D10 – SDK 1.6 authenticates with `Authorization: Bearer` (2026-11-08)
SDK 1.6 (API version `2026-10-21`) sends the key as `Authorization: Bearer <key>`, not `x-api-key`. The fake server accepts both. In the browser the fake also exposes `x-should-retry` via `Access-Control-Expose-Headers`; injected `/__fail-next` errors carry `x-should-retry: false`, otherwise the SDK would silently retry a 529 and the retry path (SPEC §10.3 case 7) could not be tested. Against the real API the SDK still retries 429/5xx automatically before the UI shows "Nochmal versuchen".

## D11 – Unit tests use a fixture instead of `context/schulinfo.md` (2026-11-08)
Vitest aliases `../../context/schulinfo.md?raw` to `src/prompt/fixtures/schulinfo.fixture.md` (`vite.config.ts`, `test.alias`). Unit tests therefore never depend on the knowledge base's content or existence; the "no date in block 1" test injects a sentinel date instead of scanning for any date (the knowledge base legitimately contains event dates).

## D12 – UI choices the spec left open (2026-11-08)
- The "weiß" logo from the spec URL is actually dark text on an opaque white background; it is shown unmodified on a white rounded badge in the red header. `favicon.png` is the red star cropped from that logo.
- Below 420 px the header title is visually hidden (still the `<h1>` for screen readers) so logo, language selector and settings fit at 360 px.
- "Neues Gespräch" is an icon button with translated `aria-label` left of the input to keep the sticky bottom bar compact; effort levels are shown with their API names (`low` … `max`), the legend is translated.
- A failed question stays visible; "Nochmal versuchen" resends it, a new question replaces it. Retry is offered for `temporary` and `network` errors; `badRequest` shows the API message.
- `navigator.languages` is read once at startup; `<html lang>` follows the locale (`bks` → `hr`).
- The Sonnet 5.5 refusal `fallbacks` parameter is not used: the spec fixes one model and requires `stop_reason: "refusal"` to be shown as delivered.

## D13 – Local WebKit without sudo (2026-11-08)
Playwright's WebKit needs `libmanette-0.2-0` (and `libhidapi-hidraw0`), which are not installed on the dev machine and need sudo. Workaround used locally: `apt-get download` both packages, `dpkg -x` them and copy the `.so` files into `~/.cache/ms-playwright/webkit-<rev>/minibrowser-wpe/lib/`. After that `npm run e2e` passes on both projects. CI is unaffected (`npx playwright install --with-deps`). The proper fix is `sudo npx playwright install-deps webkit`.

## D14 – Cache-read price verified (2026-11-08)
`pricing.ts` follows SPEC §9.1 (cache read 0.10 USD/MTok = 0.05× input). An older bundled reference listed 0.20 USD/MTok; the live pricing page (https://platform.claude.com/docs/en/about-claude/pricing, checked 2026-11-08) confirms Sonnet 5.5: input 2, 5m write 2.50, 1h write 4, cache hits 0.10 ("0.05x the base input price"), output 10. No change needed.
