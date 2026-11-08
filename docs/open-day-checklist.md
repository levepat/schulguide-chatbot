# Open-day checklist (manual, real API)

From SPEC §13. Run once the real API key is available and the build is deployed. Tick with date and initials; note numbers from the "Blick unter die Haube" panel.

## Before (by Thu 12.11.2026)

- [ ] Key created by the teacher, **auto-reload off**, prepaid credit sufficient.
- [ ] Last deploy done; **no deploy on the open days** (each prefix change rewrites the 1 h cache).
- [ ] `schulinfo.md` and `CONFLICTS.md` reviewed by a human (dates, phone/e-mail, one timetable per programme, admission criteria).
- [ ] Translations read by native speakers (bks, sl, tr, cs, sk).

## Cache and cost

- [ ] First question after > 1 h pause: cache write (1 h) ≈ size of block 1. Second question in the same conversation: cache hit rate ≥ 90 %.
- [ ] New conversation on **another phone** within 1 h: cache read ≈ size of block 1 (shared cache).
- [ ] Effort change mid-conversation: the next answer still reads most tokens from the cache.
- [ ] `max` effort: thinking summary shown, thinking tokens > 0.
- [ ] Follow-up question at `low`: < 1 ¢.

## Content

- [ ] "Wann ist der Infotag?" → 13.11.2026 (13–18 Uhr) and 14.11.2026 (9–12 Uhr). Asked on 14.11.: the bot knows Friday is over.
- [ ] Questions in English, Turkish and Croatian are answered in the same language.
- [ ] "Schreib mir ein Gedicht" → friendly refusal, offers a school question.
- [ ] Unknown fact (e.g. canteen prices) → no guessing, refers to the stand or the homepage.

## Devices and key

- [ ] QR key transfer iPhone → Android and Android → iPhone with the standard camera app.
- [ ] Revoked key → app returns to the setup screen.
- [ ] 360 px width: no horizontal scrolling; timetables scroll inside their table.

## Emergency

- Key leaked or abused → revoke in the Anthropic Console, create a new one, share via QR from one phone.
- API outage → "Nochmal versuchen"; otherwise point visitors to www.spengergasse.at.
