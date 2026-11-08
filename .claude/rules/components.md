---
paths:
  - "src/**/*.tsx"
  - "src/**/use*.ts"
---

# Components and hooks

- One component per file, file name = component name (`MessageBubble.tsx` + `MessageBubble.module.css`).
- Function components with typed props interfaces (`interface MessageBubbleProps`); no `React.FC`.
- Components are presentational: they receive data and callbacks. They never import `src/api/*`; chat behaviour comes from `useChat`, key handling from `useApiKey`.
- All text via the i18n hook (`useT()` / `LocaleProvider`); no literal user-facing strings in JSX.
- Markdown answers: `react-markdown` + `remark-gfm`, no raw HTML (`skipHtml`), links rendered with `target="_blank" rel="noopener noreferrer"`, tables wrapped in a horizontally scrollable container.
- Keys in lists are stable IDs, never array indices for chat turns.
- Hooks follow the Rules of Hooks; effects clean up (abort controllers, listeners).

## Don't
- Don't put business logic (cost math, request building) in components – call pure domain functions.
- Don't add comments that restate the JSX.
