#!/usr/bin/env bash
# build.sh — assemble SPECTRA into a single self-contained index.html
# Usage: ./build.sh   (rerun after editing anything in src/)
set -uo pipefail
cd "$(dirname "$0")"
{
  cat src/part1.html
  echo '<script>'
  cat src/data.js src/data2.js src/app.js
  echo '</script>'
} > index.html
tmp="$(mktemp --suffix=.js)"; trap 'rm -f "$tmp"' EXIT
cat src/data.js src/data2.js > "$tmp"
node --check "$tmp" >/dev/null 2>&1 || { echo "data JS syntax error"; exit 1; }
node --check src/app.js >/dev/null 2>&1 || { echo "app.js syntax error"; exit 1; }
echo "built index.html ($(wc -c < index.html) bytes)"
