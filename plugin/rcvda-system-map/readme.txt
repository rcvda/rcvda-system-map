=== RCVDA System Map ===
Contributors: RCVDA
Requires at least: 6.0
Tested up to: 6.6
Stable tag: 0.1.0
License: GPLv2 or later

Interactive network map of the South Tees public system.

== Description ==
Renders a self-contained, filterable network graph (Cytoscape.js) of the South Tees
public system — organisations, boards, roles and their relationships — from bundled data.

All libraries (Cytoscape.js + fcose layout) and the data are bundled in the plugin;
no external CDN or network calls are required at runtime.

== Usage ==
Place the shortcode on any page or post:

  [rcvda_system_map]

Optional attributes:
  height="760px"   container height (default 760px)
  title="..."      heading shown in the map (default "South Tees Public System")
  data="https://…" override the data file URL (defaults to the bundled data)

== Updating the data ==
Replace assets/data/system-data.json with a new export (same {nodes, edges} shape).

== Roadmap ==
Data is bundled for now. A future version can source it from WordPress custom post
types (organisation / place / service / facility) with a REST feed, per the project's
Self-Hosted Spec, without changing the front-end.

== Changelog ==
= 0.1.0 =
* Initial release: shortcode, bundled Cytoscape + fcose, bundled data, expandable orgs,
  type/tier filters, relationship-kind styling, detail panel with sources.
