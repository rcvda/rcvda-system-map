#!/usr/bin/env bash
# Refresh the plugin's bundled data from the tees-valley-system-map data repo, regenerate the
# standalone, and repackage the plugin zip.
#
# Data source, in order of preference:
#   1. RCVDA_SKIP_FETCH=1        -> keep the existing bundled copy (offline / no refresh)
#   2. a sibling checkout        -> ../tees-valley-system-map/data/system-data.json (fresh, no network)
#   3. jsDelivr/raw over network -> the public data repo
#   4. otherwise                 -> keep the existing bundled copy, with a warning
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUG="$ROOT/plugin/rcvda-system-map"
BUNDLED="$PLUG/assets/data/system-data.json"
DATA_REF="${RCVDA_DATA_REF:-main}"
SIBLING="$ROOT/../tees-valley-system-map/data/system-data.json"
RAW_URL="https://raw.githubusercontent.com/rcvda/tees-valley-system-map/${DATA_REF}/data/system-data.json"

valid_json() { python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$1" 2>/dev/null; }

if [ "${RCVDA_SKIP_FETCH:-}" = "1" ]; then
  echo "RCVDA_SKIP_FETCH=1 — using existing bundled data."
elif [ -f "$SIBLING" ] && valid_json "$SIBLING"; then
  cp "$SIBLING" "$BUNDLED"; echo "Bundled data refreshed from sibling checkout ($SIBLING)."
elif command -v curl >/dev/null 2>&1 && curl -fsSL "$RAW_URL" -o "$BUNDLED.tmp" && valid_json "$BUNDLED.tmp"; then
  mv "$BUNDLED.tmp" "$BUNDLED"; echo "Bundled data refreshed from $RAW_URL"
else
  rm -f "$BUNDLED.tmp" 2>/dev/null || true
  echo "WARNING: could not source fresh data — keeping existing bundled copy."
fi

python3 "$ROOT/build/make_standalone.py"
( cd "$ROOT/plugin" && rm -f "$ROOT/dist/rcvda-system-map.zip" && zip -rq "$ROOT/dist/rcvda-system-map.zip" rcvda-system-map )
echo "Build complete: dist/rcvda-system-map.zip and dist/tees-valley-public-system-map.html"
