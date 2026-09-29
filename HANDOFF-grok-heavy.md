# Handoff — Grok Heavy (headless CLI)

Project: **Fargo fan atlas** — a static, bilingual (he/en) fan site for the Fargo film and series.
You run headless. The Orchestrator (Claude Code) writes one task file per run and starts you with `scripts/dispatch-grok.sh NNN`.

---

## 1. Team

Same table as `HANDOFF-claude-code.md` §1. Do not change roles without updating both files.

| Role | Runs on | Owns | Never touches |
|---|---|---|---|
| Orchestrator | Claude Code main session | Plan, task files, dispatch, merges | Data entry by hand |
| Architect / designer | Same session | `src/`, design tokens, SVG art, D3 graph, RTL | `data/`, `public/locales/` |
| Reviewer | `.claude/agents/reviewer.md` | PR verdicts (pass/fail + reasons) | Any write |
| Data scribe | Grok Heavy, headless CLI | `data/episodes.json`, `data/characters.json`, `data/links.json` | `src/` |
| Localizer | Grok Heavy, headless CLI | `public/locales/he.json`, `public/locales/en.json` | `src/` |
| Tester | Grok Heavy, headless CLI | `tests/`, lint fixes in `data/` | `src/` |

---

## 2. Your inputs

- The task file (your prompt). It names your role, the files to read, and the exact files to write.
- `data/schemas/*.schema.json` — the contract. Read the schema before you write data.
- `CLAUDE.md` — project rules and field meanings.

---

## 3. Rules (every task)

1. **Write only the paths the task names.** Allowed roots: `data/`, `tests/`, `public/locales/`. Never touch `src/`, `scripts/`, `tasks/`, `.claude/`, config files, or `package.json`. The dispatch script fails the task if you do.
2. **Do not run git.** No commit, branch, push, or stash. The dispatch script does all git work.
3. **Facts only.** Every field must match the aired episode or the 1996 film. Do not guess an air date, director, or writer. If you cannot confirm a fact, report `"status":"blocked"` and name the field.
4. **Sources.** Put one source URL per record in the report `notes` (Wikipedia episode list is fine).
5. **Word limits are hard.** synopsis ≤ 90 words, bio ≤ 60 words, evidence ≤ 40 words. Count Hebrew words by spaces too.
6. **Hebrew.** Natural modern Hebrew. Use the official Israeli title if one exists. Otherwise translate the English title faithfully. Keep names transliterated the same way in every file.
7. **Spoilers are allowed.** This is a reference atlas. Synopses describe the whole episode.
8. **No copyrighted text.** Write synopses and bios in your own words. Do not copy Wikipedia or network text.
9. **Links are on-screen facts.** `evidence_*` states what the viewer sees or hears. Theories go in with `confirmed: false`.
10. **Formatting.** UTF-8, 2-space JSON indent, trailing newline. Keep arrays sorted by `id`.
11. **Check your work.** Run `npm run validate` before you finish. Fix every failure you own.
12. **Report.** The last line of your output must be JSON:
    `{"task":"NNN","status":"done|blocked","notes":"…"}`
