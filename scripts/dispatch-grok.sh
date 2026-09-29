#!/usr/bin/env bash
# Run one Grok task end to end: pending -> running -> grok -> guard -> validate -> PR -> done.
# Each task runs in its own git worktree from origin/main, so several tasks can run
# at once and the main checkout stays free for Claude's work.
# Usage: bash scripts/dispatch-grok.sh NNN
# Env:   GROK_MODEL (default grok-4.7)
set -euo pipefail

NNN="${1:?usage: dispatch-grok.sh NNN}"
[[ "$NNN" =~ ^[0-9]{3}$ ]] || { echo "NNN must be 3 digits, got '$NNN'" >&2; exit 2; }
die() { echo "$1" >&2; exit 2; }

root="$(git rev-parse --show-toplevel)"
cd "$root"

# --- guards -----------------------------------------------------------------
git fetch --quiet origin main
matches="$(git ls-tree --name-only origin/main tasks/pending/ | grep -E "^tasks/pending/$NNN-.*\.md$" || true)"
[[ -n "$matches" && "$(wc -l <<<"$matches")" -eq 1 ]] \
  || die "need exactly one tasks/pending/$NNN-*.md on origin/main"
task_file="$(basename "$matches")"
slug="${task_file#"$NNN"-}"
slug="${slug%.md}"
branch="grok/$NNN-$slug"
wt="$(dirname "$root")/fargo-atlas-worktrees/grok-$NNN"
mkdir -p "$root/tasks/logs"
log="$root/tasks/logs/$NNN.log"

[[ ! -e "$wt" ]] || die "worktree $wt already exists (failed run?). Inspect, then: git worktree remove --force $wt && git branch -D $branch"
! git show-ref --quiet "refs/heads/$branch" || die "local branch $branch already exists"
! git ls-remote --exit-code --heads origin "$branch" >/dev/null || die "branch $branch already exists on origin"

fail() {
  echo "FAILED task $NNN: $1" >&2
  git mv "tasks/running/$task_file" "tasks/failed/$task_file"
  echo "Worktree kept for inspection: $wt (branch $branch). Log: $log" >&2
  exit 1
}

# --- set up the worktree -----------------------------------------------------
git worktree add --quiet --no-track -b "$branch" "$wt" origin/main
cd "$wt"
npm ci --silent --no-audit --no-fund
git mv "tasks/pending/$task_file" "tasks/running/$task_file"

# --- run --------------------------------------------------------------------
echo "grok: task $NNN ($slug) on $branch in $wt ..."
head_before="$(git rev-parse HEAD)"
start=$(date +%s)
grok --no-auto-update -m "${GROK_MODEL:-grok-4.7}" \
  -p "$(cat "tasks/running/$task_file")" \
  --cwd . --always-approve --output-format json > "$log" \
  || fail "grok exited non-zero"
echo "grok: $NNN finished in $(( $(date +%s) - start ))s"
[[ "$(git branch --show-current)" == "$branch" && "$(git rev-parse HEAD)" == "$head_before" ]] \
  || fail "grok ran git (branch or HEAD changed)"

# Last line of Grok's text must be the report JSON.
report="$(node -e '
  const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const lines = String(j.text ?? "").trim().split("\n");
  console.log(lines[lines.length - 1]);
' "$log")" || fail "log is not valid JSON"
echo "report: $report"
status="$(node -e 'try { console.log(JSON.parse(process.argv[1]).status) } catch { console.log("missing") }' "$report")"
[[ "$status" == "done" ]] || fail "grok report status is '$status'"

# --- path guard: Grok may only change data/, tests/, public/locales/ -------
# ... and only the paths the task's "Write:" line names.
changed="$(git status --porcelain --untracked-files=all \
  | cut -c4- | sed 's/.* -> //' | grep -vxF "tasks/running/$task_file" || true)"
[[ -n "$changed" ]] || fail "grok changed nothing"
bad="$(grep -vE '^(data/|tests/|public/locales/)' <<<"$changed" || true)"
bad+="$(grep -E '^data/schemas/' <<<"$changed" || true)"
[[ -z "$bad" ]] || fail "changes outside allowed paths:"$'\n'"$bad"
write_line="$(grep -m1 '^Write:' "tasks/running/$task_file" || true)"
unnamed="$(while read -r p; do grep -qF "\`$p\`" <<<"$write_line" || echo "$p"; done <<<"$changed")"
[[ -z "$unnamed" ]] || fail "changes not named in the task's Write: line:"$'\n'"$unnamed"

# --- validate ---------------------------------------------------------------
npm run validate --silent || fail "npm run validate"

# --- ship -------------------------------------------------------------------
git mv "tasks/running/$task_file" "tasks/done/$task_file"
git add data tests public/locales tasks
git commit --quiet -m "data($NNN): $slug"
git push --quiet -u origin "$branch"
gh pr create --fill --base main --head "$branch"

cd "$root"
git worktree remove --force "$wt"
git branch --quiet -D "$branch"
echo "done: task $NNN. Log: $log"
