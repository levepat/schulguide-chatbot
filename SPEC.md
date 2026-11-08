# Technische Spezifikation: Schulguide-Chatbot der HTL Spengergasse

Diese Spezifikation richtet sich an ein LLM bzw. einen Coding-Agent, der die App implementiert, und an die Schülergruppe, die ihn steuert. Sie legt fest, **was** gebaut wird und welche Entscheidungen bereits getroffen sind. Wo die Spec etwas offenlässt (Styling-Details, Komponentenschnitt im Kleinen), entscheidet das implementierende Team.

Fließtext ist Deutsch; Bezeichner, Dateinamen, Code und Code-Kommentare sind Englisch.

Stand der API-Fakten: 2026-10-12 (Quelle: platform.claude.com/docs). Vor der Implementierung die verlinkten Doku-Seiten erneut prüfen, falls seither Zeit vergangen ist.

---

## 1. Ziel und Rahmen

### 1.1 Zweck

Am Infotag der HTL Spengergasse (13.11.2026, 13–18 Uhr, und 14.11.2026, 9–12 Uhr; „Kleiner Infotag“ am 22.01.2027) stellt die Abteilung Informatik an einer Station Showcases vor. Einer davon ist dieser Chatbot: Besucher fragen in natürlicher Sprache nach den Ausbildungsangeboten der Schule und bekommen Antworten auf Basis der Schulbroschüre und der Homepage.

Der Bot ist gleichzeitig Demonstrationsobjekt: Ein Panel „Blick unter die Haube“ zeigt pro Antwort Tokens, Cache-Treffer und Kosten, und die Effort-Stufe des Modells ist umschaltbar.

### 1.2 Nutzungsszenario

- Schülerinnen und Schüler zeigen die App **auf ihren eigenen Smartphones** vor; Besucher tippen unter Aufsicht.
- Es gibt kein Gesprächslimit. Neuladen der Seite oder „Neues Gespräch“ beginnt von vorn.
- Besucher sind Jugendliche (13–15), Eltern und Erwachsene mit Interesse an der Abend-/Erwachsenenform. Viele Eltern sprechen nicht Deutsch als Erstsprache.

### 1.3 Inhaltliche Leitplanken

- Auskunft über die **ganze Schule** (alle Abteilungen, Ausbildung ab 14 und ab 17). Die Informatik darf bei offenen Vergleichsfragen hervorgehoben werden, ohne andere Abteilungen abzuwerten.
- Antwort **in der Sprache der Frage**.
- Nur Fragen zur Schule; themenfremde Anfragen werden freundlich abgelehnt.
- Nur Fakten aus dem Kontext. Bei Unbekanntem: ehrlich sagen und auf die Lehrkräfte am Stand bzw. www.spengergasse.at verweisen. Keine erfundenen Termine, Fächer oder Kontakte.

### 1.4 Nicht im Umfang

Kein Backend/Proxy, keine Benutzerkonten, keine Speicherung von Gesprächen (weder lokal noch serverseitig), kein Logging von Fragen, keine Modellauswahl, kein RAG, keine Analytics, keine automatische Aktualisierung der Wissensbasis.

---

## 2. Architektur

```
┌───────────────────────── Smartphone (Browser) ─────────────────────────┐
│  React-SPA (GitHub Pages, statisch)                                    │
│                                                                        │
│  ┌──────────────┐   ┌───────────────────┐   ┌───────────────────────┐  │
│  │ UI-Komponenten│──▶│ useChat (State)   │──▶│ chatClient.ts         │──┼──HTTPS──▶ api.anthropic.com
│  └──────────────┘   └───────────────────┘   │  @anthropic-ai/sdk    │  │          /v1/messages (Stream)
│         ▲                     │             │  dangerouslyAllow-    │  │          /v1/models   (Key-Check)
│         │                     ▼             │  Browser: true        │  │
│         │           ┌───────────────────┐   └───────────────────────┘  │
│         │           │ requestBuilder.ts │  (rein, getestet)            │
│         │           │ costCalculator.ts │  (rein, getestet)            │
│         │           └───────────────────┘                              │
│  localStorage: API-Key, UI-Sprache                                     │
│  Bundle: system-prompt.md + schulinfo.md (?raw-Import, byte-stabil)    │
└────────────────────────────────────────────────────────────────────────┘

Build-Zeit (einmalig, manuell):
  WordPress-REST-API ──fetchPages.ts──▶ context/raw/*.md ─┐
  Broschüre (PDF) ────────────────────────────────────────┼─▶ Claude Code (Opus 5.5) + BUILD_PROMPT.md
                                                          └─▶ context/schulinfo.md ──▶ menschliches Review ──▶ commit

Test (lokal und CI):
  App ──VITE_ANTHROPIC_BASE_URL──▶ tools/fake-anthropic (node:http, feste Antworten, keine Kosten)
```

### 2.1 Sicherheitsmodell (bewusste Entscheidung)

- GitHub Pages kann keine Geheimnisse halten. Der Anthropic-API-Key wird daher **nicht** gebündelt, sondern vom Benutzer eingegeben und im `localStorage` des Geräts gespeichert.
- Die Seite selbst ist öffentlich erreichbar, ist aber ohne Key nutzlos. Bundle und Repo enthalten keine Geheimnisse; der Kontext stammt aus öffentlichen Quellen.
- Der Key ist auf jedem Gerät, auf dem er gespeichert ist, auslesbar. Das ist akzeptiert, weil nur bekannte Schüler ihn erhalten. Absicherung auf Anthropic-Seite: Der Lehrer erstellt den Key selbst, das Konto hat **keine automatische Aufbuchung** (Prepaid-Guthaben begrenzt den Schaden), im Notfall wird der Key in der Console widerrufen und ein neuer ausgegeben.
- Der Browser ruft die API direkt auf. Das SDK setzt dafür den Header `anthropic-dangerous-direct-browser-access: true`, ohne den die API keine CORS-Header liefert.

---

## 3. Technologie

