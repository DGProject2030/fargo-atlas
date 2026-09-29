#!/usr/bin/env bash
# Run one Grok task end to end: pending -> running -> grok -> guard -> validate -> PR -> done.
# Usage: bash scripts/dispatch-grok.sh NNN
# Env:   GROK_MODEL (default grok-4.7)
set -euo pipefail

NNN="${1:?usage: dispatch-grok.sh NNN}"
[[ "$NNN" =~ ^[0-9]{3}$ ]] || { echo "NNN must be 3 digits, got '$NNN'" >&2; exit 2; }

cd "$(git rev-parse --show-toplevel)"

# --- guards -----------------------------------------------------------------
[[ -z "$(git status --porcelain)" ]] || { echo "working tree is not clean" >&2; exit 2; }
[[ "$(git branch --show-current)" == "main" ]] || { echo "run from main" >&2; exit 2; }
git pull --ff-only --quiet

shopt -s nullglob
matches=(tasks/pending/"$NNN"-*.md)
(( ${#matches[@]} == 1 )) || { echo "need exactly one tasks/pending/$NNN-*.md, found ${#matches[@]}" >&2; exit 2; }
task_file="$(basename "${matches[0]}")"
slug="${task_file#"$NNN"-}"
slug="${slug%.md}"
branch="grok/$NNN-$slug"
log="tasks/running/$NNN.log"

fail() {
  echo "FAILED task $NNN: $1" >&2
  git mv "tasks/running/$task_file" "tasks/failed/$task_file"
  [[ -f "$log" ]] && mv "$log" "tasks/failed/$NNN.log"
  echo "Branch $branch left as-is for inspection. Log: tasks/failed/$NNN.log" >&2
  exit 1
}

# --- run --------------------------------------------------------------------
git switch -c "$branch"
git mv "tasks/pending/$task_file" "tasks/running/$task_file"

echo "grok: task $NNN ($slug) on $branch ..."
head_before="$(git rev-parse HEAD)"
start=$(date +%s)
grok --no-auto-update -m "${GROK_MODEL:-grok-4.7}" \
  -p "$(cat "tasks/running/$task_file")" \
  --cwd . --always-approve --output-format json > "$log" \
  || fail "grok exited non-zero"
echo "grok: finished in $(( $(date +%s) - start ))s"
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
bad="$(git status --porcelain --untracked-files=all \
  | cut -c4- | sed 's/.* -> //' \
  | grep -vxF "tasks/running/$task_file" \
  | grep -vE '^(data/|tests/|public/locales/)' \
  | grep -vE '^data/schemas/' || true)"
schema="$(git status --porcelain --untracked-files=all | cut -c4- | grep -E '^data/schemas/' || true)"
[[ -z "$bad$schema" ]] || fail "changes outside allowed paths:"$'\n'"$bad$schema"
[[ -n "$(git status --porcelain -- data tests public/locales)" ]] || fail "grok changed nothing"

# --- validate ---------------------------------------------------------------
npm run validate --silent || fail "npm run validate"

# --- ship -------------------------------------------------------------------
git mv "tasks/running/$task_file" "tasks/done/$task_file"
git add data tests public/locales tasks
git commit --quiet -m "data($NNN): $slug"
git push --quiet -u origin "$branch"
gh pr create --fill --base main --head "$branch"
echo "done: task $NNN -> tasks/done/$task_file. Log: $log"
