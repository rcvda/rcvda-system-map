# RCVDA System Map — South Tees public system

An interactive network map of the South Tees public system — organisations, boards, roles,
places and the relationships between them — with a self-contained WordPress plugin to publish it.

Built with [Cytoscape.js](https://js.cytoscape.org/) + the fcose layout. No build tooling or
server-side code is required to view it; everything is bundled.

## Repository layout

| Path | What it is |
|---|---|
| `data/system-data.json` | **Source of truth** — the model (`{nodes, edges}`). Edit here. |
| `plugin/rcvda-system-map/` | Installable WordPress plugin (bundles Cytoscape + fcose + a copy of the data). |
| `build/build.sh` | Syncs `data/` into the plugin, regenerates the standalone, repackages the zip. |
| `build/make_standalone.py` | Inlines everything into a single self-contained HTML. |
| `dist/rcvda-system-map.zip` | Latest built plugin — upload this to WordPress. |
| `dist/south-tees-public-system-map.html` | Latest standalone viewer — open in any browser. |
| `docs/schema.md`, `docs/self-hosted-spec.md` | Data model + the future CPT-backed architecture. |
| `docs/sources/` | Source archive + `_manifest.md` (provenance for every sourced node). |

## Data model (brief)

Each node has: `id, label, type, group` (system domain), `tier` (geography), `org` (container for
internal structures), `subtype`, `person`, `status` (`confirmed`/`verify`), `source`.
Each edge has: `source, target, label, kind` (one of: governance, officer, political,
commissioning, funding, membership, delivery), `weight`. See `docs/schema.md`.

## Build

```bash
./build/build.sh
```

Requires `python3` and `zip`. Output lands in `dist/`.

## Install on WordPress

1. WordPress admin → **Plugins → Add New → Upload Plugin** → `dist/rcvda-system-map.zip` → Install → Activate.
2. Add the shortcode to any page: `[rcvda_system_map]`
   (optional attributes: `height="760px"`, `title="…"`).

## Updating the map

Edit `data/system-data.json`, run `./build/build.sh`, commit, and re-upload the zip (or ship the
new data file to the site). Nothing else changes.

## Roadmap

Data is bundled today. The `docs/self-hosted-spec.md` sets out the path to sourcing it from
WordPress custom post types (organisation / place / service / facility) via a REST feed — the
front-end stays identical; only the data source changes.

## Licence

GPL-2.0-or-later (see `LICENSE`). Content © RCVDA.