| Bereich | Wahl |
|---|---|
| Laufzeit (Build/Tools) | Node.js 26 (führt `.ts` per Type-Stripping direkt aus; daher in `tools/` nur „erasable syntax“: keine `enum`, kein `namespace`, keine Parameter-Properties) |
| Frontend | Vite, React, TypeScript (`strict: true`) |
| Styling | Schlichtes CSS bzw. CSS-Modules, **keine** UI-Bibliothek |
| Markdown in Antworten | `react-markdown` + `remark-gfm` (Tabellen für Stundentafeln); kein Raw-HTML; Links mit `target="_blank" rel="noopener noreferrer"` |
| API | `@anthropic-ai/sdk` (aktuelle Version, siehe 6.6) |
| QR-Code | `qrcode` (Erzeugen als Canvas/SVG) |
| Unit-Tests | Vitest |
| E2E-Tests | `@playwright/test` gegen den Fake-Endpunkt; `playwright-cli` zum interaktiven Erkunden |
| Kontext-Fetch | `turndown` + `turndown-plugin-gfm` (HTML → Markdown) als devDependency |
| Hosting | GitHub Pages, Deployment per GitHub Action |

Die Konvention „eine Komponente / ein Modul mit einer Verantwortung pro Datei“ gilt durchgehend.

---

## 4. Repo-Struktur

Privates Repo in der GitHub-Organisation `Die-Spengergasse` (Education-Plan, daher Pages aus privatem Repo möglich). Repo-Name in dieser Spec: `schulguide`.

```
schulguide/
├─ .github/workflows/ci.yml
├─ context/
│  ├─ BUILD_PROMPT.md            # Anweisungen für Claude Code (Anhang B)
│  ├─ pages.json                 # feste Liste der Homepage-Seiten (Anhang C)
│  ├─ source/
│  │  └─ Broschuere-2025-11-02-2025-web.pdf
│  ├─ raw/                       # Ausgabe von context:fetch (committet)
│  │  ├─ _meta.json              # Abrufzeitpunkt, Seitenliste
│  │  └─ 2096-termine-schuljahr-2026-27.md …
│  ├─ CONFLICTS.md               # von Claude Code erzeugte Widerspruchsliste (Review)
│  └─ schulinfo.md               # aufbereitete Wissensbasis (committet, reviewt)
├─ e2e/                          # @playwright/test-Specs
├─ public/
│  ├─ logo-spengergasse-white.png
│  └─ favicon.png
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ config.ts                  # Modell, max_tokens, Beta-Header, Base-URL
│  ├─ api/
│  │  ├─ chatClient.ts           # einziges Modul, das das SDK kennt
│  │  ├─ requestBuilder.ts       # rein: Gesprächszustand → Request-Parameter
│  │  └─ apiErrors.ts            # SDK-Fehler → fachliche Fehlerarten
│  ├─ domain/
│  │  ├─ types.ts                # Effort, Turn, TurnUsage, …
│  │  ├─ pricing.ts              # Preiskonstanten
│  │  ├─ costCalculator.ts       # rein
│  │  ├─ keyFragment.ts          # rein: Key aus/in URL-Fragment
│  │  └─ viennaDate.ts           # rein: heutiges Datum in Europe/Vienna
│  ├─ prompt/
│  │  ├─ system-prompt.md        # Anhang A
│  │  └─ staticPrefix.ts         # setzt system-prompt.md + schulinfo.md zusammen
│  ├─ i18n/
│  │  ├─ types.ts                # Locale, Translations
│  │  ├─ detectLocale.ts
│  │  ├─ LocaleProvider.tsx
│  │  └─ locales/{de,en,bks,sl,tr,cs,sk}.ts
│  ├─ hooks/
│  │  ├─ useApiKey.ts
│  │  └─ useChat.ts
│  ├─ components/                # eine Komponente pro Datei (siehe 8)
│  └─ styles/
├─ tools/
│  ├─ fetch-homepage/fetchPages.ts
│  └─ fake-anthropic/
│     ├─ server.ts
│     ├─ sse.ts
│     └─ cacheSimulator.ts
├─ playwright.config.ts
├─ vite.config.ts
└─ package.json
```

### 4.1 npm-Skripte

| Skript | Zweck |
|---|---|
| `dev` | Vite-Dev-Server gegen die echte API |
| `dev:fake` | Fake-Server und Vite parallel, `VITE_ANTHROPIC_BASE_URL=http://localhost:4010` |
| `fake` | `node tools/fake-anthropic/server.ts` |
| `build` / `preview` | Produktionsbuild / lokale Vorschau |
| `typecheck` | `tsc -b` |
| `lint` | ESLint |
| `test` | `vitest run` |
| `e2e` | `playwright test` |
| `context:fetch` | `node tools/fetch-homepage/fetchPages.ts` |
| `context:tokens` | Optional: zählt die Tokens des statischen Präfixes über `POST /v1/messages/count_tokens` (kostenlos, braucht `ANTHROPIC_API_KEY`) |

---

## 5. Kontext-Pipeline (Wissensbasis)

Die Wissensbasis ist klein genug (geschätzt 25–35k Tokens), dass sie vollständig in jeden Request kommt. RAG lohnt sich nicht.

Die vorhandene markitdown-Konvertierung der Broschüre ist **unbrauchbar** (keine Überschriften, mehrspaltige Seiten zeilenweise vermischt, Stundentafeln zerstört, Silbentrennungen). Deshalb liest in Schritt 2 ein starkes Modell das PDF direkt.

### Schritt 1: Rohdaten der Homepage holen (deterministisch)

`npm run context:fetch`:

1. Liest `context/pages.json` (Anhang C).
2. Holt jede Seite über die offene WordPress-REST-API: `GET https://www.spengergasse.at/index.php?rest_route=/wp/v2/pages/<id>&_fields=id,title,link,modified,content`.
3. Wandelt `content.rendered` mit `turndown` (+ GFM-Tabellen) in Markdown um; entfernt Shortcodes, leere Zeilen-Kaskaden, Bilder.
4. Schreibt `context/raw/<id>-<slug>.md` mit einem Kopf aus Titel, URL, `modified` und Abrufzeitpunkt.
5. Schreibt `context/raw/_meta.json` (Abrufzeitpunkt, Liste der Dateien). Bricht mit Exit-Code ≠ 0 ab, wenn eine Seite nicht 200 liefert.

### Schritt 2: Strukturieren mit Claude Code (Opus 5.5, Abo)

In Claude Code mit Modell Opus 5.5 im Repo-Root: „Führe die Anweisungen in `context/BUILD_PROMPT.md` aus.“

Claude liest das PDF seitenweise **visuell** (Read-Tool mit `pages`), dazu alle Dateien in `context/raw/`, und erzeugt `context/schulinfo.md` sowie `context/CONFLICTS.md`. Regeln und Zielstruktur stehen in Anhang B. Die wichtigsten:

