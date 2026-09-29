# Fargo fan atlas — project rules

Static, bilingual (he/en) fan site for the Fargo film and series. Personal project, GitHub `DGProject2030`.
Full context: `HANDOFF-claude-code.md` (Claude) and `HANDOFF-grok-heavy.md` (Grok).

## Fixed decisions

- Stack: Vite + vanilla TypeScript + D3 v7. No framework.
- Hosting: GitHub Pages, public repo. Zero added cost.
- Languages: Hebrew (RTL, default) and English. `dir` and `lang` switch on `<html>`.
- Legal: no FX/MGM stills, logos, or character likenesses. Original SVG art only. Fan-site disclaimer in footer. MIT license.
- Commits: Conventional Commits, `type(scope): description`. Never commit to `main`. Grok task commits use `data(NNN): <slug>`.
- Branches: `claude/<slug>` for Claude work, `grok/NNN-<slug>` for Grok tasks.
- Look: snow, ice, one red. No purple, no dark-mode-only design.

## Write ownership

| Paths | Owner |
|---|---|
| `src/`, `index.html`, config, `scripts/`, `tasks/`, `.claude/` | Claude (Orchestrator / Architect) |
| `data/*.json` | Grok data scribe |
| `public/locales/*.json` | Grok localizer |
| `tests/` | Grok tester (Claude wrote the day 0 baseline) |
| `data/schemas/` | Claude — the contract; change only in a `claude/` PR |

Claude never enters data by hand. Grok never touches `src/`.
`main` is protected: PR only, no force push. `scripts/dispatch-grok.sh` rejects Grok changes outside `data/ tests/ public/locales/`.

## Data schemas

JSON Schema files: `data/schemas/*.schema.json`. `npm run validate` checks them plus word limits (`maxWords` keyword), unique ids, id/season/number agreement, and cross-file references.

**episodes.json** — array
```
id            "S2E09" | "FILM"
season        0 (film) | 1..5
number        int (film = 0)
title_en      string
title_he      string
air_date      YYYY-MM-DD
story_year    int
director      string
writers       string[]
synopsis_en   ≤ 90 words
synopsis_he   ≤ 90 words
link_ids      string[]   ids from links.json created or paid off in this episode
```

**characters.json** — array
```
id            slug, e.g. "lou-solverson"
name_en, name_he
seasons       int[]      0 = film
faction       "law" | "crime" | "civilian" | "drifter"
fate          "alive" | "dead" | "unknown"
bio_en, bio_he  ≤ 60 words
also_known_as string[]   e.g. Hanzee Dent → Moses Tripoli
```

**links.json** — array
```
id            "L01"…
from_id       episode id
to_id         episode id
character_ids string[]
kind          "same-person" | "object" | "event" | "family" | "echo"
evidence_en, evidence_he   ≤ 40 words, on-screen fact only
confirmed     true | false   false = fan theory, shown with a dashed line
```

## Task loop

1. Orchestrator writes `tasks/pending/NNN-<slug>.md` (template: `HANDOFF-claude-code.md` §7) on a `claude/` branch and merges it. The `Write:` line must list every allowed path in backticks — the script rejects any change not named there.
2. From a clean, up-to-date `main`: `bash scripts/dispatch-grok.sh NNN`.
3. Script: runs Grok → path guard → `npm run validate` → commits → pushes `grok/NNN-<slug>` → opens PR. Log: `tasks/running/NNN.log` (gitignored).
4. Reviewer agent (`.claude/agents/reviewer.md`) gives PASS/FAIL. Orchestrator merges on PASS.

## Commands

- `npm run dev` / `npm run build`
- `npm run validate` — data contract
- `npm run lint` — `tsc --noEmit` for `src/` and `tests/`
- `npm test` — all Vitest tests
