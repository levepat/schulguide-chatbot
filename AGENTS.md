# AGENTS.md – Schulguide-Chatbot

Static React SPA (GitHub Pages) that answers visitor questions at the HTL Spengergasse open day from a bundled knowledge base, calling the Anthropic API directly from the browser. **`SPEC.md` is the source of truth**; when this file and the spec disagree, the spec wins and this file gets fixed.

## Commands

| Task | Command |
|---|---|
| Dev against fake API (no cost) | `npm run dev:fake` |
| Dev against real API | `npm run dev` |
| Type check / lint / unit tests | `npm run typecheck` · `npm run lint` · `npm test` |
| E2E (starts fake server + preview) | `npm run e2e` |
| Refresh homepage raw data | `npm run context:fetch` |

Definition of done: `typecheck`, `lint`, `test`, `e2e` green **and** affected files in `docs/` updated.

## Architecture boundaries

- `src/api/chatClient.ts` is the **only** module importing `@anthropic-ai/sdk`. UI and hooks see domain types only.
- Pure modules, no SDK/DOM/clock/network access: `requestBuilder`, `apiErrors` (mapping), `costCalculator`, `keyFragment`, `viennaDate` (clock injected), `detectLocale`, `staticPrefix`.
- Components never call `chatClient`; chat flow lives in `useChat`, key storage in `useApiKey`.
- One component / one module with one responsibility per file.

## Invariants (break one = bug)

1. `STATIC_PREFIX` (system block 1) is byte-stable: no date, time, locale or ID. It carries `cache_control: { type: "ephemeral", ttl: "1h" }`.
2. System block 2 contains only the Vienna date, no marker.
3. Top-level `cache_control` is always set; no explicit markers inside `messages`.
4. Top-level `output_config.effort` = `conversation.initialEffort` for the whole conversation. Changes are made **only** through `{ role: "system", content: [], output_config }` messages inserted before the changed user turn.
5. Thinking config never changes mid-conversation.
6. Assistant content blocks (incl. thinking + `signature`) are sent back exactly as received.
7. `localStorage` holds only `schulguide.apiKey` and `schulguide.locale`. Conversations are never persisted or logged.
8. No `any`. At most one narrow local SDK type + one cast, in `chatClient.ts`.
9. Every user-visible string comes from `src/i18n`; all 7 locales stay complete (the compiler enforces it).

## Conventions

- Prose in docs: German or English. Identifiers, file names, code: English.
- **Comments: as few as possible.** Only where the code cannot explain itself (a deliberate cast, a non-obvious API constraint). No restating what code does, no commented-out code.
- `tools/**` runs via Node type stripping: erasable syntax only (no `enum`, `namespace`, parameter properties); import with `.ts` extensions.
- Prefer small named exports; no default exports except where tooling requires them.

## Where to look

- Path-scoped rules: `.claude/rules/*.md` (styling, components, state, a11y, unit/integration/e2e tests).
- Review checklist: `.claude/skills/pr-review/SKILL.md` (`/pr-review`).
- Living docs: `docs/` – `tasks.md` (status), `architecture.md`, `decisions.md`, `testing.md`, `deployment.md`, `review-findings.md`, `open-day-checklist.md`.
