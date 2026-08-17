<?php
/**
 * Plugin Name:       RCVDA System Map
 * Description:       Interactive network map of the South Tees public system. Renders a self-contained Cytoscape.js graph from bundled data via the [rcvda_system_map] shortcode.
 * Version:           0.1.0
 * Author:            RCVDA
 * License:           GPL-2.0-or-later
 * Text Domain:       rcvda-system-map
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'RCVDA_SYSTEM_MAP_VER', '0.1.0' );
define( 'RCVDA_SYSTEM_MAP_URL', plugin_dir_url( __FILE__ ) );
define( 'RCVDA_SYSTEM_MAP_DIR', plugin_dir_path( __FILE__ ) );

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
 * [rcvda_system_map height="720px" data="" title="South Tees Public System"]
 */
function rcvda_system_map_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'height' => '760px',
			'title'  => 'South Tees Public System',
			'data'   => '', // optional override URL; defaults to bundled data
		),
		$atts,
		'rcvda_system_map'
	);

	wp_enqueue_style( 'rcvda-system-map' );
	wp_enqueue_script( 'rcvda-system-map' );

	$data_url = $atts['data'] ? esc_url( $atts['data'] ) : esc_url( RCVDA_SYSTEM_MAP_URL . 'assets/data/system-data.json' );
	static $n = 0; $n++;
	$id = 'rcvda-system-map-' . $n;

	return sprintf(
		'<div class="rcvda-system-map" id="%s" data-src="%s" data-title="%s" style="height:%s"></div>',
		esc_attr( $id ),
		$data_url,
		esc_attr( $atts['title'] ),
		esc_attr( $atts['height'] )
	);
}
add_shortcode( 'rcvda_system_map', 'rcvda_system_map_shortcode' );
