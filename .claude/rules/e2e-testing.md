---
paths:
  - "e2e/**"
  - "playwright.config.ts"
---

# E2E tests (@playwright/test)

- Always run against the fake server (`http://localhost:4010`), never the real API.
- `test.beforeEach`: `POST /__reset` on the fake server and clear `localStorage`.
- Projects: iPhone (WebKit) and Android (Chromium) device profiles; tests must pass on both.
- Locate by role and accessible name (`getByRole("button", { name: ... })`), then `getByTestId` as fallback. No CSS/XPath selectors.
- Use web-first assertions (`await expect(locator).toBeVisible()`); no `waitForTimeout`.
- Inspect requests via `GET /__last-request`; inject failures via `POST /__fail-next`.
- Use the fixed valid key `sk-ant-test-valid`; helpers live in `e2e/helpers.ts`.
- One spec file per feature area (setup, chat, cache, effort, i18n, errors, settings); cover all 9 cases of SPEC §10.3.
