# Handoff — Claude Code (Opus 5.5)

Project: **Fargo fan atlas** — a static, bilingual (he/en) fan site for the Fargo film and series.
Personal project. Not related to Stage Design. Home PC (`User`), GitHub account `DGProject2030`.

Read this file fully, then open Plan Mode (`Shift+Tab`) and present a day 0 plan before you write any file.

---

## 1. Team

The same team is defined in `HANDOFF-grok-heavy.md`. Do not change roles without updating both files.

| Role | Runs on | Owns | Never touches |
|---|---|---|---|
| Orchestrator | Claude Code main session, Opus 5.5 | Plan, task files, dispatch, merges | Data entry by hand |
| Architect / designer | Same session, Opus 5.5 | `src/`, design tokens, SVG art, D3 graph, RTL | `data/`, `public/locales/` |
| Reviewer | `.claude/agents/reviewer.md`, Opus 5.5, tools: Read, Bash | PR verdicts (pass/fail + reasons) | Any write |
| Data scribe | Grok Heavy, headless CLI | `data/episodes.json`, `data/characters.json`, `data/links.json` | `src/` |
| Localizer | Grok Heavy, headless CLI | `public/locales/he.json`, `public/locales/en.json` | `src/` |
| Tester | Grok Heavy, headless CLI | `tests/`, lint fixes in `data/` | `src/` |

Grok writes only to `data/`, `tests/`, `public/locales/`. Branch protection on `main` enforces it.

---

## 2. Method (Elon algorithm — applied, do not re-apply on every task)

1. Requirements are questioned. Owner: Tsah. Result below.
2. Deleted: backend, database, accounts, comments, CMS, search, image pipeline, quiz, forum.
3. Simplified: one SPA, four views, three JSON files, two locale files.
4. Accelerate: Grok fills data in parallel while Opus builds UI.
5. Automate last: GitHub Actions only after two clean manual loops.

Session flow: Plan Mode → Tsah approves → execute → test → clean → document → commit → push → PR.

---

## 3. Fixed decisions

- Stack: Vite + vanilla TypeScript + D3 v7. No framework.
- Hosting: GitHub Pages, public repo. Zero added cost.
- Languages: Hebrew (RTL, default) and English. `dir` and `lang` switch on `<html>`.
- Legal: no FX/MGM stills, logos, or character likenesses. Original SVG art only. Fan-site disclaimer in footer. MIT license.
- Commits: Conventional Commits, `type(scope): description`. Never commit to `main`.
- Branches: `claude/<slug>` for Opus work, `grok/NNN-<slug>` for Grok tasks.
- Look: snow, ice, one red. No purple, no dark-mode-only design.

---

## 4. Repo layout

```
fargo-atlas/
  CLAUDE.md                 project rules (copy section 3 + 5 here)
  HANDOFF-claude-code.md
  HANDOFF-grok-heavy.md
  .claude/agents/reviewer.md
  data/
    episodes.json
    characters.json
    links.json
    schemas/*.schema.json
  public/locales/{he,en}.json
  src/
    main.ts
    views/{timeline,web,episodes,links}.ts
    ui/tokens.css
    art/*.svg
  tasks/{pending,running,done,failed}/
  scripts/dispatch-grok.sh
  tests/validate-data.test.ts
  .github/workflows/{ci,pages}.yml
```

---

## 5. Data schemas (write these as JSON Schema first — Grok validates against them)

**episodes.json** — array
```
id            "S2E09" | "FILM"
season        0 (film) | 1..5
number        int
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

---

## 6. Day 0 — your first plan must cover exactly this

1. `npm create vite@latest` (vanilla-ts), add D3, Vitest, ajv.
2. Write the three schemas and an empty valid instance of each.
3. Write `CLAUDE.md` from sections 3 and 5.
4. Write `.claude/agents/reviewer.md`:
   - tools: Read, Bash
   - job: run `npm run validate`, read the diff, answer PASS or FAIL with a numbered reason list. No edits.
5. Write `scripts/dispatch-grok.sh NNN`:
   - move task from `pending/` to `running/`
   - `git switch -c grok/NNN-<slug>`
   - `grok --no-auto-update -p "$(cat tasks/running/NNN-*.md)" --cwd . --always-approve --output-format json > tasks/running/NNN.log`
   - `npm run validate` → on fail: move task to `failed/`, stop
   - `git add data tests public/locales`, commit `data(NNN): <slug>`, push, `gh pr create --fill`
   - move task to `done/`
6. Write `tasks/pending/001-episodes-s1.md` as the dry-run task (Season 1 only, 10 episodes).
7. Run the dry run. Show Tsah the PR. Stop.

## 6b. Days 1–5 — re-plan each day in Plan Mode, get approval, then execute

| Day | Opus (Architect) | Grok (dispatched tasks) | End-of-day check |
|---|---|---|---|
| 1 | `tokens.css` (snow, ice, one red), `<html dir/lang>` switcher, i18n loader, timeline view with story/release toggle | 002 episodes film + S2–S5, 003 characters | Timeline renders all six installments from `episodes.json`; two PRs reviewed |
| 2 | D3 force graph (`web.ts`): season + faction filters, tap node → bio panel; episode guide view | 004 links, 005 data tests | Graph shows ≥ 80 nodes; `npm test` green |
| 3 | Links view: list + dashed line for `confirmed: false`; SVG art set (≥ 6 pieces, no faces); locale key list for Grok | 006 en.json, 007 he.json | All four views work in both languages; Opus proofreads the Hebrew |
| 4 | Mobile pass at 380 px, keyboard nav, ARIA on graph and timeline, README, disclaimer footer | 008 fix validator failures | Lighthouse a11y ≥ 95 on desktop and mobile |
| 5 | `.github/workflows/ci.yml` (validate, lint, test, build) and `pages.yml` (deploy on `main`); branch protection | none | Site live on GitHub Pages; definition of done (section 8) met |

Rules for the table:
- Grok tasks are dispatched at the start of the day so they run while Opus builds.
- Day 5 starts only after the manual loop (task → PR → review → merge) has run clean twice.
- Slip a day rather than skip a check.

---

## 7. Task file template (Orchestrator writes; Grok reads)

```
# Task NNN — <slug>
Role: data-scribe | localizer | tester
Goal: one sentence.
Read: data/schemas/<x>.schema.json, <existing file if any>
Write: <exact paths>
Rules: section 3 of HANDOFF-grok-heavy.md applies. Do not touch src/.
Done when: `npm run validate` passes and <specific count or check>.
Report: last line of your output must be JSON {"task":"NNN","status":"done|blocked","notes":"…"}
```

---

## 8. Definition of done (v1)

- Four views work on a 380 px phone and a 1440 px desktop, both languages.
- `npm run validate`, lint, and build pass in CI.
- Lighthouse accessibility ≥ 95.
- 51 episodes + film, ≥ 80 characters, ≥ 12 confirmed links.
- README in English. Fan disclaimer visible.
