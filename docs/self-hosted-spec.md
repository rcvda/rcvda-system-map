# Self-hosted public system map — specification

How the South Tees public system map would be built as a fully RCVDA-owned, self-hosted feature — no SaaS dependency — once the Graph Commons prototype has proven the structure. It follows the same pattern as the existing food/cycle locator maps: **own the data, render it with open libraries inside the WordPress stack.**

## Principle

Graph Commons is the sketchpad. The self-hosted map is the asset. The move from one to the other is a straight port: the node/edge model in `nodes.csv` and `edges.csv` becomes structured data in `rcvda-core`, and an open-source graph library renders it. This keeps it consistent with the WEB-PLATFORM standard (self-hosted, open stack, no Google/SaaS lock-in) and lets the map reuse data RCVDA already holds rather than duplicating it.

## Architecture at a glance

```
Source of truth (rcvda-core)          Feed                 Render (theme/block)
--------------------------------      ----------------     -----------------------
rcvda_organisation (existing CPT) ─┐
rcvda_system_node (roles/boards/  ─┼─▶  REST endpoint  ─▶  [rcvda_system_map]
  programmes/funders)              │    /rcvda/v1/         shortcode/block
rcvda_system_edge (relationships) ─┘    system-map         → Sigma.js + Graphology
                                        {nodes, edges}       (WebGL canvas + list)
```

## Data model

The prototype's two node classes map onto two homes:

- **Organisations already exist.** Councils, NHS trusts, VCSE orgs, education and funders are real organisations — they should be `rcvda_organisation` records (the unified, reg-number-keyed CPT), not re-typed. The map *references* them; it does not own them. This is the whole reason to self-host: the map stays in sync with the org data you already maintain.
- **System-only entities get a light CPT.** Boards, forums, roles/posts and programmes aren't organisations in the registry sense, so a new `rcvda_system_node` CPT holds them, with a `node_type` taxonomy mirroring the prototype's types.
- **Relationships are their own records.** An `rcvda_system_edge` (CPT or custom table) stores `from`, `to`, `edge_type`, `weight`, `reference`. Custom table is cleaner if the graph grows past a few hundred edges; a CPT is quicker to stand up first.

Post-holders stay modelled the prototype way — a `person` field on the role node, not a node of their own — so the map doesn't rot when someone moves job.

### Feed shape

Same philosophy as the locator component (feed-driven, config on the element):

```json
{
  "nodes": [
    { "id": "icb-nenc", "label": "NHS NE&NC ICB", "type": "nhs",
      "geography": "north-east", "url": "/orgs/nenc-icb/", "person": null }
  ],
  "edges": [
    { "id": "e1", "source": "icb-nenc", "target": "sth-ft",
      "type": "commissions", "weight": 3 }
  ]
}
```

Every node needs a stable `id`; edges reference nodes by `id` (the lesson already learned building the locator). A REST route (`/rcvda/v1/system-map`) assembles the feed by joining the org records and system CPTs, so there is one canonical output the front end consumes.

## Rendering

Recommended: **Sigma.js + Graphology.**

- Graphology holds the graph in memory and provides the analysis for free — degree, betweenness centrality, community detection — so "who holds the system together" is computed client-side, not eyeballed.
- Sigma.js renders it on WebGL, which stays smooth well past the point a Miro board or an SVG would choke.
- Both are MIT-licensed, actively maintained, no backend service.

Cytoscape.js is the fallback if you want richer built-in layout/styling out of the box and don't need Sigma's raw scale.

Delivered as an `[rcvda_system_map]` shortcode/block (mirroring `[rcvda_locator]`), with config on the element: initial filter, layout, whether analysis panel shows. Icons via Lucide per the standard. Accessibility matters here — a graph is visual, so the block must also render a **text/list view** of the same feed (nodes grouped by type, each with its relationships listed) so it's usable without the canvas. Respect `prefers-reduced-motion` by shipping a static layout rather than an animated force simulation.

## Feature parity with Graph Commons — and beyond

| Capability | Graph Commons | Self-hosted (this spec) |
|---|---|---|
| Interactive graph | ✅ | ✅ Sigma.js |
| Filter by type/geography | ✅ | ✅ from feed attributes |
| Centrality / clusters | ✅ | ✅ Graphology |
| Data ownership | Export only | ✅ Fully owned |
| Stays in sync with org records | ❌ manual | ✅ single source of truth |
| Public embed on rcvda.org.uk | Embed iframe | ✅ Native block |
| Private/sensitive control | Paid tier | ✅ WordPress caps |
| Effort to stand up | Minutes | Days |

## Migration path (prototype → owned)

1. Finalise structure in Graph Commons; export **GraphML or CSV**.
2. Import script maps each node to either an existing `rcvda_organisation` (match on name/reg number) or a new `rcvda_system_node`; edges become `rcvda_system_edge` records.
3. Build the REST feed route and confirm it emits the JSON shape above.
4. Build the `[rcvda_system_map]` block (Sigma.js + Graphology) plus the accessible list view.
5. Retire the Graph Commons copy, or keep it as a private scratch space for exploration.

## Rough effort

- Data model + import (reusing `rcvda_organisation`): ~1 day
- REST feed: ~half a day
- Block + Sigma render + list view + analysis panel: ~2–3 days
- Content verification pass (yours): ongoing

The heaviest lift is the front-end block; the data side is largely assembling patterns already in `rcvda-core`.

## Open decisions

1. **`rcvda_system_edge` as CPT or custom table?** CPT to start, table if it scales.
2. **Public or gated?** A public "how the system fits together" map has civic value; anything sensitive (named individuals, informal influence) may warrant a logged-in view.
3. **Where does the map live?** A dedicated page on rcvda.org.uk, or embedded within Partnerships content.
4. **Does it write back?** Read-only render first. Editing the graph in-browser is a much bigger build — Graph Commons is the better place to edit until the owned version earns it.

*Companion to `README - Schema & Import.md`. Drafted 2026-07-25.*
