# Schulguide – Chatbot für den Tag der offenen Tür

Mobile Web-App, die Besucherinnen und Besuchern der HTL Spengergasse am Tag der offenen Tür Fragen zur Schule beantwortet – in der Sprache, in der gefragt wird. Die Antworten stammen aus einer mitgelieferten Wissensbasis (`context/schulinfo.md`), das Modell ist Claude Sonnet 5.5 über die Anthropic API.

- Statische React-SPA (Vite, TypeScript), gehostet auf GitHub Pages – kein eigener Server.
- Prompt Caching: Systemprompt + Wissensbasis werden 1 h gecacht und von allen Geräten geteilt; Folgefragen kosten Bruchteile eines Cents.
- Panel „Blick unter die Haube“: Tokens, Cache-Trefferquote, Kosten pro Antwort und mit/ohne Cache.
- Effort-Wahl (`low` … `max`) mitten im Gespräch, ohne den Cache zu verlieren.
- Oberfläche in 7 Sprachen: Deutsch, Englisch, BKS, Slowenisch, Türkisch, Tschechisch, Slowakisch.
- API-Key-Weitergabe per QR-Code von Handy zu Handy.

## Schnellstart

Voraussetzung: Node.js ≥ 22.18.

```bash
npm ci
npm run dev:fake
```

Öffne http://localhost:5173/schulguide/ und gib den Test-Key `sk-ant-test-valid` ein. `dev:fake` startet einen lokalen Fake der Anthropic API (`tools/fake-anthropic`) – es entstehen keine Kosten.

Mit echter API: `npm run dev` und einen echten Key aus der [Anthropic Console](https://platform.claude.com) eingeben.

| Befehl | Zweck |
|---|---|
| `npm run dev:fake` | Entwicklung gegen die Fake-API |
| `npm run dev` | Entwicklung gegen die echte API |
| `npm run typecheck` · `npm run lint` · `npm test` | Typprüfung, Linting, Unit-Tests |
| `npm run e2e` | Browser-Tests (iPhone/WebKit, Android/Chromium) gegen die Fake-API; einmalig vorher `npx playwright install chromium webkit` |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run context:fetch` | Aktuelle Seiten der Schul-Homepage nach `context/raw/` laden |

## Forken und veröffentlichen

1. Repository forken.
2. Im Fork: **Settings → Pages → Source: GitHub Actions**.
3. **Actions** → Workflow „CI“ → *Run workflow* (oder einen Commit auf `main` pushen).

Die App läuft danach unter `https://<dein-account>.github.io/<repo-name>/`. Der Pfad wird beim Deploy automatisch aus dem Repo-Namen gesetzt (`BASE_PATH`), Umbenennen ist also kein Problem. Secrets sind keine nötig – der API-Key wird nie mitgebaut, sondern erst am Handy eingegeben.

## API-Key und Sicherheit

Der Key liegt im `localStorage` des Handys und wird direkt vom Browser an die Anthropic API geschickt. **Wer Zugriff auf ein Gerät mit Key hat, kann ihn auslesen** (z. B. in den Entwicklertools). Deshalb:

- Eigenen Workspace in der Anthropic Console nur für die Veranstaltung anlegen, mit Ausgabenlimit.
- Nur Prepaid-Guthaben, **automatisches Aufladen aus**.
- Key nur an Personen am Stand weitergeben (QR unter Einstellungen → „Key teilen“).
- Nach der Veranstaltung den Key in der Console widerrufen.

Wer den Key gar nicht auf die Geräte bringen will, braucht einen kleinen Proxy-Server (z. B. Cloudflare Worker), der den Key hält und Anfragen begrenzt – das ist bewusst nicht Teil dieses Projekts.

## An eine andere Schule anpassen

| Was | Wo |
|---|---|
| Wissensbasis | `context/schulinfo.md` (Quellen: `context/pages.json` für die Homepage, `context/source/` für die Broschüre) |
| Verhalten des Bots | `src/prompt/system-prompt.md` |
| Beispielfragen und Texte | `src/i18n/locales/*.ts` |
| Logo, Favicon | `public/` |
| Farben | `src/styles/global.css` |
| Modell, Default-Effort | `src/config.ts`, Preise in `src/domain/pricing.ts` |

Jede Änderung an Systemprompt oder Wissensbasis erzeugt beim ersten Aufruf einen neuen Cache-Eintrag – also nicht am Veranstaltungstag deployen.

## Weitere Dokumentation

- [`SPEC.md`](SPEC.md) – ursprüngliches Design-Dokument (Anforderungen, Cache-Konzept, Tests)
- [`docs/architecture.md`](docs/architecture.md) – Module, Datenfluss, Cache-Layout, Effort-Wechsel
- [`docs/testing.md`](docs/testing.md) – Unit-, Fake-Server- und E2E-Tests
- [`docs/deployment.md`](docs/deployment.md) – GitHub Pages, Base-Pfad, Key-Runbook
- [`docs/open-day-checklist.md`](docs/open-day-checklist.md) – manuelle Abnahme vor der Veranstaltung
