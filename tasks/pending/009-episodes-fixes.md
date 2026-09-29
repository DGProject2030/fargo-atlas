# Task 009 — episodes-fixes
Role: data-scribe
Goal: Fix two synopsis errors in `data/episodes.json` found in the review of task 002.
Read: `HANDOFF-grok-heavy.md` §3, `data/schemas/episodes.schema.json`, `data/episodes.json`.
Write: `data/episodes.json` only.
Rules: section 3 of HANDOFF-grok-heavy.md applies. Do not touch src/. Do not run git.
Details:
- S1E09, `synopsis_en` and `synopsis_he`: remove the claim that Lester hits Malvo with the sales award. The Wikipedia plot for "A Fox, a Rabbit, and a Cabbage" says Lester stops the elevator door and demands that Malvo recognize him, and Malvo then shoots Burt, Louise and Jemma. Rewrite that part to match. Keep the rest.
- S3E09, `synopsis_he`: "מודה בארבעת המוות" is not correct Hebrew. Use "מודה בארבעת מקרי המוות" or an equally natural phrasing.
- Change nothing else.
Done when: `npm run validate` passes, `data/episodes.json` still holds exactly 52 records, and only S1E09 and S3E09 differ from `origin/main`.
Report: last line of your output must be JSON {"task":"009","status":"done|blocked","notes":"…"}. In `notes`, quote the new S1E09 sentence in English.
