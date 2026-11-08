# Deployment

## GitHub repository and Pages

1. Create the private repo **`schulguide`** in the organisation `Die-Spengergasse`. The name matters: `vite.config.ts` uses `base: "/schulguide/"`, and the QR share links are built from it. With another name, change `base` (decision D1).
2. Push `main`. Settings → Pages → Source: **GitHub Actions**.
3. The workflow `.github/workflows/ci.yml` runs on every pull request to `main` and every push to `main`:
   - job `test`: `npm ci`, typecheck, lint, unit tests, `npx playwright install --with-deps`, e2e against the fake server; uploads the Playwright report on failure;
   - job `deploy` (push to `main` only, `needs: test`): `npm run build` without `VITE_ANTHROPIC_BASE_URL` (→ real API), `upload-pages-artifact`, `deploy-pages` into the `github-pages` environment.
4. The app is served at `https://die-spengergasse.github.io/schulguide/` (the URL is shown in the `deploy` job summary).

No secrets are needed: CI never calls the real API.

## Branch protection for `main`

Settings → Branches (or Rulesets) → rule for `main`:

- Require a pull request before merging.
- Require status checks to pass: **`test`** (the job name from `ci.yml`), branches up to date.
- Block force pushes and deletions.

## API key runbook

**Create (teacher)**
1. In the Anthropic Console use an account/workspace dedicated to the open day.
2. Billing: prepaid credit only, **automatic reload switched off**. The remaining credit is the maximum damage if the key leaks.
3. Create an API key (name e.g. `schulguide-infotag-2026`). Optionally set a workspace spend limit.
4. Enter the key on one phone (setup screen) and pass it on with Settings → "Key teilen (QR)". Everyone who scans the code can use the key; share it only with the students at the stand.

**Revoke (incident or after the event)**
1. Console → API Keys → revoke the key. All phones get `401` on the next request and return to the setup screen ("Key ungültig oder widerrufen").
2. Create a new key as above and share it again by QR.
3. After the event: revoke the key; students delete it in Settings → "Key löschen".

**Out of credit**: the app shows "Guthaben aufgebraucht – bitte Lehrkraft informieren". Top up in the Console; no app change needed.

## Freeze before the open day

Every change to `src/prompt/system-prompt.md` or `context/schulinfo.md` changes the cached prefix; the first request afterwards writes the 1h cache again. Do not deploy on the open day itself (SPEC §5). Run `docs/open-day-checklist.md` against the deployed build beforehand.
