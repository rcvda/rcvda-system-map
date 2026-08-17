<?php
/**
 * Plugin Name:       RCVDA System Map
 * Description:       Reusable interactive network-map tool for RCVDA. Renders a Cytoscape.js graph via the [rcvda_system_map] shortcode — live from a public GitHub repo (jsDelivr CDN) with automatic fallback to a bundled copy, or fully self-contained. Coded geography with switchable lenses (Tees Valley, South Tees, boroughs, ceremonial counties, constituencies). Ships loaded with the South Tees / Tees Valley public system dataset.
 * Version:           0.4.0
 * Author:            RCVDA
 * License:           GPL-2.0-or-later
 * Text Domain:       rcvda-system-map
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'RCVDA_SYSTEM_MAP_VER', '0.4.0' );
define( 'RCVDA_SYSTEM_MAP_URL', plugin_dir_url( __FILE__ ) );
define( 'RCVDA_SYSTEM_MAP_DIR', plugin_dir_path( __FILE__ ) );

/**
 * Default git ref (branch or release tag) used to build the live jsDelivr URL.
 *
 * Pin to a release tag (e.g. 'v0.2.0') for instant, predictable updates — tagged
 * content is immutable and cached permanently by the CDN. 'main' tracks the latest
 * push but jsDelivr caches a branch for up to ~12h. Override per-map with the `ref`
 * shortcode attribute, or globally with the `rcvda_system_map_ref` filter.
 */
function rcvda_system_map_default_ref() {
	return apply_filters( 'rcvda_system_map_ref', 'main' );
}

/**
 * Registry of datasets this tool can render, keyed by a short slug.
 *
 * The plugin is a reusable system-mapping tool; South Tees is simply the first
 * dataset it carries. Each entry names a PUBLIC GitHub repo and the path to a
 * system-data.json ({nodes, edges, sources}) within it. Add more datasets with
 * the `rcvda_system_map_datasets` filter — no code change to this file needed.
 */
function rcvda_system_map_datasets() {
	$datasets = array(
		'south-tees' => array(
			'repo'  => 'rcvda/rcvda-system-map',
			'path'  => 'data/system-data.json',
			'label' => 'South Tees Public System',
		),
	);
	return apply_filters( 'rcvda_system_map_datasets', $datasets );
}

/**
 * Build a jsDelivr CDN URL for a dataset at a given ref.
 *
 * jsDelivr mirrors public GitHub repos from a CDN with permissive CORS — the correct
 * way to reference a repo file from a production front end. (raw.githubusercontent.com
 * is not a CDN, rate-limits, and is not meant for production traffic.) Returns '' if
 * the dataset slug is unknown.
 */
function rcvda_system_map_remote_url( $dataset, $ref = '' ) {
	$sets = rcvda_system_map_datasets();
	if ( empty( $sets[ $dataset ] ) ) {
		return '';
	}
	$repo = $sets[ $dataset ]['repo'];
	$path = ltrim( $sets[ $dataset ]['path'], '/' );
	$ref  = $ref ? $ref : rcvda_system_map_default_ref();
	return sprintf( 'https://cdn.jsdelivr.net/gh/%s@%s/%s', $repo, rawurlencode( $ref ), $path );
}

/**
 * Register (but do not enqueue) all assets. Enqueued on demand by the shortcode.
 */
function rcvda_system_map_register_assets() {
	$base = RCVDA_SYSTEM_MAP_URL . 'assets/js/vendor/';

	wp_register_script( 'rcvda-cytoscape', $base . 'cytoscape.min.js', array(), '3.34.0', true );
	wp_register_script( 'rcvda-layout-base', $base . 'layout-base.js', array(), '2.0.1', true );
	wp_register_script( 'rcvda-cose-base', $base . 'cose-base.js', array( 'rcvda-layout-base' ), '2.2.0', true );
	wp_register_script( 'rcvda-cytoscape-fcose', $base . 'cytoscape-fcose.js', array( 'rcvda-cytoscape', 'rcvda-cose-base' ), '2.2.0', true );

	wp_register_script(
		'rcvda-system-map',
		RCVDA_SYSTEM_MAP_URL . 'assets/js/system-map.js',
		array( 'rcvda-cytoscape', 'rcvda-cytoscape-fcose' ),
		RCVDA_SYSTEM_MAP_VER,
		true
	);

	wp_register_style(
		'rcvda-system-map',
		RCVDA_SYSTEM_MAP_URL . 'assets/css/system-map.css',
		array(),
		RCVDA_SYSTEM_MAP_VER
	);
}
add_action( 'init', 'rcvda_system_map_register_assets' );

