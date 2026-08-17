#!/usr/bin/env bash
# Sync canonical data into the plugin, regenerate the standalone, and repackage the plugin zip.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/data/system-data.json" "$ROOT/plugin/rcvda-system-map/assets/data/system-data.json"
python3 "$ROOT/build/make_standalone.py"
( cd "$ROOT/plugin" && rm -f "$ROOT/dist/rcvda-system-map.zip" && zip -rq "$ROOT/dist/rcvda-system-map.zip" rcvda-system-map )
echo "Build complete: dist/rcvda-system-map.zip and dist/south-tees-public-system-map.html"
