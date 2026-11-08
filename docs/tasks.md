# Implementation tasks

Status: `[ ]` open · `[~]` in progress · `[x]` done. Owner: Opus 5.5 coding agent unless noted. Update this file when a task changes state.

| # | Task | Spec | Status |
|---|---|---|---|
| 1 | Repo setup: git on `main`, PDF → `context/source/`, AGENTS.md, rules, `/pr-review` skill, docs skeleton (Opus) | §4 | [x] |
| 2 | Scaffold: Vite + React + TS strict, ESLint flat config, Vitest, Playwright, deps, npm scripts, `.gitignore` | §3, §4.1 | [x] |
| 3 | Context pipeline: `pages.json`, `BUILD_PROMPT.md`, `fetchPages.ts`, run fetch, generate `schulinfo.md` + `CONFLICTS.md`, `context:tokens` (human review of `schulinfo.md` pending, §5 step 3) | §5, B, C | [x] |
| 4 | Domain: `types`, `pricing`, `costCalculator`, `keyFragment`, `viennaDate` + unit tests | §6.3, §9, §10.1 | [x] |
| 5 | Prompt + API: `system-prompt.md`, `staticPrefix`, `config`, `requestBuilder`, `apiErrors`, `chatClient` + tests | §6, A | [x] |
| 6 | i18n: types, 7 locales, `detectLocale` + tests, `LocaleProvider`, `<html lang>` | §8.5, D | [x] |
| 7 | Hooks: `useApiKey`, `useChat` | §7.1, §8.2 | [x] |
| 8 | UI components + styles, logo/favicon | §8 | [x] |
| 9 | Fake Anthropic server + cacheSimulator tests | §10.2 | [x] |
| 10 | E2E: config + 9 cases | §10.3 | [x] |
| 11 | CI/CD workflow | §11 | [x] |
| 12 | Review (2 Haiku verifiers + `/pr-review`), fix findings (see `review-findings.md`) | – | [x] |
| 13 | Docs refresh, open-day checklist | §13 | [x] |
| 14 | Manual acceptance against the real API (`open-day-checklist.md`) – needs the real key | §13 | [ ] |
| 15 | Human review of `context/schulinfo.md` + `CONFLICTS.md`; native-speaker check of translations | §5, §8.5 | [ ] |
| 16 | GitHub: create repo `schulguide` in `Die-Spengergasse`, enable Pages (Actions), protect `main` | §11 | [ ] |
