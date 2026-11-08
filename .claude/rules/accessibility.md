---
paths:
  - "src/**/*.tsx"
---

# Accessibility

- Every interactive element has an accessible name; icon-only buttons get a translated `aria-label`.
- Use native elements: `<button>`, `<dialog>` / proper `role="dialog"` with `aria-modal` and focus trap, `<details>/<summary>` for disclosures (thinking, usage panel).
- The streaming answer region uses `aria-live="polite"`; error messages use `role="alert"`.
- Text contrast ≥ 4.5:1 (white on `#ED1944` is fine for large/bold header text only; check small text).
- Visible focus styles (`:focus-visible`); never `outline: none` without a replacement.
- Form inputs have `<label>`s; the key field toggle announces its state (`aria-pressed`).
- `<html lang>` follows the UI locale (`bks` → `hr`).
- Effort selector is a radio group (`role="radiogroup"` or native radios), keyboard-operable.
