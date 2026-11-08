---
name: pr-review
description: Review a branch or PR of the Schulguide chatbot against SPEC.md and the AGENTS.md invariants (cache layout, effort handling, key safety, i18n, a11y, tests). Use when asked to review changes, a PR, or before merging to main.
---

# PR review – Schulguide

## 1. Collect the change
- `git diff main...HEAD --stat` then the full diff (or `gh pr diff <n>`).
- Map each changed file to its SPEC section (§4 structure table).

## 2. Invariant checklist (AGENTS.md)
For any change touching `src/api`, `src/prompt`, `src/domain`, `src/hooks`:
- [ ] STATIC_PREFIX still byte-stable; nothing variable added to block 1 or `system-prompt.md`.
- [ ] Block 1 `ttl: "1h"` marker; block 2 date only; top-level `cache_control`; no markers in `messages`.
- [ ] Top-level effort = `initialEffort`; effort changes only through system messages before the changed user turn.
- [ ] Assistant content round-tripped unmodified; thinking config constant.
- [ ] SDK imported only in `chatClient.ts`; no `any`; at most one documented cast.
- [ ] `localStorage` keys limited to `schulguide.apiKey` / `schulguide.locale`; no conversation persistence; key fragment removed via `history.replaceState` before use.

## 3. UI / i18n / a11y
- [ ] New strings exist in all 7 locales; no literal strings in JSX.
- [ ] Rules in `.claude/rules/accessibility.md` and `styling.md` hold (360 px, table scroll, labels).

## 4. Tests and docs
- [ ] Pure logic changes have unit tests; behaviour changes have/keep an e2e case (SPEC §10.3).
- [ ] Run `npm run typecheck && npm run lint && npm test && npm run e2e`; report output.
- [ ] `docs/` updated (tasks, decisions, architecture where relevant).
- [ ] Comments minimal – flag comments that restate code.

## 5. Report
List findings ordered by severity (blocker → major → minor → nit), each with `file:line`, the problem, the concrete failure scenario and a suggested fix. Append confirmed findings and their resolution to `docs/review-findings.md`.
