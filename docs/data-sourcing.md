# Data sourcing — architecture & decisions

How the installed plugin gets its map data, and why it works this way.

## Decision 1 — this is a tool, not a single map (2026-08-17)

The repo and plugin are **"RCVDA's reusable system-map tool, currently loaded with South Tees
data"** — not "the South Tees map". Consequences that are baked into the code:

- The names stay generic: repo `rcvda-system-map`, plugin slug `rcvda-system-map`, shortcode
  `[rcvda_system_map]`. Deliberately **not** renamed to `south-tees-*`.
- The data source is **configurable**, never hardcoded to South Tees. Datasets live in a
  filterable registry (`rcvda_system_map_datasets`) keyed by slug; a map picks one with
  `data="<slug>"`. South Tees is just the first entry.

## Decision 2 — public repo (2026-08-17)

The data is public-sector structural information drawn from public official sources (council
moderngov sites, published board pages, etc.); named individuals are all public office-holders.
There is no confidentiality case for a private repo, and a public repo is what makes CDN delivery
possible without embedding any credential on the web server. The repo was made public on
2026-08-17.

## Decision 3 — live fetch via CDN, with bundled fallback

The plugin loads the dataset **live** from the public repo through the **jsDelivr** CDN:

```
https://cdn.jsdelivr.net/gh/rcvda/rcvda-system-map@<ref>/data/system-data.json
```

and falls back to the copy bundled inside the plugin (`assets/data/system-data.json`) if that
request fails for any reason.

### Why jsDelivr and not raw.githubusercontent.com

`raw.githubusercontent.com` is not a CDN: it rate-limits, sends no useful long-cache headers, and
is not intended for production traffic. jsDelivr mirrors public GitHub repos on a global CDN with
permissive CORS, so the browser can fetch the file directly and cheaply.

### Why fetch on the client, not proxy through PHP

Because jsDelivr is already a CDN, letting the browser fetch it directly is both simpler and
faster than proxying ~300 KB through WordPress on every view — the CDN and the browser cache do the
work. PHP's only job is to emit the right URLs; there is no server-side transient to maintain and
no load on the site. The plugin passes the browser two URLs:

- `data-src` — the live CDN URL (or, with `source="bundled"`, the local bundled URL).
- `data-fallback` — the local bundled URL.

`system-map.js` fetches `data-src`; on any network error or non-200 it retries `data-fallback`.
That means the map renders even if the CDN is down **or the repo/ref isn't public yet** — the
bundled copy is always a working safety net.

### Freshness / caching

- `@main` — jsDelivr caches a branch for up to ~12 hours. Routine edits appear within that window.
- `@v0.2.0` (a release tag) — immutable and cached permanently; bumping the tag `ref` points at
  gives an **instant, predictable** update. Recommended for anything time-sensitive.
- To force `@main` to refresh immediately, hit the jsDelivr purge URL:
  `https://purge.jsdelivr.net/gh/rcvda/rcvda-system-map@main/data/system-data.json`.

## The update loop

```
edit data/system-data.json  →  ./build/build.sh  →  git commit  →  git push
```

`build.sh` also copies the canonical data into the plugin, so the **fallback** copy shipped in each
plugin build stays current too. A data-only change needs no plugin reinstall; the live site catches
up per the caching rules above. Ship a new plugin build/release only when the **code** changes.

## Shortcode reference (data-related)

| Attribute | Default | Meaning |
|---|---|---|
| `data` | `south-tees` | Dataset slug from the registry, or a full `https://…` URL (advanced). |
| `source` | `live` | `live` = CDN + bundled fallback. `bundled` = local copy only, no network. |
| `ref` | `main` | Git branch or release tag for live data. Pin to a tag for instant updates. |

Filters: `rcvda_system_map_datasets` (add datasets), `rcvda_system_map_ref` (set the default ref).

## Longer-term

The "truly live, edit-in-one-place" endgame is still the `docs/self-hosted-spec.md` path: model the
data as WordPress custom post types (organisation / place / service / facility) with a REST feed, so
WordPress itself is the datastore and GitHub stays purely for version control of the code. The CDN
model here is the pragmatic step that gets push-to-update today without that larger build.
