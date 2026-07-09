#!/usr/bin/env bash
# Deterministic checks for figma-tokens skill output.
# Runs against current repo state — no Figma credentials required.
# Exit 0 = all checks passed. Exit 1 = one or more failures.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

TOKENS_DIR="$PROJECT_ROOT/tokens"
TOKENS_CSS="$PROJECT_ROOT/src/renderer/styles/tokens.css"
INDEX_CSS="$PROJECT_ROOT/src/renderer/styles/index.css"

pass=0
fail=0

check() {
  local name="$1"
  shift
  if "$@" &>/dev/null; then
    echo "  ✓ $name"
    ((pass++)) || true
  else
    echo "  ✗ $name"
    ((fail++)) || true
  fi
}

valid_json() {
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$1"
}

echo "── Deterministic checks ──────────────────────────────────────"

# ── 1. Token source files ──────────────────────────────────────────
echo "Token source files:"
for f in color typography spacing border-radius shadow; do
  check "tokens/$f.json exists" test -f "$TOKENS_DIR/$f.json"
done

for f in color typography spacing border-radius shadow; do
  check "tokens/$f.json is valid JSON" valid_json "$TOKENS_DIR/$f.json"
done

# ── 2. tokens.css structure ────────────────────────────────────────
echo "tokens.css structure:"
check "tokens.css exists and is non-empty" test -s "$TOKENS_CSS"
check "tokens.css has :root block" grep -q ':root {' "$TOKENS_CSS"
check "tokens.css has --wf- custom properties" grep -q -- '--wf-' "$TOKENS_CSS"
check "tokens.css has no [object Object]" bash -c "! grep -q '\[object Object\]' '$TOKENS_CSS'"

# ── 3. Unit checks ─────────────────────────────────────────────────
echo "Unit checks (px required):"
check "border-radius values have px" bash -c "grep -- '--wf-border-radius-sm' '$TOKENS_CSS' | grep -q 'px'"
check "font-size values have px" bash -c "grep -- '--wf-font-size' '$TOKENS_CSS' | grep -q 'px'"
check "spacing values have px" bash -c "grep -- '--wf-spacing' '$TOKENS_CSS' | grep -q 'px'"

# ── 4. Color value format ──────────────────────────────────────────
echo "Color format:"
# Valid values: hex, rgba(), or var() aliases (Style Dictionary resolves {token.ref} to var(--wf-*))
check "color values are hex, rgba, or var() aliases" bash -c "
  lines=\$(grep -- '--wf-color' '$TOKENS_CSS' | grep -v '^[[:space:]]*//')
  bad=\$(echo \"\$lines\" | grep -v '#[0-9a-fA-F]' | grep -v 'rgba(' | grep -v 'var(--wf-' | grep -c ':') 2>/dev/null || true
  [ \"\${bad:-0}\" -eq 0 ]
"

# ── 5. index.css import order ──────────────────────────────────────
echo "index.css:"
check "index.css first line imports tokens.css" bash -c "head -1 '$INDEX_CSS' | grep -q \"@import './tokens.css'\""

# ── 6. build:tokens succeeds ──────────────────────────────────────
echo "Build:"
check "npm run build:tokens exits 0" bash -c "cd '$PROJECT_ROOT' && npm run build:tokens 2>&1 | tail -1 | grep -qv 'error'"

# ── 7. TypeScript — no errors in token-related files ──────────────
echo "TypeScript:"
check "tsc: no errors in theme/tailwind/tokens files" bash -c "
  output=\$(cd '$PROJECT_ROOT' && npx tsc --noEmit 2>&1)
  echo \"\$output\" | grep -E '(theme|tailwind|tokens)' | grep -c 'error TS' | grep -q '^0$'
"

echo ""
echo "── Results ───────────────────────────────────────────────────"
echo "  Passed : $pass"
echo "  Failed : $fail"
echo ""

[[ $fail -eq 0 ]]
