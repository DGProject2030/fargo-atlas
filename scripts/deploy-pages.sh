#!/usr/bin/env bash
# Build origin/main and publish dist/ to the gh-pages branch.
# Stopgap until .github/workflows/pages.yml lands (day 5).
# Usage: bash scripts/deploy-pages.sh
set -euo pipefail

root="$(git rev-parse --show-toplevel)"
cd "$root"
git fetch --quiet origin main gh-pages
sha="$(git rev-parse --short origin/main)"

base="$(dirname "$root")/fargo-atlas-worktrees"
src="$base/deploy-src"
out="$base/deploy-out"
for d in "$src" "$out"; do
  [[ ! -e "$d" ]] || git worktree remove --force "$d"
done
cleanup() {
  cd "$root"
  git worktree remove --force "$src" 2>/dev/null || true
  git worktree remove --force "$out" 2>/dev/null || true
}
trap cleanup EXIT

# Build from a clean checkout of origin/main, not from the working tree.
git worktree add --quiet --detach "$src" origin/main
(cd "$src" && npm ci --silent --no-audit --no-fund && npm run build --silent)

git worktree add --quiet --detach "$out" origin/gh-pages
cd "$out"
git rm -r --quiet --ignore-unmatch .
cp -r "$src/dist/." .
touch .nojekyll
git add -A
if git diff --cached --quiet; then
  echo "gh-pages already matches $sha"
  exit 0
fi
git commit --quiet -m "chore(pages): deploy $sha"
git push --quiet origin HEAD:gh-pages
echo "deployed $sha -> https://dgproject2030.github.io/fargo-atlas/"
