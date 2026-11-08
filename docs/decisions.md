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
