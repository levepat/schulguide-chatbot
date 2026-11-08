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
