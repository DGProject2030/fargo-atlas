# Task 003 — characters
Role: data-scribe
Goal: Fill `data/characters.json` with the main and notable supporting characters of the Fargo film and Seasons 1–5.
Read: `HANDOFF-grok-heavy.md` §3, `CLAUDE.md` § Data schemas, `data/schemas/characters.schema.json`, `data/characters.json` (currently `[]`), `data/episodes.json` (for context).
Write: `data/characters.json` only.
Rules: section 3 of HANDOFF-grok-heavy.md applies. Do not touch src/. Do not run git.
Details:
- `id`: lowercase slug of the name the show uses most, e.g. `lou-solverson`, `lorne-malvo`. One record per person, even when the person appears in several installments: list every installment in `seasons` (0 = film).
- Cross-installment people matter most. Example: Lou Solverson (S1 older, S2 younger). Hanzee Dent (S2), later Moses Tripoli (S3): one record, `also_known_as: ["Moses Tripoli"]`.
- `faction`: `law` (police, FBI, officials enforcing the law), `crime` (criminals and their crews), `civilian`, `drifter` (outsiders with no fixed side who pass through a story, e.g. Lorne Malvo). Pick the best fit and be consistent.
- `fate` = state at the end of that person's last appearance. `unknown` if the show does not make it clear.
- `bio_en`, `bio_he` ≤ 60 words each, your own words, spoilers allowed.
- `also_known_as`: aliases and false names used on screen. `[]` if none.
- `name_he`: Hebrew transliteration. Keep it consistent with the Hebrew synopses in `data/episodes.json`.
- Sorted by `id`.
Done when: `npm run validate` passes, `data/characters.json` holds at least 80 records, and each installment (0, 1, 2, 3, 4, 5) appears in the `seasons` of at least 10 records.
Report: last line of your output must be JSON {"task":"003","status":"done|blocked","notes":"…"}. In `notes`, give the total count, the count per installment, and your source URL(s).
