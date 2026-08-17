# RCVDA System Map

A reusable, interactive network-map **tool** for RCVDA — organisations, boards, roles, places and
the relationships between them — with a WordPress plugin (`[rcvda_system_map]` shortcode) to
publish it. This repository ships loaded with its first dataset, the **South Tees public system**;
the tool itself is dataset-agnostic.

Built with [Cytoscape.js](https://js.cytoscape.org/) + the fcose layout. All libraries are
bundled — no build tooling is needed to view the map. Map data is loaded live from this repo via
the [jsDelivr](https://www.jsdelivr.com/) CDN, with automatic fallback to a copy bundled inside
the plugin.

## Tool, not a single map

The plugin is a general system-mapping tool; "South Tees" is simply the dataset it currently
carries. A dataset is any `system-data.json` (`{nodes, edges, sources}`) published in a **public**
GitHub repo. Additional datasets are registered via the `rcvda_system_map_datasets` filter and
selected per-map with the shortcode's `data="<slug>"` attribute — no code change to the plugin.

## Repository layout

| Path | What it is |
|---|---|
| `data/system-data.json` | **Canonical source of truth** — the model (`{nodes, edges, sources}`). Edit here. |
| `plugin/rcvda-system-map/` | Installable WordPress plugin (bundles Cytoscape + fcose + a fallback copy of the data). |
| `build/build.sh` | Syncs `data/` into the plugin, regenerates the standalone, repackages the zip. |
| `build/make_standalone.py` | Inlines everything into a single self-contained HTML. |
| `dist/rcvda-system-map.zip` | Latest built plugin — upload this to WordPress. |
| `dist/south-tees-public-system-map.html` | Latest standalone viewer — open in any browser. |
| `docs/schema.md`, `docs/self-hosted-spec.md` | Data model + the future CPT-backed architecture. |
| `docs/data-sourcing.md` | How the live-fetch-with-fallback data sourcing works. |
| `docs/sources/` | Source archive + `_manifest.md` (provenance for every sourced node). |

## Data model (brief)

Each node has: `id, label, type, group` (system domain), `tier` (geography), `org` (container for
internal structures), `subtype`, `person`, `status` (`confirmed`/`verify`), `source`.
Each edge has: `source, target, label, kind` (one of: governance, officer, political,
commissioning, funding, membership, delivery), `weight`. See `docs/schema.md`.

## Data sourcing

By default the plugin loads `data/system-data.json` **live** from this public repo via jsDelivr:

```
https://cdn.jsdelivr.net/gh/rcvda/rcvda-system-map@main/data/system-data.json
```

If that request fails (CDN down, repo/ref not public), the map falls back to the copy bundled in
the plugin, so it always renders. Set `source="bundled"` on the shortcode to skip the network
entirely. Full detail — including caching and how to force an instant update — is in
[`docs/data-sourcing.md`](docs/data-sourcing.md).

## Build

```bash
./build/build.sh
```

Requires `python3` and `zip`. Syncs the canonical data into the plugin (refreshing the fallback
copy), regenerates `dist/south-tees-public-system-map.html`, and repackages `dist/rcvda-system-map.zip`.

## Install on WordPress

1. WordPress admin → **Plugins → Add New → Upload Plugin** → `dist/rcvda-system-map.zip` → Install → Activate.
2. Add the shortcode to any page: `[rcvda_system_map]`

Common attributes: `data="south-tees"`, `source="live"` (or `"bundled"`), `ref="v0.2.0"`,
`height="760px"`, `title="…"`. See the plugin's `readme.txt` for the full list.

## Updating the map

Edit `data/system-data.json`, run `./build/build.sh`, commit, and push. With live sourcing on, the
site picks up the change once the CDN cache expires (~12h on the `main` branch) — or immediately if
you cut a release tag and point `ref` at it. For a code change (not just data), ship a new plugin
build/release and update it on the site.

## Roadmap

The `docs/self-hosted-spec.md` sets out the path to sourcing data from WordPress custom post types
(organisation / place / service / facility) via a REST feed — making WordPress the live datastore,
with the front-end unchanged.

## Licence

GPL-2.0-or-later (see `LICENSE`). Content © RCVDA.
