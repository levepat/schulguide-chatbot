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