- Die Homepage hat Vorrang vor der Broschüre (Broschüre: Ausgabe 2025-02; Homepage: aktuell). Die Broschüre ergänzt, was die Homepage nicht hat (Stundentafeln, Abteilungsbeschreibungen).
- Widersprüche werden im Build-Schritt aufgelöst, nicht zur Laufzeit; jeder aufgelöste Widerspruch landet in `CONFLICTS.md`.
- Termine als absolute Daten mit Wochentag; Vergangenes und Veraltetes entfällt.

### Schritt 3: Menschliches Review

Vor dem Commit prüft ein Mensch `schulinfo.md` gegen die Quellen, mindestens: alle Termine, alle Telefonnummern/E-Mail-Adressen, je eine Stundentafel pro Ausbildungsform, die Aufnahmekriterien. `CONFLICTS.md` wird durchgesehen.

### Aktualisierung

Manuell: Schritte 1–3 wiederholen. Jede Änderung an `schulinfo.md` oder `system-prompt.md` ändert den Cache-Präfix; der erste Request danach schreibt den Cache neu (siehe 6.2). Am Infotag selbst deshalb nicht mehr deployen.

---

## 6. API-Anbindung

### 6.1 Konstanten (`src/config.ts`)

```ts
export const MODEL = "claude-sonnet-5-5";
export const MAX_TOKENS = 32_000;            // upper bound only, not billed; thinking counts towards it
export const EFFORT_BETA = "mid-conversation-output-config-2026-07-01";
export const DEFAULT_EFFORT: Effort = "low";
export const API_BASE_URL: string | undefined = import.meta.env.VITE_ANTHROPIC_BASE_URL; // undefined → SDK default
```

`Effort` ist `"low" | "medium" | "high" | "xhigh" | "max"`. Sonnet 5.5 unterstützt alle fünf Stufen.

### 6.2 Aufbau des Requests und Caching

Ziel ist eine maximale Cache-Trefferquote. Gecacht wird ein **Präfix** in der Reihenfolge `tools → system → messages`; jede Byte-Änderung im Präfix macht alles danach ungültig. Cache-Reads kosten bei Sonnet 5.5 nur 5 % des Input-Preises. Mindestlänge eines cachebaren Präfixes: 512 Tokens.

Request (Pseudocode, Feldnamen wie in der API):

```ts
{
  model: MODEL,
  max_tokens: MAX_TOKENS,
  betas: [EFFORT_BETA],
  cache_control: { type: "ephemeral" },                 // automatic caching, 5 min, moves with the conversation
  output_config: { effort: conversation.initialEffort }, // fixed for the whole conversation
  thinking: { type: "adaptive", display: "summarized" },
  system: [
    { type: "text", text: STATIC_PREFIX, cache_control: { type: "ephemeral", ttl: "1h" } },
    { type: "text", text: "Today's date: 2026-11-13 (Friday)." },
  ],
  messages: [ /* see 6.3 */ ],
}
```

Regeln:

1. **System-Block 1** (`STATIC_PREFIX`) ist byte-stabil: `system-prompt.md` und `schulinfo.md` werden per `?raw` importiert und in `staticPrefix.ts` deterministisch zusammengesetzt:
   `systemPrompt + "\n\n<school_info>\n" + schoolInfo + "\n</school_info>\n"`.
   Kein Datum, keine Uhrzeit, keine Sprache, keine IDs in diesem Block. Weil alle Geräte denselben Key (dieselbe Organisation/Workspace) und dasselbe Bundle nutzen, teilen sich **alle Handys einen Cache**.
2. Block 1 hat einen expliziten Breakpoint mit `ttl: "1h"` (Write 2× Input-Preis, überlebt ruhige Phasen am Stand). Jeder Treffer verlängert die TTL kostenlos.
3. **System-Block 2** enthält nur das Datum (Europe/Vienna, ohne Uhrzeit, Format `YYYY-MM-DD (Weekday)`), erzeugt von `viennaDate.ts`. Es ändert sich einmal täglich und steht hinter dem 1h-Breakpoint.
4. Das Top-Level-`cache_control` (automatisches Caching, 5 min) setzt den Breakpoint auf den letzten Block der `messages`. Jede Folgefrage liest damit den bisherigen Verlauf aus dem Cache.
5. Längere TTLs müssen vor kürzeren stehen (hier erfüllt: 1h vor 5m). Ein expliziter Marker am **letzten** Block mit anderer TTL als das Top-Level-`cache_control` ergibt 400 – daher keine expliziten Marker in `messages`.
6. Top-Level-`output_config.effort` bleibt während eines Gesprächs **unverändert** (Wert des ersten Turns). Wechsel laufen ausschließlich über Effort-Nachrichten pro Turn (6.3), sonst ist der Message-Cache verloren.
7. Die Thinking-Konfiguration bleibt während eines Gesprächs unverändert.

Erwartetes Verhalten (prüfbar über `usage`):

| Situation | `cache_read_input_tokens` | `cache_creation_input_tokens` |
|---|---|---|
| Allererster Request nach Deployment bzw. > 1 h Pause | 0 | ≈ Größe Block 1 (+ Rest) |
| Erste Frage eines neuen Gesprächs, Block 1 warm | ≈ Größe Block 1 | klein (Datum + Frage) |
| Folgefrage innerhalb 5 min | ≈ Block 1 + bisheriger Verlauf | klein (letzte Antwort + neue Frage) |

### 6.3 Gesprächsverlauf und Effort-Wechsel

Domänenmodell (`domain/types.ts`, sinngemäß):

```ts
type Effort = "low" | "medium" | "high" | "xhigh" | "max";

interface UserTurn { role: "user"; text: string; effort: Effort }

interface AssistantTurn {
  role: "assistant";
  content: ApiContentBlock[];   // exactly as returned by the API, incl. thinking blocks with signature
  usage: TurnUsage;
  effort: Effort;
  timing: { firstTokenMs: number | null; totalMs: number };
  stopReason: string | null;
}

interface Conversation { initialEffort: Effort; turns: (UserTurn | AssistantTurn)[] }
```

`requestBuilder.ts` erzeugt aus `Conversation` die `messages`:

- User-Turn → `{ role: "user", content: [{ type: "text", text }] }`.
- Assistant-Turn → `{ role: "assistant", content }` mit den **unveränderten** Content-Blöcken der API-Antwort. Thinking-Blöcke samt `signature` müssen 1:1 zurückgeschickt werden; jede Umformung bricht Cache und ggf. Validierung.
- **Effort-Wechsel:** Weicht die Effort-Stufe eines User-Turns von der zuletzt wirksamen Stufe ab, wird **direkt vor** diesem User-Turn eine Effort-Nachricht eingefügt:
  `{ role: "system", content: [], output_config: { effort: "<neue Stufe>" } }`.
  Die Stufe gilt ab dem nächsten User-Turn, bis eine weitere Effort-Nachricht sie ändert. Alles davor bleibt unverändert, der Cache-Präfix trifft weiter. Voraussetzung: Beta-Header `mid-conversation-output-config-2026-07-01` und adaptives Thinking (mit `thinking: {type: "between_tools"}` wäre ein Wechsel ein 400-Fehler).
