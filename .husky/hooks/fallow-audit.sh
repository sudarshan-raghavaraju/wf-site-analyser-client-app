#!/usr/bin/env sh
# Fallow audit gate.
#
# Runs when source or project config files are staged and fallow is installed locally.
# Gate: local-only; does not download fallow during commit.
# Base branch: origin/develop (matches .github/workflows/claude-pr-review.yml).
#
# Run manually:
#   sh .husky/hooks/fallow-audit.sh

CHANGED=$(git diff --cached --name-only)
FALLOW_PATTERN='^(src/|tokens/|package\.json|package-lock\.json|tsconfig|electron-vite|vite\.config|eslint\.config|tailwind\.config)'

if ! echo "$CHANGED" | grep -qE "$FALLOW_PATTERN"; then
  exit 0
fi

echo ""
echo "Source files staged — running fallow audit (new-only, base: origin/develop)..."
echo ""

FALLOW_BIN="$PWD/node_modules/.bin/fallow"

if [ ! -x "$FALLOW_BIN" ]; then
  echo "fallow audit: local fallow binary not found; skipping local gate."
  echo "CI still runs fallow audit for PRs."
  echo ""
  exit 0
fi

set +e
"$FALLOW_BIN" audit --quiet --base origin/develop
fallow_exit=$?
set -e

case "$fallow_exit" in
  0)
    echo ""
    echo "fallow audit: passed."
    echo ""
    exit 0
    ;;
  1)
    echo ""
    echo "fallow audit FAILED. Fix introduced issues before committing."
    echo "Re-run manually: sh .husky/hooks/fallow-audit.sh"
    echo ""
    exit 1
    ;;
  *)
    echo ""
    echo "fallow audit: runtime error (exit $fallow_exit) — skipping gate."
    echo "Re-run manually: sh .husky/hooks/fallow-audit.sh"
    echo ""
    exit 0
    ;;
esac
