=== RCVDA System Map ===
Contributors: RCVDA
Requires at least: 6.0
Tested up to: 6.6
Stable tag: 0.2.0
License: GPLv2 or later

Reusable interactive network-map tool for RCVDA. Ships loaded with the South Tees public system dataset.

== Description ==
Renders a filterable network graph (Cytoscape.js + fcose) of a "system" — organisations,
boards, roles and their relationships — via the [rcvda_system_map] shortcode.

The plugin is a reusable tool, not a single map: it can render any dataset published as a
system-data.json ({nodes, edges, sources}) file in a public GitHub repo. It ships with, and
falls back to, a bundled copy of the South Tees public system dataset.

All libraries (Cytoscape.js + fcose layout) are bundled — no external library CDN is used.

== Data sourcing ==
By default the map loads its data LIVE from the public GitHub repo via the jsDelivr CDN, and
falls back automatically to the copy bundled inside the plugin if the CDN is unreachable or the
repo/ref is not public. This means routine data changes reach the site by pushing to the repo —
no plugin reinstall — while the site stays resilient if the CDN is ever down.

Set source="bundled" to ignore the network entirely and render only the bundled copy (fully
self-contained). See docs/data-sourcing.md in the repo for the full architecture.

== Usage ==
Place the shortcode on any page or post:

  [rcvda_system_map]

Optional attributes:
  data="south-tees"   dataset slug from the registry (default), OR a full https URL to a
                      system-data.json to use directly (advanced override)
  source="live"       "live" (default): load from the CDN with bundled fallback.
                      "bundled": use only the bundled copy, no network request.
  ref="main"          git branch or release tag for live data (default: "main").
                      Pin to a release tag, e.g. ref="v0.2.0", for instant, predictable updates.
  height="760px"      container height (default 760px)
  title="..."         heading shown in the map (default: the dataset's label)

Register additional datasets (other public repos / paths) with the `rcvda_system_map_datasets`
filter; set the default live ref globally with the `rcvda_system_map_ref` filter.

== Updating the data ==
Live model: edit data/system-data.json in the repo, run build.sh, commit and push. The site
picks up the change after the CDN cache expires (~12h on a branch) or immediately if you bump the
release tag referenced by `ref`. The bundled copy is refreshed by build.sh so the fallback also
stays current in each shipped plugin build.

== Roadmap ==
A future version can source data from WordPress custom post types (organisation / place /
service / facility) with a REST feed, per the project's Self-Hosted Spec, making WordPress the
live datastore without changing the front end.

== Changelog ==
= 0.2.0 =
* Live data sourcing from the public GitHub repo via jsDelivr CDN, with automatic fallback to the
  bundled copy. New source= and ref= shortcode attributes; data= now also accepts a dataset slug.
* Reframed as a reusable tool with a filterable dataset registry (South Tees is the first dataset).

= 0.1.0 =
* Initial release: shortcode, bundled Cytoscape + fcose, bundled data, expandable orgs,
  type/tier filters, relationship-kind styling, detail panel with sources.