- Der Builder ist eine reine Funktion `(conversation, today) → MessageCreateParams` ohne Zugriff auf SDK, DOM oder Uhr.

### 6.4 Thinking

- Aktuelle Modelle geben **nie die rohe Chain of Thought** aus, sondern höchstens eine Zusammenfassung. Bei Sonnet 5.5 ist `display: "omitted"` Standard (leerer Thinking-Block); mit `display: "summarized"` wird die Zusammenfassung ohne Aufpreis mitgeliefert.
- Abgerechnet werden immer die vollen internen Thinking-Tokens. Ihre Zahl steht in `usage.output_tokens_details.thinking_tokens` (beim Streaming nur im finalen `message_delta`).
- Die UI zeigt die Zusammenfassung eingeklappt über der Antwort („💭 Gedankengang (Zusammenfassung)“); bei `low` fehlt sie meist.
- Das implementierende LLM prüft vor der Umsetzung die aktuelle Doku: https://platform.claude.com/docs/en/build-with-claude/thinking und …/adaptive-thinking.

### 6.5 Streaming und Ergebnis

`chatClient.ts` kapselt das SDK vollständig; UI und Hooks kennen nur Domänentypen.

```ts
interface ChatClient {
  validateKey(apiKey: string, signal?: AbortSignal): Promise<KeyValidationResult>; // GET /v1/models
  streamReply(params: StreamReplyParams, handlers: StreamHandlers, signal: AbortSignal): Promise<AssistantTurn>;
}

interface StreamHandlers {
  onThinkingDelta(text: string): void;
  onTextDelta(text: string): void;
}
```

- Instanz: `new Anthropic({ apiKey, baseURL: API_BASE_URL, dangerouslyAllowBrowser: true })`.
- Streaming über `client.beta.messages.stream(...)` (Beta wegen des Effort-Headers).
- `firstTokenMs` = Zeit bis zum ersten `text_delta` oder `thinking_delta`; `totalMs` = Zeit bis `message_stop`.
- Nach Abschluss liefert `finalMessage()` `content`, `stop_reason` und die vollständige `usage` (Cache-Felder kommen mit `message_start`, Output-Zahlen und `output_tokens_details` mit dem finalen `message_delta`).
- Abbruch über `AbortSignal` (z. B. „Neues Gespräch“ während einer laufenden Antwort).

### 6.6 SDK-Typen

Die SDK-Version muss Top-Level-`cache_control`, `output_config.effort`, `thinking.display` und per-message `output_config` typisiert unterstützen; ggf. auf die neueste Version aktualisieren. Fehlt ein Feld dennoch in den Typen, wird **ein** schmaler lokaler Typ in `chatClient.ts` definiert und dort an genau einer Stelle gecastet (mit Kommentar). Kein `any` im restlichen Code.

### 6.7 Fehlerbehandlung (`apiErrors.ts`)

| Ursache | Fachliche Fehlerart | Verhalten der UI |
|---|---|---|
| 401 | `invalidKey` | Key löschen, zurück zum Einrichtungsbildschirm mit Hinweis „Key ungültig oder widerrufen“ |
| 400 mit Hinweis auf Guthaben/Billing | `noCredit` | Meldung „Guthaben aufgebraucht – bitte Lehrkraft informieren“ |
| 429, 529, 5xx | `temporary` | Meldung mit „Nochmal versuchen“ (wiederholt die letzte Frage); das SDK wiederholt zuvor bereits automatisch |
| sonstige 400 | `badRequest` | Meldung mit Fehlertext im Panel (hilft beim Debuggen) |
| Netzwerkfehler | `network` | Meldung „Keine Verbindung“ |
| Abbruch durch Benutzer | – | still verwerfen |
| `stop_reason: "max_tokens"` | – | Antwort anzeigen, Hinweis „abgeschnitten“ |
| `stop_reason: "refusal"` | – | Antwort anzeigen wie geliefert |

Alle Meldungen kommen aus dem i18n-Wörterbuch.

---

## 7. API-Key-Verwaltung

### 7.1 Speicherung

- `localStorage`-Schlüssel `schulguide.apiKey`. Zusätzlich `schulguide.locale` für die UI-Sprache. Sonst nichts.
- `useApiKey` stellt `apiKey`, `saveKey(key)`, `clearKey()` bereit.

### 7.2 Erst-Einrichtung (Textfeld)

Ohne gespeicherten Key zeigt die App den Einrichtungsbildschirm: Textfeld (Typ `password`, mit Einblenden-Schalter), Button „Speichern“. Vor dem Speichern prüft `validateKey` den Key mit `GET /v1/models` (kostenlos). Bei 401: Fehlermeldung, nichts speichern.

### 7.3 Weitergabe per QR-Code (Link mit Fragment)

- Einstellungen → „Key teilen“ zeigt einen QR-Code mit der URL
  `<origin><BASE_URL>#key=<url-encodierter Key>` (`BASE_URL` = `import.meta.env.BASE_URL`).
- Das zweite Handy scannt mit der **normalen Kamera-App**; die Seite öffnet sich. Die App braucht keinen eigenen Scanner und keinen Kamerazugriff.
- Beim Start liest `keyFragment.ts` den Key aus `location.hash`, entfernt das Fragment sofort mit `history.replaceState` (vor jeder weiteren Verarbeitung), prüft den Key wie in 7.2 und speichert ihn bei Erfolg.
- Das Fragment wird vom Browser nie an einen Server gesendet.
- Unter dem QR-Code steht ein Hinweis, dass jeder mit diesem Code den Key nutzen kann.

### 7.4 Einstellungen

Dialog (Zahnrad in der Kopfzeile) mit: maskierter Key (`sk-ant-…` + letzte 4 Zeichen), „Key teilen (QR)“, „Key ersetzen“, „Key löschen“ (mit Bestätigung).

---

## 8. Benutzeroberfläche

### 8.1 Grundsätze

