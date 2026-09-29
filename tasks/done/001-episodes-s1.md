# Task 001 — episodes-s1
Role: data-scribe
Goal: Fill `data/episodes.json` with the 10 episodes of Fargo Season 1 (FX, 2014).
Read: `HANDOFF-grok-heavy.md` §3, `CLAUDE.md` § Data schemas, `data/schemas/episodes.schema.json`, `data/episodes.json` (currently `[]`).
Write: `data/episodes.json` only.
Rules: section 3 of HANDOFF-grok-heavy.md applies. Do not touch src/. Do not run git.
Details:
- ids `S1E01` … `S1E10`, `season: 1`, `number` 1–10, sorted by id.
- `air_date` = original US air date on FX.
- `story_year` = the year the episode's main action takes place.
- `director` = one credited director. `writers` = every credited writer.
- `synopsis_en` and `synopsis_he` ≤ 90 words each, your own words, spoilers allowed.
- `link_ids: []` for every episode. Links come in a later task.
Done when: `npm run validate` passes and `data/episodes.json` holds exactly 10 records, S1E01–S1E10.
Report: last line of your output must be JSON {"task":"001","status":"done|blocked","notes":"…"}. In `notes`, give the source URL(s) you used for air dates and credits.
