# Task 002 — episodes-film-s2-s5
Role: data-scribe
Goal: Complete `data/episodes.json` with the 1996 film and every episode of Fargo Seasons 2–5, and fix the open Season 1 synopsis doubts.
Read: `HANDOFF-grok-heavy.md` §3, `CLAUDE.md` § Data schemas, `data/schemas/episodes.schema.json`, `data/episodes.json` (holds S1E01–S1E10).
Write: `data/episodes.json` only.
Rules: section 3 of HANDOFF-grok-heavy.md applies. Do not touch src/. Do not run git.
Details:
- Film record: `id: "FILM"`, `season: 0`, `number: 0`, `air_date` = US theatrical release date, `story_year` = year of the film's events, `director` = the credited director, `writers` = both credited writers. Title in Hebrew: the Israeli release title.
- Seasons 2–5: ids `S2E01` … `S5E10`. Season 4 has 11 episodes (`S4E11`). Every other season has 10.
- Same field rules as task 001: original US air date on FX; `story_year` = year of the episode's main action; one credited director; every credited writer; synopses ≤ 90 words, your own words, spoilers allowed; `link_ids: []`.
- Keep the file sorted by id with `FILM` first.
- Season 1 fixes (keep all other S1 fields as they are):
  - S1E01 `synopsis_en`: the order of events is wrong. Malvo hits a deer first; after that, the man in his trunk escapes into the snow. Match the Hebrew version.
  - Check the S1E04, S1E09 and S1E10 synopses (both languages) against the episodes. Doubts raised: who goes to Duluth in S1E04 and in which episode the blood in the shower appears; whether Lester hits Malvo with the sales award in S1E09; where the frozen lake in S1E10 is. Correct anything wrong. If a detail cannot be confirmed, remove it.
Done when: `npm run validate` passes and `data/episodes.json` holds exactly 52 records: FILM, S1E01–S1E10, S2E01–S2E10, S3E01–S3E10, S4E01–S4E11, S5E01–S5E10.
Report: last line of your output must be JSON {"task":"002","status":"done|blocked","notes":"…"}. In `notes`, give the source URL(s) for air dates and credits, and list each Season 1 synopsis you changed and why.