- Mobile-first (Zielbreite 360–430 px), funktioniert auch am Desktop.
- Eine einzige Seite. Zustände: `setup` (kein Key) und `chat`.
- Branding: Logo der HTL Spengergasse (weiße Variante, lokal in `public/`, nicht hotlinken; Quelle: `https://www.spengergasse.at/wp-content/uploads/2020/04/SpengerLogo_720px_weiss_neu-e1586334374714.png`) auf rotem Header. Farben von spengergasse.at:

  | Token | Wert | Verwendung |
  |---|---|---|
  | `--color-primary` | `#ED1944` | Header, Primärbuttons |
  | `--color-secondary` | `#004A8D` | Links, Akzente, Effort-Auswahl |
  | `--color-surface` | `#EDEDED` | Hintergrund Bot-Nachrichten, Panels |
  | `--color-text` | `#313131` | Fließtext |

- Barrierearmut: ausreichender Kontrast, alle Buttons beschriftet (`aria-label` bei Icon-Buttons), der Streaming-Bereich mit `aria-live="polite"`.

### 8.2 Komponenten (eine pro Datei, Vorschlag)

| Komponente | Aufgabe |
|---|---|
| `App` | wählt `SetupScreen` oder `ChatScreen`, verarbeitet das Key-Fragment beim Start |
| `Header` | Logo, Titel, `LanguageSelector`, Zahnrad |
| `SetupScreen` | Key-Eingabe und -Prüfung (7.2) |
| `SettingsDialog` | 7.4 |
| `ShareKeyQr` | QR-Code (7.3) |
| `ChatScreen` | Layout des Chats |
| `ExampleQuestions` | 4–6 antippbare Chips im leeren Zustand, in der UI-Sprache (Anhang D) |
| `MessageList` / `MessageBubble` | Verlauf; Bot-Antworten als Markdown |
| `ThinkingDisclosure` | eingeklappte Thinking-Zusammenfassung (6.4) |
| `UsagePanel` | „Blick unter die Haube“ pro Antwort (8.4) |
| `ConversationTotals` | Summen pro Gespräch |
| `EffortSelector` | Segment-Umschalter mit fünf Stufen über dem Eingabefeld, Standard `low` |
| `Composer` | Eingabefeld, Senden, „Neues Gespräch“ |
| `LanguageSelector` | 8.5 |

Zustand und Ablauf des Chats liegen in `useChat` (Senden, Streaming-Zwischenstand, Abbruch, Fehler, Wiederholen, Zurücksetzen). Komponenten rufen nie direkt `chatClient` auf.

### 8.3 Verhalten im Chat

- Antworten werden live gestreamt; während des Streamings ist Senden gesperrt, „Neues Gespräch“ bricht ab.
- „Neues Gespräch“ leert den Verlauf, setzt `initialEffort` auf die aktuell gewählte Stufe und zeigt wieder die Beispielfragen.
- Der Verlauf wird nicht gespeichert. Neuladen = neues Gespräch.
- Kein Gesprächslimit.

### 8.4 Panel „Blick unter die Haube“

Ausklappbar an jeder Bot-Antwort (Standard: eingeklappt, mit einer Kurzzeile wie „0,3 ¢ · 97 % aus dem Cache · low“). Inhalt:

- Effort-Stufe dieser Antwort.
- Tokens: frischer Input (`input_tokens`), Cache-Write 5 min / 1 h (`cache_creation.ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens`), Cache-Read (`cache_read_input_tokens`), Output (`output_tokens`), davon Thinking (`output_tokens_details.thinking_tokens`).
- Cache-Trefferquote = `cache_read / (input + cache_creation + cache_read)`.
- Zeit bis zur ersten Ausgabe und Gesamtzeit.
- Kosten dieser Antwort in USD und **„ohne Cache hätte es X gekostet“**.

`ConversationTotals` zeigt dieselben Summen für das ganze Gespräch.

### 8.5 Mehrsprachige Oberfläche

- UI-Sprachen (`Locale`): `de`, `en`, `bks` (Bosnisch/Kroatisch/Serbisch, eine gemeinsame Fassung in lateinischer Schrift), `sl`, `tr`, `cs`, `sk`.
- Startsprache aus `navigator.languages` (erster Treffer per Präfix; `bs`, `hr`, `sr`, `sr-Latn` → `bks`), sonst `de`. Eine gespeicherte Wahl (`schulguide.locale`) hat Vorrang.
- `LanguageSelector` zeigt Sprachnamen in der jeweiligen Sprache, **keine Flaggen**: Deutsch, English, Bosanski/Hrvatski/Srpski, Slovenščina, Türkçe, Čeština, Slovenčina.
- `<html lang>` folgt der Wahl (`bks` → `hr`).
- Wörterbuch ohne i18n-Bibliothek: `interface Translations` in `i18n/types.ts`, je Sprache eine Datei `const en: Translations = { … }`. Fehlende Schlüssel sind damit Compilerfehler.
- Übersetzungen erzeugt das implementierende LLM; Personen mit der jeweiligen Sprache lesen gegen.
- Die **Antwortsprache** des Bots bestimmt der System-Prompt (Sprache der Frage), nicht die UI-Sprache.

---

## 9. Kostenberechnung

### 9.1 Preise (`domain/pricing.ts`)

