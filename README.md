# RCVDA System Map

A reusable, interactive network-map **tool** for RCVDA — organisations, boards, roles, places and
the relationships between them — with a WordPress plugin (`[rcvda_system_map]` shortcode) to publish
it. This repository is the **tool**; the **data** it renders lives in its own repo,
[`rcvda/tees-valley-system-map`](https://github.com/rcvda/tees-valley-system-map).

Built with [Cytoscape.js](https://js.cytoscape.org/) + the fcose layout. All libraries are bundled —
no build tooling is needed to view the map. Map data is loaded live from the data repo via the
[jsDelivr](https://www.jsdelivr.com/) CDN, with automatic fallback to a copy bundled inside the plugin.

## Tool + data are separate repos

The plugin is a general system-mapping tool; the dataset it currently carries is the **Tees Valley
public system**, which lives in `rcvda/tees-valley-system-map`. A dataset is any `system-data.json`
(`{nodes, edges, sources}`) published in a **public** GitHub repo, registered here via the
`rcvda_system_map_datasets` filter and selected per-map with the shortcode's `data="<slug>"`
attribute. See that data repo for the model, schema and geography documentation.

## Repository layout

| Path | What it is |
|---|---|
| `plugin/rcvda-system-map/` | Installable WordPress plugin (bundles Cytoscape + fcose + a **fallback** copy of the data). |
| `build/build.sh` | Refreshes the plugin's bundled data from the data repo, regenerates the standalone, repackages the zip. |
| `build/make_standalone.py` | Inlines everything into a single self-contained HTML. |
| `dist/rcvda-system-map.zip` | Latest built plugin — upload this to WordPress. |
| `dist/tees-valley-public-system-map.html` | Latest standalone viewer — open in any browser. |
| `docs/self-hosted-spec.md` | The future CPT-backed architecture. |
| `docs/data-sourcing.md` | How the live-fetch-with-fallback data sourcing works. |

Data model, schema, geography coding and source provenance are documented in the **data repo**
(`rcvda/tees-valley-system-map`).

## Data sourcing

The plugin loads the dataset **live** from the data repo via jsDelivr:

```
https://cdn.jsdelivr.net/gh/rcvda/tees-valley-system-map@main/data/system-data.json
```

If that request fails (CDN down, repo/ref not public), the map falls back to the copy bundled in the
plugin, so it always renders. Set `source="bundled"` on the shortcode to skip the network entirely.
Full detail in [`docs/data-sourcing.md`](docs/data-sourcing.md).

## Lenses

The data is Tees Valley-wide and viewed through **lenses** — saved geography filters, switchable in
the sidebar or set on the shortcode. Administrative: `tees-valley` (default), `cleveland`,
`south-tees`, `north-tees`, and each borough; ceremonial county:
`ceremonial-north-yorkshire`, `ceremonial-county-durham`; constituency:
`constituency-redcar`, `constituency-middlesbrough-south-east-cleveland`,
`constituency-middlesbrough-thornaby-east`. `context="on"` (default) also shows the
regional/national and connected-external bodies a lens plugs into; `context="off"` shows only the
area's own bodies. Documented in the data repo's `docs/geography.md`.

## Build

```bash
./build/build.sh
```

Requires `python3` and `zip`. Sources the data from a sibling `../tees-valley-system-map` checkout if
present (else fetches it from the public data repo, else keeps the existing bundled copy), refreshes
the plugin's fallback copy, regenerates `dist/tees-valley-public-system-map.html`, and repackages
`dist/rcvda-system-map.zip`. Set `RCVDA_SKIP_FETCH=1` to build offline against the current bundled data.

## Install on WordPress

1. WordPress admin → **Plugins → Add New → Upload Plugin** → `dist/rcvda-system-map.zip` → Install → Activate.
2. Add the shortcode to any page: `[rcvda_system_map]`

Common attributes: `lens="south-tees"`, `context="off"`, `data="tees-valley"`,
`source="live"` (or `"bundled"`), `ref="v1.0.0"`, `height="760px"`, `title="…"`. See the plugin's
`readme.txt` for the full list.

## Updating the map

Edit the data in the **data repo** (`rcvda/tees-valley-system-map`) and push — the live site picks it
up from the CDN. Ship a new plugin build/release from this repo only when the **code** changes (run
`./build/build.sh`, commit, tag, and attach `dist/rcvda-system-map.zip` to the release).

## Roadmap

`docs/self-hosted-spec.md` sets out sourcing data from WordPress custom post types via a REST feed —
making WordPress the live datastore, front-end unchanged.

## Licence

GPL-2.0-or-later (see `LICENSE`). Content © RCVDA.
