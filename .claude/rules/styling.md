# Styling (global)

- Plain CSS Modules (`Component.module.css`) next to the component; global tokens and resets only in `src/styles/`.
- No UI library, no CSS-in-JS runtime.
- Use the design tokens, never raw hex values in modules:
  `--color-primary #ED1944`, `--color-secondary #004A8D`, `--color-surface #EDEDED`, `--color-text #313131`.
- Mobile-first: base styles target 360–430 px; enhance with `min-width` media queries.
- No horizontal page scroll at 360 px. Wide content (Markdown tables/timetables) scrolls inside its own `overflow-x: auto` wrapper.
- Spacing and font sizes in `rem`; touch targets ≥ 44×44 px.
- Respect `prefers-reduced-motion` for any animation.

```css
.bubble { background: var(--color-surface); color: var(--color-text); padding: 0.75rem 1rem; }
.tableWrap { overflow-x: auto; }
```