/**
 * [rcvda_system_map data="south-tees" lens="tees-valley" context="on" source="live" ref="" height="760px" title="…"]
 *
 * data    — dataset slug from the registry (default "south-tees"), OR a full
 *           http(s) URL to a system-data.json to use directly (advanced override).
 * lens    — initial geography lens the map opens on (switchable in the sidebar).
 *           Administrative: tees-valley (default), cleveland, south-tees, north-tees,
 *           darlington, hartlepool, middlesbrough, redcar-cleveland, stockton.
 *           Ceremonial county: ceremonial-north-yorkshire, ceremonial-county-durham.
 *           Constituency: constituency-redcar, constituency-middlesbrough-south-east-cleveland,
 *           constituency-middlesbrough-thornaby-east (resolve to the borough(s) they cover).
 * context — "on" (default): also show the wider bodies a lens plugs into (regional/
 *           national and connected external partners). "off": show only bodies native
 *           to the lens area.
 * source  — "live" (default): load the dataset from the jsDelivr CDN, falling back
 *           to the copy bundled inside the plugin if the CDN is unreachable or the
 *           repo/ref is not (yet) public. "bundled": use only the bundled copy — fully
 *           self-contained, zero external requests.
 * ref     — git branch or release tag for live data (default: filterable "main").
 * height  — container height (default 760px).
 * title   — heading shown in the map (default: the dataset's label).
 */
function rcvda_system_map_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'height'  => '760px',
			'title'   => '',
			'data'    => 'south-tees',
			'lens'    => 'tees-valley',
			'context' => 'on',
			'source'  => 'live',
			'ref'     => '',
		),
		$atts,
		'rcvda_system_map'
	);

	wp_enqueue_style( 'rcvda-system-map' );
	wp_enqueue_script( 'rcvda-system-map' );

	$bundled  = RCVDA_SYSTEM_MAP_URL . 'assets/data/system-data.json';
	$datasets = rcvda_system_map_datasets();
	$data     = trim( $atts['data'] );
	$source   = ( 'bundled' === strtolower( $atts['source'] ) ) ? 'bundled' : 'live';
	$title    = $atts['title'];

	// Resolve the primary source URL and an optional fallback.
	if ( $data && preg_match( '#^https?://#i', $data ) ) {
		// Advanced: explicit URL override — use as-is, fall back to bundled.
		$src      = $data;
		$fallback = $bundled;
	} elseif ( 'live' === $source && isset( $datasets[ $data ] ) ) {
		// Live from the CDN, with the bundled copy as a safety net.
		$remote   = rcvda_system_map_remote_url( $data, $atts['ref'] );
		$src      = $remote ? $remote : $bundled;
		$fallback = $remote ? $bundled : '';
	} else {
		// Bundled, or an unknown dataset slug: self-contained local copy.
		$src      = $bundled;
		$fallback = '';
	}

	// Default the heading to the dataset's label where we have one.
	if ( '' === $title && isset( $datasets[ $data ]['label'] ) ) {
		$title = $datasets[ $data ]['label'];
	}
	if ( '' === $title ) {
		$title = 'System map';
	}

	$lens    = sanitize_key( $atts['lens'] );
	$context = ( 'off' === strtolower( $atts['context'] ) ) ? 'off' : 'on';

	static $n = 0;
	$n++;
	$id = 'rcvda-system-map-' . $n;

	return sprintf(
		'<div class="rcvda-system-map" id="%s" data-src="%s" data-fallback="%s" data-lens="%s" data-context="%s" data-title="%s" style="height:%s"></div>',
		esc_attr( $id ),
		esc_url( $src ),
		esc_url( $fallback ),
		esc_attr( $lens ),
		esc_attr( $context ),
		esc_attr( $title ),
		esc_attr( $atts['height'] )
	);
}
add_shortcode( 'rcvda_system_map', 'rcvda_system_map_shortcode' );