Claude Sonnet 5.5, USD pro Million Tokens (Quelle: https://platform.claude.com/docs/en/about-claude/pricing, Stand 2026-10-12):

| Posten | Preis |
|---|---|
| Input | 2,00 |
| Cache-Write 5 min (1,25×) | 2,50 |
| Cache-Write 1 h (2×) | 4,00 |
| Cache-Read (0,05×) | 0,10 |
| Output (inkl. Thinking) | 10,00 |

Quelle und Datum stehen als Kommentar in der Datei.

### 9.2 Formeln (`domain/costCalculator.ts`, reine Funktionen)

```
cost        = (input·2.00 + write5m·2.50 + write1h·4.00 + cacheRead·0.10 + output·10.00) / 1e6
costNoCache = ((input + write5m + write1h + cacheRead)·2.00 + output·10.00) / 1e6
```

Fehlt die Aufschlüsselung `cache_creation`, wird `cache_creation_input_tokens` als 5-min-Write gerechnet. Anzeige in Cent mit zwei Nachkommastellen, wenn < 1 USD.

Größenordnung: Bei ~30k Tokens Kontext kostet eine Folgefrage mit `low` etwa 0,3–0,5 Cent; ohne Cache wären es rund 6 Cent.

---

## 10. Tests

### 10.1 Unit-Tests (Vitest)

Nur reine Logik, keine Netzwerkzugriffe:

- `costCalculator`: alle Posten, fehlende Aufschlüsselung, „ohne Cache“-Vergleich.
- `requestBuilder`:
  - Block 1 hat `cache_control` mit `ttl: "1h"`, Block 2 enthält nur das Datum und hat keinen Marker; Top-Level-`cache_control` gesetzt.
  - `STATIC_PREFIX` ist für zwei Aufrufe byte-gleich und enthält kein Datum.
  - Top-Level-Effort bleibt `initialEffort`, auch nach Wechseln.
  - Effort-Nachricht wird genau vor dem User-Turn mit geänderter Stufe eingefügt, nicht bei gleichbleibender Stufe.
  - Assistant-Content (inkl. Thinking-Block mit `signature`) wird unverändert übernommen.
  - Beta-Header ist gesetzt.
- `keyFragment`: Key lesen, URL-Decoding, kein/leerer Key, andere Fragment-Parameter, URL-Erzeugung mit `BASE_URL`.
- `viennaDate`: Datumsgrenze um Mitternacht in Wien (fixe Uhrzeit injizieren).
- `detectLocale`: Präfix-Matching, BKS-Varianten, Fallback.

### 10.2 Fake-Anthropic-Endpunkt (`tools/fake-anthropic/`)

Kleiner Server ohne Abhängigkeiten (`node:http`, TypeScript, Port 4010). Er erlaubt Tests ohne Kosten und macht sichtbar, ob die App die Requests richtig aufbaut.

- **CORS:** beantwortet `OPTIONS` und setzt `Access-Control-Allow-Origin: *`; `Access-Control-Allow-Headers` spiegelt `Access-Control-Request-Headers` (das SDK sendet u. a. `x-api-key`, `anthropic-*`, `x-stainless-*`).
- **`GET /v1/models`:** 200 mit einer kleinen Modellliste für den Key `sk-ant-test-valid`, sonst 401 im Fehlerformat der API.
- **`POST /v1/messages`:**
  - 401 bei falschem Key.
  - 400 im API-Fehlerformat, wenn eine `role: "system"`-Nachricht in `messages` steht, aber der Beta-Header `mid-conversation-output-config-2026-07-01` fehlt; ebenso, wenn ein zurückgeschickter Thinking-Block keine `signature` hat.
  - Ermittelt die **wirksame Effort-Stufe** (Top-Level plus letzte Effort-Nachricht vor dem letzten User-Turn) und zählt die User-Turns.
  - Streamt SSE wie die echte API (`message_start`, `content_block_start/delta/stop`, `message_delta`, `message_stop`) mit ~30 ms Pause zwischen den Textstücken. Text: `Fake-Antwort #<n>, effort=<stufe>.` plus ein fester Markdown-Absatz mit Liste und Tabelle (testet das Rendering).
  - Bei `thinking.display === "summarized"` und Effort `high`, `xhigh` oder `max` zuerst ein Thinking-Block mit festem Text und `signature: "fake-signature"`.
  - **Simuliertes Caching** (`cacheSimulator.ts`, Tokens ≈ Zeichen/4):
    - Block 1 mit `cache_control` (`ttl: "1h"`): beim ersten Mal `ephemeral_1h_input_tokens`, danach `cache_read_input_tokens`.
    - Messages mit Top-Level-`cache_control`: Der Server merkt sich Hashes der Message-Präfixe jedes Requests. Der längste bereits bekannte Präfix zählt als Cache-Read, der Rest als 5-min-Write.
    - Ohne `cache_control` wird nichts gecacht, alles zählt als `input_tokens`. So fällt ein falsch platzierter Marker im Test auf.
  - `usage` enthält alle Felder wie die echte API, inkl. `cache_creation.{ephemeral_5m_input_tokens, ephemeral_1h_input_tokens}` und `output_tokens_details.thinking_tokens`.
- **`GET /__last-request`:** liefert Header und Body des letzten `POST /v1/messages`.
- **`POST /__reset`:** leert Cache-Simulation und letzten Request (vor jedem E2E-Test).
- **`POST /__fail-next`** mit `{ "status": 401 | 429 | 529 }`: Der nächste Messages-Request scheitert mit diesem Status (zum Testen der Fehlerpfade).

### 10.3 E2E-Tests (`@playwright/test`)

`playwright.config.ts` startet per `webServer` den Fake-Server und `vite preview` (Build mit `VITE_ANTHROPIC_BASE_URL=http://localhost:4010`). Projekte: ein iPhone-Profil (WebKit) und ein Android-Profil (Chromium).

Testfälle (mindestens):

1. Ohne Key erscheint der Einrichtungsbildschirm; ein falscher Key zeigt einen Fehler; `sk-ant-test-valid` führt zum Chat.
2. Aufruf mit `#key=sk-ant-test-valid` speichert den Key und entfernt das Fragment aus der URL.
3. Tippen auf eine Beispielfrage sendet sie; die Antwort erscheint schrittweise und wird als Markdown gerendert (Liste/Tabelle sichtbar).
4. Zweite Frage: Das Panel zeigt Cache-Read > 0; `/__last-request` zeigt den 1h-Marker an Block 1 und Top-Level-`cache_control`.
5. Effort-Wechsel auf `high`: Antworttext nennt `effort=high`, Thinking-Zusammenfassung ist vorhanden und einklappbar, Cache-Read bleibt > 0, Top-Level-Effort im Request unverändert.
6. Sprachwechsel auf Türkçe ändert Oberfläche und Beispielfragen; nach Neuladen bleibt die Wahl erhalten.
7. `/__fail-next` 401 führt zurück zur Einrichtung; 529 zeigt „Nochmal versuchen“, das danach funktioniert.
8. „Neues Gespräch“ leert den Verlauf und zeigt die Beispielfragen.
9. „Key teilen“ zeigt einen QR-Code; „Key löschen“ führt zur Einrichtung.

### 10.4 Interaktives Erkunden mit `playwright-cli`

Während der Entwicklung nutzt der Coding-Agent `playwright-cli`, um die laufende App (`npm run dev:fake`) im Browser zu bedienen, Screenshots zu machen und Layoutprobleme auf schmalen Viewports zu finden. Daraus entstehen keine Testdateien; Erkenntnisse werden als `@playwright/test`-Fälle festgehalten, wenn sie dauerhaft geprüft werden sollen.

---

## 11. CI/CD und Deployment

### 11.1 Arbeitsweise

Die Schüler arbeiten in Feature-Branches und mergen per Pull Request nach `main`. `main` ist geschützt: Merge nur per PR, Status-Check `test` muss grün sein.

### 11.2 Workflow `.github/workflows/ci.yml`

Auslöser: `pull_request` (Ziel `main`) und `push` auf `main`.

Job `test` (immer):
1. Checkout, `actions/setup-node` mit Node 26, `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npx playwright install --with-deps`, `npm run e2e` (startet Fake-Server und Preview selbst)
6. Bei Fehlschlag: Playwright-Report als Artefakt hochladen

Job `deploy` (nur bei `push` auf `main`, `needs: test`):
1. `npm ci`, `npm run build` (ohne `VITE_ANTHROPIC_BASE_URL`, also gegen die echte API)
2. `actions/upload-pages-artifact` mit `dist/`, dann `actions/deploy-pages`
3. Permissions: `pages: write`, `id-token: write`; Environment `github-pages`

Die echte API wird in der CI nie aufgerufen; es gibt daher keine Secrets im Repo.

### 11.3 Vite-Konfiguration

`base: "/schulguide/"` (Repo-Name). Alle Links und die QR-URL verwenden `import.meta.env.BASE_URL`.

---

## 12. Konfiguration (Übersicht)

| Wert | Ort | Hinweis |
|---|---|---|
| Modell, `max_tokens`, Beta-Header, Standard-Effort | `src/config.ts` | Modell bewusst fix (Kostenrisiko teurerer Modelle) |
| Preise | `src/domain/pricing.ts` | mit Quelle und Datum |
| API-Base-URL | `VITE_ANTHROPIC_BASE_URL` | nur für Fake/Tests; leer = echte API |
| API-Key | `localStorage` des Geräts | nie im Repo, nie im Bundle |
| Homepage-Seitenliste | `context/pages.json` | Anhang C |
| `ANTHROPIC_API_KEY` | Umgebungsvariable lokal | nur für das optionale `context:tokens` |

---

## 13. Abnahmekriterien

### Automatisch (CI)

- [ ] `typecheck`, `lint`, `test`, `e2e` grün; Deployment nur nach grünem `test`.
- [ ] Alle Testfälle aus 10.1 und 10.3 vorhanden.

### Manuell gegen die echte API (vor dem Infotag)

- [ ] Erste Frage nach > 1 h Pause: `cache_creation` (1h) ≈ Größe von Block 1. Zweite Frage im selben Gespräch: Cache-Trefferquote ≥ 90 %.
- [ ] Erste Frage eines **neuen** Gesprächs auf einem **anderen** Handy innerhalb 1 h: Cache-Read ≈ Größe von Block 1 (gemeinsamer Cache).
- [ ] Effort-Wechsel mitten im Gespräch: Cache-Read der nächsten Antwort bleibt hoch.
- [ ] Mit `max`: Thinking-Zusammenfassung wird angezeigt, Thinking-Tokens im Panel > 0.
- [ ] Kosten einer Folgefrage mit `low` < 1 Cent.
- [ ] „Wann ist der Infotag?“ → 13.11.2026 (13–18 Uhr) und 14.11.2026 (9–12 Uhr). Am 14.11. gestellt, erkennt der Bot, dass der Freitag vorbei ist.
- [ ] Frage auf Englisch, Türkisch und Kroatisch → Antwort in derselben Sprache.
- [ ] „Schreib mir ein Gedicht“ → freundliche Ablehnung mit Angebot einer Schulfrage.
- [ ] Frage nach etwas, das nicht im Kontext steht (z. B. Schulbuffet-Preise) → kein Raten, Verweis auf Stand/Homepage.
- [ ] Key-Weitergabe per QR von iPhone zu Android und umgekehrt mit der Standard-Kamera-App.
- [ ] Widerrufener Key → App kehrt zur Einrichtung zurück.
- [ ] Darstellung auf 360 px Breite ohne horizontales Scrollen; Stundentafeln scrollen innerhalb ihrer Tabelle.

---

## Anhang A: Entwurf `src/prompt/system-prompt.md`

Der Prompt ist Englisch (Code-Artefakt); der Kontext bleibt Deutsch, die Antwortsprache folgt dem Besucher. Er darf nichts Variables enthalten (siehe 6.2).

```markdown
You are the visitor guide of HTL Spengergasse, a secondary technical college
(Höhere Technische Lehranstalt) in Vienna, Austria. You are shown at the
school's open day on a student's smartphone. Visitors are mostly 13- to
15-year-olds, their parents, and adults interested in the evening and adult
programmes ("Ausbildung ab 17").

## Knowledge
- Answer only from the school information inside <school_info>. It was
  compiled from the school brochure and the school website.
- Do not add facts from general knowledge about this school, other schools or
  Austrian school law.
- If something is not covered by <school_info>, say so plainly and refer the
  visitor to the teachers at the info stand or to www.spengergasse.at.
- Never invent dates, times, subjects, lesson hours, names, phone numbers or
  e-mail addresses.

## Scope
- Answer questions about the school: programmes, subjects, admission and
  registration, dates, contacts, location, school life.
- Politely decline anything else (homework, poems, coding help, general chat,
  opinions on other schools) in one sentence and suggest a question about the
  school instead.

## Language
- Reply in the language of the visitor's latest message, even though
  <school_info> is German.
- Keep official German programme names and add a short translation in
  parentheses when replying in another language.

## Style
- Answers are read on a phone. Be brief: two to six sentences or a short list.
- Use Markdown sparingly: bold for key facts, short lists, tables only for
  timetables or date overviews.
- In German, use "du" by default; switch to "Sie" if the visitor uses "Sie".

## Choosing a programme
- If someone asks which programme suits them and their interests are unclear,
  ask one short follow-up question first.
- Then suggest one to three matching programmes and say why.
- You are presented at the Informatik department's stand and may point out
  Informatik where it fits, but describe every programme fairly and never
  disparage one.

## Dates
- Today's date is given in a separate system block after <school_info>. Use it
  for questions like "When is the next open day?" or "Can I still register?".
- If a date in <school_info> is already in the past, say so.
```

---

## Anhang B: Entwurf `context/BUILD_PROMPT.md`

````markdown
# Build the knowledge base context/schulinfo.md

You are preparing the knowledge base for a visitor chatbot of HTL Spengergasse
(Vienna). A smaller model (Claude Sonnet 5.5 at low effort) will receive the
file as its only source of truth, so it must be complete, correct and easy to
look things up in.

## Inputs
1. `context/source/Broschuere-2025-11-02-2025-web.pdf` – school brochure,
   edition 2025-02, 20 pages, multi-column layout with timetables.
   Read it page by page with the Read tool (`pages` parameter) and use the
   visual layout to reconstruct columns and tables. Do not use markitdown or
   other text extraction; the column order gets scrambled.
2. All files in `context/raw/` – current pages of www.spengergasse.at
   (header contains URL and modification date).

## Rules
- Precedence: the website (context/raw) is newer and wins over the brochure.
  The brochure adds what the website lacks (timetables, department details).
- Record every conflict you resolved in `context/CONFLICTS.md`
  (topic, brochure says, website says, decision).
- Write only what the sources say. No marketing language, no assumptions,
  nothing from your general knowledge.
- Dates: absolute, with weekday, format `Fr, 13.11.2026, 13:00–18:00`.
  Drop events that lie before the school year 2026/27 and outdated pages
  (e.g. open days 2023, registration 2025/26).
- Contacts: keep functional contacts (Direktion, Kanzlei, heads of department,
  contact persons per programme) with phone and e-mail as published. Do not
  include lists of individual teachers.
- Fix hyphenation and line breaks from the PDF layout.
- Timetables as Markdown tables: rows = subjects, columns = school years,
  cells = weekly hours; keep the total row.
- Language: German. Keep official names exactly.
- No images, no image descriptions, no URLs except official school URLs and
  the registration platform.
- Target size: at most ~30,000 tokens. Prefer complete facts over prose.

## Output structure (context/schulinfo.md)

```
# HTL Spengergasse – Schulinformation
Stand: <today>; Quellen: Schulbroschüre Ausgabe 2025-02, www.spengergasse.at (abgerufen <date from context/raw/_meta.json>)

## Überblick
(school type, location, size, Ausbildung ab 14 vs. ab 17, list of all programmes)

## Termine Schuljahr 2026/27

## Aufnahme und Anmeldung
### Ausbildung ab 14
(requirements, ranking criteria, entrance/aptitude exams, deadlines, registration platform)
### Ausbildung ab 17

## Ausbildung ab 14
### <programme name>
- Form und Dauer, Abschluss
- Inhalte und Schwerpunkte
- Berufs- und Studienperspektiven
- Besonderheiten der Aufnahme
#### Stundentafel
(table)

## Ausbildung ab 17
### <programme name>
(same structure, incl. Tages-/Abendform, Vorbereitungslehrgang, Aufbaulehrgang, Kolleg)

## Freifächer und Besonderes
(e.g. Freifächer, Cybersecurity, Bachelor KI Management, Erasmus+ if in sources)

## Kontakte und Erreichbarkeit
(address, phone, e-mail, office hours, contact persons per programme, public transport)

## Schulleitung und Organisation
```

## Finish
After writing, list in your reply: number of programmes covered, number of
timetables, all dates you included, and anything you could not resolve.
A human will review the result against the sources before it is committed.
````

---

## Anhang C: `context/pages.json` (Homepage-Seiten)

Abruf über `https://www.spengergasse.at/index.php?rest_route=/wp/v2/pages/<id>`. Nicht aufgenommen: Versuchsanstalt, Services, Lehrer*innen-Kontakt (Personenliste), Impressum/Datenschutz sowie veraltete Seiten (Infotage 2023, Anmeldung 2025/26, COVID). Die mit „prüfen“ markierten Seiten nach dem ersten Abruf sichten und ggf. entfernen.

```json
[
  { "id": 2066,  "group": "ab14",  "title": "Ausbildung ab 14 (Übersicht)" },
  { "id": 2117,  "group": "ab14",  "title": "Animation" },
  { "id": 2085,  "group": "ab14",  "title": "Betriebsinformatik" },
  { "id": 2118,  "group": "ab14",  "title": "Gamedesign" },
  { "id": 2114,  "group": "ab14",  "title": "Informatik" },
  { "id": 2113,  "group": "ab14",  "title": "Informationstechnik – Fachschule" },
  { "id": 2116,  "group": "ab14",  "title": "Interior- und Surfacedesign" },
  { "id": 2112,  "group": "ab14",  "title": "Medizininformatik" },
  { "id": 2153,  "group": "ab14",  "title": "Technisches Management & Umwelt" },
  { "id": 2067,  "group": "ab17",  "title": "Ausbildung ab 17 (Übersicht)" },
  { "id": 2163,  "group": "ab17",  "title": "Animation" },
  { "id": 2699,  "group": "ab17",  "title": "Berufsreifeprüfung" },
  { "id": 2165,  "group": "ab17",  "title": "Gamedesign" },
  { "id": 2584,  "group": "ab17",  "title": "Informatik – Abendform" },
  { "id": 2155,  "group": "ab17",  "title": "Informatik – Tagesform" },
  { "id": 2156,  "group": "ab17",  "title": "Interior- und Surfacedesign" },
  { "id": 2096,  "group": "info",  "title": "Termine Schuljahr 2026/27" },
  { "id": 2248,  "group": "info",  "title": "Kontakte" },
  { "id": 5308,  "group": "info",  "title": "Erreichbarkeit" },
  { "id": 2217,  "group": "info",  "title": "Schulleitung" },
  { "id": 2215,  "group": "info",  "title": "Organisation" },
  { "id": 2219,  "group": "info",  "title": "Schulleitbild" },
  { "id": 11126, "group": "extra", "title": "Freifächer (prüfen)" },
  { "id": 9352,  "group": "extra", "title": "Cybersecurity (prüfen)" },
  { "id": 8706,  "group": "extra", "title": "Bachelor KI Management (prüfen)" }
]
```

Die Anmeldung selbst läuft extern über https://spengergasse.htl-anmeldung.at/ (in `schulinfo.md` als Link nennen).

---

## Anhang D: Beispielfragen

Vier bis sechs Chips im leeren Chat, in der UI-Sprache. Deutsch und Englisch als Vorlage; die übrigen Sprachen übersetzt das implementierende LLM sinngemäß.

| Schlüssel | de | en |
|---|---|---|
| `openDay` | Wann ist der Tag der offenen Tür? | When is the open day? |
| `informatik` | Was lernt man in der Informatik? | What do you learn in the IT department? |
| `admission` | Welche Noten brauche ich für die Aufnahme? | What grades do I need to get in? |
| `adults` | Kann ich als Erwachsene/r abends Informatik lernen? | Can adults study IT in the evening? |
| `compare` | Was ist der Unterschied zwischen Informatik und Medizininformatik? | What's the difference between IT and Medical Informatics? |
| `design` | Gibt es für Gamedesign eine Aufnahmeprüfung? | Is there an entrance exam for Game Design? |
