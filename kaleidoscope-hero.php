<?php
/**
 * Plugin Name:       Kaleidoscope Hero
 * Description:       Animated WebGL hero backgrounds with admin presets, per-page shortcodes, slideshows and seamless black-wipe page transitions.
 * Version:           1.20.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Next Level Exchange
 * License:           GPL-2.0-or-later
 * Text Domain:       kaleidoscope-hero
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DH_VERSION', '1.20.0' );
define( 'DH_URL', plugin_dir_url( __FILE__ ) );

/* ------------------------------------------------------------------ *
 * Settings schema
 * ------------------------------------------------------------------ */

function dh_styles() {
	return array( 'Digital grid', 'Fiber optics', 'Particle waves', 'Wireframe tunnel', 'Data rings', 'Voronoi crystal', 'Constellation', 'Fractal flythrough', 'Word rain', 'Digital fabric', 'Blueprint city', 'Dot matrix structures', 'LED globe', 'Digital disco ball', 'Floating shape', 'Morphing sculptures', 'Iridescent ribbons', 'Wireframe landscape', 'Custom 3D Object' );
}

function dh_palettes() {
	return array( 'Electric blue', 'Cyan', 'Violet', 'Amber', 'Fiber', 'Neon', 'Aurora', 'Ember', 'Ice', 'Matrix', 'Rose gold', 'Ocean', 'Vapor', 'Mono', 'Sunset', 'Gold and blue' );
}

function dh_schema() {
	static $schema = null;
	if ( null !== $schema ) {
		return $schema;
	}
	$r = function ( $label, $min, $max, $step, $default, $help = '' ) {
		return array( 'label' => $label, 'type' => 'range', 'min' => $min, 'max' => $max, 'step' => $step, 'default' => $default, 'help' => $help );
	};
	$schema = array(
		'Scene' => array(
			'scene' => array( 'label' => __( 'Scene', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Kaleidoscope', 'Off' ), 'default' => 'Kaleidoscope', 'help' => __( 'Off removes the rendered effect and keeps your still background and content.', 'kaleidoscope-hero' ) ),
		),
		'Animation'   => array(
			'style'          => array( 'label' => 'Style', 'type' => 'enum', 'options' => dh_styles(), 'default' => 'Digital grid' ),
			'palette'        => array( 'label' => 'Palette', 'type' => 'enum', 'options' => dh_palettes(), 'default' => 'Electric blue' ),
			'ledPattern' => array( 'label' => __( 'LED globe pattern', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Cycle', 'Fireworks', 'Waves', 'Shapes' ), 'default' => 'Cycle', 'help' => __( 'Cycle fades between fireworks, flowing color waves and rotating geometric shapes. Density sets the LED spacing; Flow speed drives the show.', 'kaleidoscope-hero' ) ),
			'opacity'        => $r( 'Element opacity', 0, 1, 0.05, 1, 'Tones the animated elements down without changing the background colours.' ),
			'density'        => $r( 'Density', 0.1, 1, 0.05, 0.55 ),
			'flow'           => $r( 'Flow speed', 0, 12, 0.5, 2.5 ),
			'glow'           => $r( 'Glow', 0, 3, 0.1, 1 ),
			'brightness'     => $r( 'Brightness', 0.2, 2.5, 0.05, 1 ),
			'multicolor'     => $r( 'Multicolour', 0, 1, 0.05, 0.35 ),
			'kaleidoscope'   => $r( 'Kaleidoscope mirrors', 0, 12, 1, 0, '0 or 1 turns it off.' ),
			'kaleidoscopeMode' => array( 'label' => __( 'Kaleidoscope mode', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Forward elements', 'Whole screen', 'Both' ), 'default' => 'Forward elements', 'help' => __( 'Whole screen mirrors the complete animation, including nearby and outer elements. Forward elements keeps the existing scene effect. Both combines them. Set mirrors to 2 or more.', 'kaleidoscope-hero' ) ),
			'randomize'      => array( 'label' => 'Randomize', 'type' => 'bool', 'default' => false, 'help' => 'Cycles through random styles, palettes and settings.' ),
			'randomInterval' => $r( 'Random interval (seconds)', 5, 60, 1, 15 ),
		),
		'Custom 3D Object' => array(
			'modelSource' => array( 'label' => __( 'Object source', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( '3D model (GLB)', 'SVG extrusion' ), 'default' => '3D model (GLB)' ),
			'modelUrl' => array( 'label' => __( '3D model', 'kaleidoscope-hero' ), 'type' => 'model', 'default' => '', 'help' => __( 'Leave blank for the included crystal. Upload a self-contained .glb with embedded textures (10 MB maximum; under 500 KB is a good target).', 'kaleidoscope-hero' ) ),
			'svgUrl' => array( 'label' => __( 'SVG logo', 'kaleidoscope-hero' ), 'type' => 'svgmodel', 'default' => '', 'help' => __( 'Leave blank for the sample badge. Filled paths, shapes, holes and gradients are supported. Convert live text and strokes to paths first; photos and filters cannot be extruded.', 'kaleidoscope-hero' ) ),
			'svgDepth' => $r( __( 'Raised depth', 'kaleidoscope-hero' ), 0, 0.5, 0.01, 0.12, __( 'Relative to the logo width or height. 0 keeps the logo flat.', 'kaleidoscope-hero' ) ),
			'svgBevel' => $r( __( 'Rounded edges / bevel', 'kaleidoscope-hero' ), 0, 0.05, 0.001, 0.005, __( 'Keep this small for thin or intricate shapes. 0 makes sharp edges.', 'kaleidoscope-hero' ) ),
			'modelDisplay' => array( 'label' => __( 'Display as', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Solid', 'Wireframe', 'Particles' ), 'default' => 'Solid' ),
			'modelColor' => array( 'label' => __( 'Model colors', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Original materials', 'Palette' ), 'default' => 'Original materials', 'help' => __( 'Keep the file colors or recolor with the preset palette. Wireframe always uses the palette.', 'kaleidoscope-hero' ) ),
			'modelSize' => $r( __( 'Object size', 'kaleidoscope-hero' ), 0.3, 2, 0.05, 1 ),
			'modelFloat' => $r( __( 'Floating motion', 'kaleidoscope-hero' ), 0, 2, 0.05, 1 ),
			'modelRotation' => array( 'label' => __( 'Rotation', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Automatic', 'Mouse', 'Off' ), 'default' => 'Automatic' ),
			'modelAxis' => array( 'label' => __( 'Rotation axis', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'X', 'Y', 'Z' ), 'default' => 'Y' ),
			'modelRotationSpeed' => $r( __( 'Rotation speed', 'kaleidoscope-hero' ), -2, 2, 0.05, 0.5, __( 'Negative values reverse the direction. Animation speed 0 pauses automatic rotation and floating.', 'kaleidoscope-hero' ) ),
			'modelRotateX' => $r( __( 'Starting tilt X', 'kaleidoscope-hero' ), -180, 180, 1, 10 ),
			'modelRotateY' => $r( __( 'Starting tilt Y', 'kaleidoscope-hero' ), -180, 180, 1, 0 ),
			'modelRotateZ' => $r( __( 'Starting tilt Z', 'kaleidoscope-hero' ), -180, 180, 1, 0 ),
		),
		'Wireframe tunnel' => array(
			'trailSpeed' => $r( __( 'Particle speed', 'kaleidoscope-hero' ), 0.25, 3, 0.05, 1, __( 'Each wire has its own staggered timing and speed. Flow speed 0 pauses travel.', 'kaleidoscope-hero' ) ),
			'trailLength' => $r( __( 'Light tail length', 'kaleidoscope-hero' ), 0.2, 3, 0.05, 1 ),
			'trailAmount' => $r( __( 'Active particle lanes', 'kaleidoscope-hero' ), 0, 1, 0.05, 0.8, __( '0 leaves the wire grid without racing particles.', 'kaleidoscope-hero' ) ),
		),
		'Wireframe landscape' => array(
			'terrainType' => array( 'label' => __( 'Landscape', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Mixed landscape', 'Hills', 'Mountains', 'Desert' ), 'default' => 'Mixed landscape', 'help' => __( 'Mixed landscape travels through flat deserts, rolling hills and mountain ridges.', 'kaleidoscope-hero' ) ),
			'terrainHeight' => $r( __( 'Terrain height', 'kaleidoscope-hero' ), 0, 2, 0.05, 1, __( '0 makes a flat grid.', 'kaleidoscope-hero' ) ),
			'terrainScale' => $r( __( 'Landform scale', 'kaleidoscope-hero' ), 0.5, 3, 0.05, 1 ),
			'terrainGrid' => $r( __( 'Grid spacing detail', 'kaleidoscope-hero' ), 0.5, 3, 0.05, 1 ),
			'terrainSun' => array( 'label' => __( 'Retro horizon sun', 'kaleidoscope-hero' ), 'type' => 'bool', 'default' => true ),
		),
		'Blueprint city' => array(
			'cityAppearance' => array( 'label' => __( 'City appearance', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Blueprint', 'Night skyline' ), 'default' => 'Blueprint', 'help' => __( 'Night skyline uses dark solid facades and scattered white windows. Try Mono or Ice, low Bloom and a nearly black background.', 'kaleidoscope-hero' ) ),
			'cityWindows' => $r( __( 'Lit windows', 'kaleidoscope-hero' ), 0, 1, 0.05, 0.35 ),
		),
		'Iridescent ribbons' => array(
			'ribbonCount' => $r( __( 'Ribbon count', 'kaleidoscope-hero' ), 1, 5, 1, 3 ),
			'ribbonWidth' => $r( __( 'Ribbon width', 'kaleidoscope-hero' ), 0.3, 2.5, 0.05, 1.1 ),
			'ribbonFold' => $r( __( 'Folding', 'kaleidoscope-hero' ), 0, 2, 0.05, 1 ),
			'ribbonTwist' => $r( __( 'Ribbon twist', 'kaleidoscope-hero' ), 0, 4, 0.05, 1.4 ),
			'ribbonTransparency' => $r( __( 'Translucency', 'kaleidoscope-hero' ), 0.1, 0.9, 0.05, 0.6, __( 'Higher values make the ribbon faces more transparent. Reflective edges remain visible.', 'kaleidoscope-hero' ) ),
			'ribbonIridescence' => $r( __( 'Iridescence', 'kaleidoscope-hero' ), 0, 2, 0.05, 1, __( 'Changes color with the folds and viewing angle. 0 uses the selected palette.', 'kaleidoscope-hero' ) ),
			'ribbonEdge' => $r( __( 'Edge shine', 'kaleidoscope-hero' ), 0, 3, 0.05, 1.4 ),
			'ribbonBend' => $r( __( 'Cursor bend', 'kaleidoscope-hero' ), 0, 2, 0.05, 1, __( 'Pulls and bends the surface near the cursor. Works with Mouse look at 0. Set to 0 to disable bending.', 'kaleidoscope-hero' ) ),
			'ribbonRadius' => $r( __( 'Bend radius', 'kaleidoscope-hero' ), 0.1, 1, 0.05, 0.45 ),
			'ribbonScroll' => array( 'label' => __( 'Scroll response', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Off', 'Twist', 'Unwrap', 'Twist and unwrap' ), 'default' => 'Twist', 'help' => __( 'Scrolling down from the section top twists or unfolds the ribbons. Scrolling back reverses it. Works with Flow speed at 0.', 'kaleidoscope-hero' ) ),
			'ribbonScrollStrength' => $r( __( 'Scroll strength', 'kaleidoscope-hero' ), 0, 2, 0.05, 1 ),
			'ribbonScrollDistance' => $r( __( 'Ribbon scroll distance (screens)', 'kaleidoscope-hero' ), 0.25, 4, 0.25, 1.5 ),
		),
		'Tessellation' => array(
			'tessellation' => array( 'label' => __( 'Tiling pattern', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Off', 'Squares', 'Mirrored squares', 'Triangles', 'Hexagons' ), 'default' => 'Off', 'help' => __( 'Repeats the animated elements across the screen. Works on its own or together with kaleidoscope and vortex. Background gradient and page text stay untiled. Off keeps the original scene.', 'kaleidoscope-hero' ) ),
			'tessellationDensity' => $r( __( 'Repeat density', 'kaleidoscope-hero' ), 1, 8, 0.25, 3, __( 'Higher values create more, smaller tiles. Tiles keep their proportions on wide and narrow screens.', 'kaleidoscope-hero' ) ),
			'tessellationZoom' => $r( __( 'Tile zoom', 'kaleidoscope-hero' ), 0.5, 2, 0.05, 1, __( 'Zooms the elements inside each tile without changing the tiling density.', 'kaleidoscope-hero' ) ),
			'tessellationRotation' => $r( __( 'Pattern rotation (°)', 'kaleidoscope-hero' ), 0, 360, 5, 0 ),
		),
		'Sculpture' => array(
			'shape' => array( 'label' => __( 'Shape', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Torus knot', 'Ring', 'Orb', 'Twisted ribbon', 'Helix', 'Star', 'Crystal', 'Seeded sculpture' ), 'default' => 'Torus knot' ),
			'shapeSeed' => $r( __( 'Shape variation / seed', 'kaleidoscope-hero' ), 1, 999, 1, 17, __( 'Choose a repeatable unique particle arrangement. Seeded sculpture also changes the silhouette.', 'kaleidoscope-hero' ) ),
			'shapeSize' => $r( __( 'Shape size', 'kaleidoscope-hero' ), 0.3, 2, 0.05, 1 ),
			'shapeFloat' => $r( __( 'Floating motion', 'kaleidoscope-hero' ), 0, 2, 0.05, 1 ),
			'shapeLobes' => $r( __( 'Lobes / star points', 'kaleidoscope-hero' ), 2, 10, 1, 5, __( 'Used by Star and Seeded sculpture.', 'kaleidoscope-hero' ) ),
			'shapeTwist' => $r( __( 'Shape twist', 'kaleidoscope-hero' ), 0, 4, 0.1, 1.5, __( 'Used by Twisted ribbon and Seeded sculpture.', 'kaleidoscope-hero' ) ),
			'shapeMouseEffect' => array( 'label' => __( 'Mouse particle effect', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Whole sculpture explosion', 'Local explosion', 'Attract', 'Repel', 'Off' ), 'default' => 'Whole sculpture explosion', 'help' => __( 'Local explosion scatters points near a moving pointer. Attract and Repel follow the pointer while hovering and replace the movement-triggered explosion. Scroll explosion is controlled separately below.', 'kaleidoscope-hero' ) ),
			'shapeMouseRadius' => $r( __( 'Mouse influence radius', 'kaleidoscope-hero' ), 0.05, 0.8, 0.01, 0.18, __( 'Fraction of the visible canvas shorter side. Only particles inside this radius respond to the mouse when Outside influence is 0.', 'kaleidoscope-hero' ) ),
			'shapeMouseStrength' => $r( __( 'Mouse force strength', 'kaleidoscope-hero' ), 0, 3, 0.05, 1, __( 'Strength of attraction or repulsion. 0 disables the force. Local explosion uses Explosion strength instead.', 'kaleidoscope-hero' ) ),
			'shapeMouseGlobal' => $r( __( 'Outside influence', 'kaleidoscope-hero' ), 0, 1, 0.05, 0, __( '0 affects nearby particles only. Increase to involve the rest of the sculpture; 1 gives every point full influence.', 'kaleidoscope-hero' ) ),
			'shapeTrigger' => array( 'label' => __( 'Explode with', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Off', 'Mouse movement', 'Scroll', 'Mouse and scroll' ), 'default' => 'Mouse and scroll', 'help' => __( 'Whole sculpture explosion scatters all points on mouse movement. Local explosion affects the selected mouse radius. Scroll pulls the whole shape apart and reverses when scrolling back.', 'kaleidoscope-hero' ) ),
			'shapeExplode' => $r( __( 'Explosion strength', 'kaleidoscope-hero' ), 0, 3, 0.05, 1 ),
			'shapeSensitivity' => $r( __( 'Mouse sensitivity', 'kaleidoscope-hero' ), 0.1, 3, 0.1, 1 ),
			'shapeRecovery' => $r( __( 'Reform time (seconds)', 'kaleidoscope-hero' ), 0.2, 5, 0.1, 1.2 ),
			'shapeScrollDistance' => $r( __( 'Scroll distance (screens)', 'kaleidoscope-hero' ), 0.25, 2, 0.05, 0.75 ),
		),
		'Morphing sculptures' => array(
			'morphMode' => array( 'label' => __( 'Morph control', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Cycle shapes', 'Back and forth', 'Scroll', 'Manual' ), 'default' => 'Cycle shapes', 'help' => __( 'Cycle visits all eight shapes, starting with From shape. Back and forth uses the selected pair. Scroll reverses as you scroll back. Manual holds the progress slider.', 'kaleidoscope-hero' ) ),
			'morphFrom' => array( 'label' => __( 'From shape', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Torus knot', 'Ring', 'Orb', 'Twisted ribbon', 'Helix', 'Star', 'Crystal', 'Seeded sculpture' ), 'default' => 'Orb' ),
			'morphTo' => array( 'label' => __( 'To shape', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Torus knot', 'Ring', 'Orb', 'Twisted ribbon', 'Helix', 'Star', 'Crystal', 'Seeded sculpture' ), 'default' => 'Torus knot' ),
			'morphDuration' => $r( __( 'Morph duration (seconds)', 'kaleidoscope-hero' ), 1, 15, 0.5, 4, __( 'At the default Flow speed of 2.5. Flow 0 pauses automatic morphing and rotation.', 'kaleidoscope-hero' ) ),
			'morphHold' => $r( __( 'Hold each shape (seconds)', 'kaleidoscope-hero' ), 0, 8, 0.5, 1 ),
			'morphProgress' => $r( __( 'Morph progress', 'kaleidoscope-hero' ), 0, 1, 0.01, 0, __( '0 is From shape; 1 is To shape. Used by Manual control.', 'kaleidoscope-hero' ) ),
			'morphStagger' => $r( __( 'Particle stagger', 'kaleidoscope-hero' ), 0, 0.8, 0.05, 0.15, __( '0 moves the points together. Higher values let different points begin at different times.', 'kaleidoscope-hero' ) ),
			'morphScrollDistance' => $r( __( 'Morph scroll distance (screens)', 'kaleidoscope-hero' ), 0.25, 4, 0.25, 1, __( 'Distance from the section top to complete the transformation. Works with Flow 0.', 'kaleidoscope-hero' ) ),
			'morphExplode' => array( 'label' => __( 'Also allow explosion', 'kaleidoscope-hero' ), 'type' => 'bool', 'default' => false, 'help' => __( 'Enables whole-sculpture explosion as an additional interaction. Local mouse effects work independently of this option.', 'kaleidoscope-hero' ) ),
		),
		'Background'  => array(
			'bgColor1'      => array( 'label' => 'Colour 1', 'type' => 'color', 'default' => '#140a2e' ),
			'bgColor2'      => array( 'label' => 'Colour 2', 'type' => 'color', 'default' => '#000000' ),
			'gradient'      => array( 'label' => 'Gradient', 'type' => 'enum', 'options' => array( 'Radial', 'Linear' ), 'default' => 'Radial' ),
			'gradientAngle' => $r( 'Linear angle (°)', 0, 360, 5, 90 ),
		),
		'Interaction' => array(
			'lookRange'  => $r( 'Mouse look', 0, 2, 0.05, 1, __( '0 turns off camera following. Lower values give a gentler pull.', 'kaleidoscope-hero' ) ),
			'discoMouseControl' => array( 'label' => __( 'Mouse controls disco rotation', 'kaleidoscope-hero' ), 'type' => 'bool', 'default' => true, 'help' => __( 'Left of the ball turns it left; right turns it right. The center slows it down. Works with Mouse look set to 0. Away from the scene, it returns to automatic rotation. Flow speed controls its speed.', 'kaleidoscope-hero' ) ),
			'warp'       => $r( 'Warp on mouse hold', 0, 2.5, 0.05, 1 ),
			'bloom'      => $r( 'Bloom', 0, 2.5, 0.05, 1 ),
			'vortex'     => $r( 'Edge vortex', 0, 2.5, 0.05, 1 ),
			'vortexRamp' => $r( 'Vortex ramp (seconds)', 0.2, 10, 0.1, 2 ),
			'autoVortex' => array( 'label' => __( 'Automatic vortex', 'kaleidoscope-hero' ), 'type' => 'bool', 'default' => false, 'help' => __( 'Starts on load and twists the whole animation. Works without moving the mouse.', 'kaleidoscope-hero' ) ),
			'autoVortexStrength' => $r( __( 'Automatic vortex strength', 'kaleidoscope-hero' ), 0, 2.5, 0.05, 0.5, __( '0 removes the automatic twist and rotation.', 'kaleidoscope-hero' ) ),
			'autoVortexSpeed' => $r( __( 'Automatic vortex speed', 'kaleidoscope-hero' ), 0, 3, 0.05, 0.5, __( '0 holds the twist still.', 'kaleidoscope-hero' ) ),
			'autoVortexDirection' => array( 'label' => __( 'Automatic vortex direction', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Clockwise', 'Counterclockwise' ), 'default' => 'Clockwise' ),
			'autoVortexRamp' => $r( __( 'Automatic vortex startup (seconds)', 'kaleidoscope-hero' ), 0, 10, 0.1, 2, __( 'Time to reach full strength after loading or enabling. 0 starts immediately.', 'kaleidoscope-hero' ) ),
		),
		'Color blending' => array(
			'blendMode' => array( 'label' => __( 'Blend mode', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Off', 'Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten', 'Color dodge', 'Color burn', 'Hard light', 'Soft light', 'Difference', 'Exclusion', 'Hue', 'Saturation', 'Color', 'Luminosity' ), 'default' => 'Off', 'help' => __( 'Blends after bloom using your background gradient or a separate color. Multiply colors bright white highlights; Color preserves their brightness. Text and page content keep their own colors. Off keeps the original look.', 'kaleidoscope-hero' ) ),
			'blendSource' => array( 'label' => __( 'Blend source', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Background gradient', 'Blend color' ), 'default' => 'Blend color', 'help' => __( 'Background gradient blends the elements with the existing background colors, gradient type and angle. Empty background areas retain their original gradient. Blend color keeps the separate color layer.', 'kaleidoscope-hero' ) ),
			'blendColor' => array( 'label' => __( 'Blend color', 'kaleidoscope-hero' ), 'type' => 'color', 'default' => '#8866ff', 'help' => __( 'The color layer mixed with the animation. Try violet or cyan with Multiply, or change this color to explore the other modes.', 'kaleidoscope-hero' ) ),
			'blendAmount' => $r( __( 'Blend strength', 'kaleidoscope-hero' ), 0, 1, 0.01, 1, __( '0 keeps the original animation; 1 applies the full blend. Works with all animation styles, presets and templates.', 'kaleidoscope-hero' ) ),
		),
		'Content'     => array(
			'overlay'    => array( 'label' => 'Show text overlay', 'type' => 'bool', 'default' => true ),
			'headingTag' => array( 'label' => 'Heading tag', 'type' => 'enum', 'options' => array( 'h1', 'h2', 'p' ), 'default' => 'h1', 'help' => 'Use h1 on the homepage, h2 if the page already has an h1.' ),
			'heading'    => array( 'label' => 'Heading', 'type' => 'text', 'default' => 'Design & Marketing Consulting' ),
			'subheading' => array( 'label' => 'Subheading', 'type' => 'textarea', 'default' => 'Helping businesses make sense of a consistently confusing digital world.' ),
			'buttonText' => array( 'label' => 'Button text', 'type' => 'text', 'default' => "Let's Go" ),
			'buttonUrl'  => array( 'label' => 'Button link', 'type' => 'url', 'default' => '' ),
			'aboutText'  => array( 'label' => 'Left link text', 'type' => 'text', 'default' => 'About' ),
			'aboutUrl'   => array( 'label' => 'Left link', 'type' => 'url', 'default' => '' ),
			'workText'   => array( 'label' => 'Right link text', 'type' => 'text', 'default' => 'Work' ),
			'workUrl'    => array( 'label' => 'Right link', 'type' => 'url', 'default' => '' ),
			'moreText'   => array( 'label' => 'Top link text', 'type' => 'text', 'default' => 'More' ),
			'moreUrl'    => array( 'label' => 'Top link', 'type' => 'url', 'default' => '' ),
			'brackets'   => array( 'label' => 'Corner brackets', 'type' => 'bool', 'default' => true ),
		),
		'Layout'      => array(
			'mode' => array( 'label' => __( 'Display mode', 'kaleidoscope-hero' ), 'type' => 'enum', 'options' => array( 'Hero', 'Section background' ), 'default' => 'Hero', 'help' => __( 'Section background hides the built-in content and fills the surrounding section.', 'kaleidoscope-hero' ) ),
			'darkness' => $r( __( 'Background darkness', 'kaleidoscope-hero' ), 0, 0.9, 0.05, 0.35, __( 'Adds a dark tint behind your section content. Used in Section background mode.', 'kaleidoscope-hero' ) ),
			'height' => array( 'label' => 'Height', 'type' => 'css', 'default' => '100vh', 'help' => 'Standalone hero height, e.g. 100vh, 70vh or 640px. Section backgrounds follow their content automatically.' ),
		),
	);
	return $schema;
}

function dh_fields() {
	$out = array();
	foreach ( dh_schema() as $fields ) {
		$out += $fields;
	}
	return $out;
}

function dh_defaults() {
	$out = array();
	foreach ( dh_fields() as $k => $f ) {
		$out[ $k ] = $f['default'];
	}
	return $out;
}

function dh_sanitize_value( $f, $v ) {
	switch ( $f['type'] ) {
		case 'range':
			$v = is_numeric( $v ) ? (float) $v : (float) $f['default'];
			return max( $f['min'], min( $f['max'], $v ) );
		case 'enum':
			return in_array( (string) $v, $f['options'], true ) ? (string) $v : $f['default'];
		case 'bool':
			return in_array( $v, array( true, 1, '1', 'true', 'yes', 'on' ), true );
		case 'color':
			$c = sanitize_hex_color( (string) $v );
			return $c ? $c : $f['default'];
		case 'url':
			return esc_url_raw( trim( (string) $v ) );
		case 'model':
		case 'svgmodel':
			return esc_url_raw( trim( (string) $v ), array( 'http', 'https' ) );
		case 'textarea':
			return sanitize_textarea_field( (string) $v );
		case 'css':
			$v = trim( (string) $v );
			return preg_match( '/^\d+(\.\d+)?(px|vh|svh|dvh|lvh|%|rem|em)$/', $v ) ? $v : $f['default'];
		default:
			return sanitize_text_field( (string) $v );
	}
}

/** Merge and validate supported fields, dropping obsolete settings. */
function dh_sanitize_settings( $in, $base ) {
	$out = array_intersect_key( array_merge( dh_defaults(), (array) $base ), dh_fields() );
	foreach ( dh_fields() as $k => $f ) {
		$out[ $k ] = dh_sanitize_value( $f, is_array( $in ) && array_key_exists( $k, $in ) ? $in[ $k ] : $out[ $k ] );
	}
	return $out;
}

function dh_get_presets() {
	$p = get_option( 'dh_presets' );
	if ( ! is_array( $p ) || empty( $p ) ) {
		$p = array( 'home' => array( 'name' => 'Home', 'settings' => dh_defaults() ) );
	}
	foreach ( $p as $slug => $preset ) {
		$p[ $slug ] = array(
			'name'     => isset( $preset['name'] ) ? $preset['name'] : $slug,
			'settings' => dh_sanitize_settings( array(), isset( $preset['settings'] ) ? (array) $preset['settings'] : array() ),
		);
		foreach ( array( 'style', 'palette' ) as $key ) {
			$p[ $slug ]['settings'][ $key ] = dh_sanitize_value( dh_fields()[ $key ], $p[ $slug ]['settings'][ $key ] );
		}
	}
	return $p;
}

function dh_get_global() {
	return wp_parse_args(
		(array) get_option( 'dh_global', array() ),
		array(
			'transitions' => 'marked',
			'reveal'      => 'fade',
			'wipe_color'  => '#000000',
			'quality'     => 'medium',
			'fonts'       => true,
		)
	);
}


/* ------------------------------------------------------------------ *
 * Front-end assets
 * ------------------------------------------------------------------ */

function dh_register_assets() {
	$assets = plugin_dir_path( __FILE__ ) . 'assets/';
	$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '.js' : '.min.js';
	wp_register_style( 'dh-fonts', DH_URL . 'assets/fonts.css', array(), (string) filemtime( $assets . 'fonts.css' ) );
	wp_register_style( 'kaleidoscope-hero', DH_URL . 'assets/kaleidoscope-hero.css', array(), (string) filemtime( $assets . 'kaleidoscope-hero.css' ) );
	wp_register_script( 'kaleidoscope-hero', DH_URL . 'assets/kaleidoscope-hero' . $suffix, array(), (string) filemtime( $assets . 'kaleidoscope-hero' . $suffix ), true );
	wp_register_script( 'dh-scenes', DH_URL . 'assets/dh-scenes' . $suffix, array(), (string) filemtime( $assets . 'dh-scenes' . $suffix ), true );
	wp_add_inline_script( 'dh-scenes', 'window.DH_SCENES=' . wp_json_encode( array(
		'kaleidoscope' => add_query_arg( 'ver', filemtime( $assets . 'kaleidoscope-hero' . $suffix ), DH_URL . 'assets/kaleidoscope-hero' . $suffix ),
		'disco'       => add_query_arg( 'ver', filemtime( $assets . 'dh-disco' . $suffix ), DH_URL . 'assets/dh-disco' . $suffix ),
		'floating'    => add_query_arg( 'ver', filemtime( $assets . 'dh-floating' . $suffix ), DH_URL . 'assets/dh-floating' . $suffix ),
		'modelLoader' => add_query_arg( 'ver', filemtime( $assets . 'dh-model-loader.min.js' ), DH_URL . 'assets/dh-model-loader.min.js' ),
		'modelRuntime' => add_query_arg( 'ver', filemtime( $assets . 'dh-model-runtime.min.js' ), DH_URL . 'assets/dh-model-runtime.min.js' ),
		'modelDraco' => DH_URL . 'assets/model-draco/',
		'modelSample' => DH_URL . 'assets/models/crystal.glb',
		'svgSample' => DH_URL . 'assets/models/badge.svg',
	) ) . ';', 'before' );
	wp_script_add_data( 'dh-scenes', 'strategy', 'defer' );
	wp_register_script( 'dh-transitions', DH_URL . 'assets/dh-transitions' . $suffix, array(), (string) filemtime( $assets . 'dh-transitions' . $suffix ), true );
	wp_script_add_data( 'kaleidoscope-hero', 'strategy', 'defer' );
	wp_script_add_data( 'dh-transitions', 'strategy', 'defer' );
}
add_action( 'init', 'dh_register_assets' );

function dh_page_has_hero() {
	if ( ! is_singular() ) {
		return false;
	}
	$post = get_post();
	return $post && ( has_shortcode( $post->post_content, 'kaleidoscope_hero' ) || has_shortcode( $post->post_content, 'digital_hero' ) || has_block( 'kaleidoscope-hero/section', $post ) );
}

function dh_enqueue_front() {
	$g = dh_get_global();
	if ( 'off' !== $g['transitions'] ) {
		wp_enqueue_style( 'kaleidoscope-hero' );
		wp_enqueue_script( 'dh-transitions' );
		wp_add_inline_script( 'dh-transitions', 'window.DH_TRANSITIONS=' . wp_json_encode( array( 'mode' => $g['transitions'], 'reveal' => $g['reveal'] ) ) . ';', 'before' );
	}
	if ( dh_page_has_hero() ) {
		wp_enqueue_style( 'kaleidoscope-hero' );
		$post = get_post();
		if ( $g['fonts'] && $post && ( has_shortcode( $post->post_content, 'kaleidoscope_hero' ) || has_shortcode( $post->post_content, 'digital_hero' ) ) ) {
			wp_enqueue_style( 'dh-fonts' );
		}
	}
}
add_action( 'wp_enqueue_scripts', 'dh_enqueue_front' );

/** Cover the page before first paint when arriving through a transition. */
function dh_head_cover() {
	$g = dh_get_global();
	if ( 'off' === $g['transitions'] ) {
		return;
	}
	$c = sanitize_hex_color( $g['wipe_color'] );
	$c = $c ? $c : '#000000';
	echo '<style id="dh-cover">:root{--dh-wipe-color:' . esc_attr( $c ) . '}html.dh-covered{background:' . esc_attr( $c ) . '}</style>' . "\n";
	echo "<script>(function(){try{var d=sessionStorage.getItem('dh_wipe');if(d){var h=document.documentElement;h.classList.add('dh-covered');h.setAttribute('data-dh-dir',d);setTimeout(function(){h.classList.remove('dh-covered');},6000);}}catch(e){}})();</script>\n";
}
add_action( 'wp_head', 'dh_head_cover', 1 );

function dh_body_wipe() {
	$g = dh_get_global();
	if ( 'off' === $g['transitions'] ) {
		return;
	}
	echo '<div id="dh-wipe" class="dh-wipe" aria-hidden="true"><span class="dh-spinner"></span></div>';
}
add_action( 'wp_body_open', 'dh_body_wipe' );

/* ------------------------------------------------------------------ *
 * Shortcode + render
 * ------------------------------------------------------------------ */

function dh_shortcode( $atts, $content = null ) {
	$atts    = is_array( $atts ) ? $atts : array();
	if ( isset( $atts['mode'] ) ) {
		$atts['mode'] = 'background' === strtolower( (string) $atts['mode'] ) || 'section background' === strtolower( (string) $atts['mode'] ) ? 'Section background' : 'Hero';
	}
	$presets = dh_get_presets();
	$slugs   = array();
	if ( ! empty( $atts['presets'] ) ) {
		$slugs = array_filter( array_map( 'sanitize_title', explode( ',', $atts['presets'] ) ) );
	} elseif ( ! empty( $atts['preset'] ) ) {
		$slugs = array( sanitize_title( $atts['preset'] ) );
	}

	$lower = array();
	foreach ( dh_fields() as $k => $f ) {
		$lower[ strtolower( $k ) ] = $k;
	}
	$over = array();
	foreach ( $atts as $ak => $av ) {
		$ak = strtolower( (string) $ak );
		if ( isset( $lower[ $ak ] ) ) {
			$over[ $lower[ $ak ] ] = $av;
		}
	}

	$slides = array();
	foreach ( $slugs as $s ) {
		if ( isset( $presets[ $s ] ) ) {
			$slides[] = dh_sanitize_settings( $over, $presets[ $s ]['settings'] );
		}
	}
	if ( empty( $slides ) ) {
		$first    = reset( $presets );
		$slides[] = dh_sanitize_settings( $over, $first['settings'] );
	}
	$interval = isset( $atts['interval'] ) ? max( 3, (float) $atts['interval'] ) : 20;
	if ( 'Section background' === $slides[0]['mode'] && null !== $content && '' !== trim( (string) $content ) ) {
		return '<section class="dh-section dh-section--wrapped">' . dh_render( $slides, $interval ) . '<div class="dh-section-content">' . do_shortcode( $content ) . '</div></section>';
	}
	return dh_render( $slides, $interval, $content );
}
add_shortcode( 'kaleidoscope_hero', 'dh_shortcode' );
add_shortcode( 'digital_hero', 'dh_shortcode' ); // legacy name

function dh_render( $slides, $interval = 20, $content = null, $preview = false ) {
	$slides = array_map( function ( $slide ) { return dh_sanitize_settings( $slide, dh_defaults() ); }, $slides );
	$g = dh_get_global();
	$s = array_merge( dh_defaults(), $slides[0] );
	$background = 'Section background' === $s['mode'];
	wp_enqueue_style( 'kaleidoscope-hero' );
	if ( $g['fonts'] && ! $background ) {
		wp_enqueue_style( 'dh-fonts' );
	}
	wp_enqueue_script( 'dh-scenes' );

	$client_slides = array_values( $slides );
	$data  = array( 'slides' => $client_slides, 'interval' => (float) $interval, 'quality' => $g['quality'] );
	$data['background'] = $background;
	$style = '--dh-height:' . $s['height'] . ';--dh-bg1:' . $s['bgColor1'] . ';--dh-bg2:' . $s['bgColor2'] . ';--dh-darkness:' . (float) $s['darkness'] . ';';
	$tag   = in_array( $s['headingTag'], array( 'h1', 'h2', 'p' ), true ) ? $s['headingTag'] : 'h1';
	$link  = function ( $u ) {
		return $u ? $u : '#';
	};
	$hide  = function ( $show ) {
		return $show ? '' : ' style="display:none"';
	};
	$custom = null !== $content && '' !== trim( (string) $content );

	ob_start();
	?>
<div class="dh-hero<?php echo $preview ? ' dh-hero--preview' : ''; ?><?php echo $background ? ' dh-hero--background' : ''; ?>"<?php echo $background ? ' aria-hidden="true"' : ''; ?><?php echo $preview ? ' data-dh-preview-label="' . esc_attr__( 'Your section content appears here', 'kaleidoscope-hero' ) . '"' : ''; ?> style="<?php echo esc_attr( $style ); ?>" data-dh="<?php echo esc_attr( wp_json_encode( $data ) ); ?>">
	<canvas class="dh-canvas" aria-hidden="true"></canvas>
	<div class="dh-vignette" aria-hidden="true"></div>
	<?php if ( $custom && ! $background ) : ?>
	<div class="dh-overlay dh-overlay--custom"><div class="dh-main"><div class="dh-card"><?php echo do_shortcode( $content ); ?></div></div></div>
	<?php elseif ( ( ! $background && $s['overlay'] ) || $preview ) : ?>
	<div class="dh-overlay"<?php echo $hide( $s['overlay'] ); ?>>
		<a class="dh-link dh-more dh-transition" data-dh-dir="right" href="<?php echo esc_url( $link( $s['moreUrl'] ) ); ?>"<?php echo $hide( '' !== $s['moreText'] ); ?>>
			<span class="dh-more-text"><?php echo esc_html( $s['moreText'] ); ?></span>
			<span class="dh-more-lines" aria-hidden="true"><span></span><span></span></span>
		</a>
		<a class="dh-link dh-side dh-side--left dh-transition" data-dh-dir="left" href="<?php echo esc_url( $link( $s['aboutUrl'] ) ); ?>"<?php echo $hide( '' !== $s['aboutText'] ); ?>>
			<span class="dh-arrow" aria-hidden="true">&larr;</span><span class="dh-about-text"><?php echo esc_html( $s['aboutText'] ); ?></span>
		</a>
		<a class="dh-link dh-side dh-side--right dh-transition" data-dh-dir="right" href="<?php echo esc_url( $link( $s['workUrl'] ) ); ?>"<?php echo $hide( '' !== $s['workText'] ); ?>>
			<span class="dh-work-text"><?php echo esc_html( $s['workText'] ); ?></span><span class="dh-arrow" aria-hidden="true">&rarr;</span>
		</a>
		<div class="dh-main">
			<div class="dh-card">
				<span class="dh-br dh-br--tl" aria-hidden="true"<?php echo $hide( $s['brackets'] ); ?>></span>
				<span class="dh-br dh-br--tr" aria-hidden="true"<?php echo $hide( $s['brackets'] ); ?>></span>
				<span class="dh-br dh-br--bl" aria-hidden="true"<?php echo $hide( $s['brackets'] ); ?>></span>
				<span class="dh-br dh-br--br" aria-hidden="true"<?php echo $hide( $s['brackets'] ); ?>></span>
				<<?php echo tag_escape( $tag ); ?> class="dh-heading"><?php echo esc_html( $s['heading'] ); ?></<?php echo tag_escape( $tag ); ?>>
				<p class="dh-sub"<?php echo $hide( '' !== $s['subheading'] ); ?>><?php echo esc_html( $s['subheading'] ); ?></p>
				<a class="dh-btn dh-transition" data-dh-dir="right" href="<?php echo esc_url( $link( $s['buttonUrl'] ) ); ?>"<?php echo $hide( '' !== $s['buttonText'] ); ?>>
					<span class="dh-btn-text"><?php echo esc_html( $s['buttonText'] ); ?></span><span class="dh-arrow" aria-hidden="true">&rarr;</span>
				</a>
				<nav class="dh-mnav" aria-label="<?php esc_attr_e( 'Hero navigation', 'kaleidoscope-hero' ); ?>">
					<a class="dh-link dh-transition" data-dh-dir="left" href="<?php echo esc_url( $link( $s['aboutUrl'] ) ); ?>"<?php echo $hide( '' !== $s['aboutText'] ); ?>><span class="dh-arrow" aria-hidden="true">&larr;</span><span class="dh-about-text"><?php echo esc_html( $s['aboutText'] ); ?></span></a>
					<a class="dh-link dh-transition" data-dh-dir="right" href="<?php echo esc_url( $link( $s['workUrl'] ) ); ?>"<?php echo $hide( '' !== $s['workText'] ); ?>><span class="dh-work-text"><?php echo esc_html( $s['workText'] ); ?></span><span class="dh-arrow" aria-hidden="true">&rarr;</span></a>
				</nav>
			</div>
		</div>
	</div>
	<?php endif; ?>
</div>
	<?php
	return ob_get_clean();
}

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

require_once __DIR__ . '/includes/templates.php';
require_once __DIR__ . '/includes/models.php';

function dh_admin_url( $args = array() ) {
	return add_query_arg( array_merge( array( 'page' => 'kaleidoscope-hero' ), $args ), admin_url( 'admin.php' ) );
}

function dh_admin_menu() {
	add_menu_page( 'Kaleidoscope Hero', 'Kaleidoscope Hero', 'manage_options', 'kaleidoscope-hero', 'dh_admin_page', 'dashicons-art', 61 );
}
add_action( 'admin_menu', 'dh_admin_menu' );

function dh_admin_assets( $hook ) {
	if ( 'toplevel_page_kaleidoscope-hero' !== $hook || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	wp_enqueue_style( 'wp-color-picker' );
	wp_enqueue_media();
	wp_enqueue_style( 'kaleidoscope-hero' );
	if ( dh_get_global()['fonts'] ) {
		wp_enqueue_style( 'dh-fonts' );
	}
	wp_enqueue_style( 'dh-admin', DH_URL . 'assets/dh-admin.css', array(), DH_VERSION );
	wp_enqueue_script( 'dh-scenes' );
	wp_enqueue_script( 'dh-admin', DH_URL . 'assets/dh-admin.js', array( 'jquery', 'wp-color-picker', 'dh-scenes' ), DH_VERSION, true );
	wp_localize_script( 'dh-admin', 'DH_EDITOR', array( 'on' => __( 'On', 'kaleidoscope-hero' ), 'off' => __( 'Off', 'kaleidoscope-hero' ), 'mirrors' => __( '%s mirrors', 'kaleidoscope-hero' ), 'dirty' => __( 'Unsaved changes', 'kaleidoscope-hero' ), 'clean' => __( 'No unsaved changes', 'kaleidoscope-hero' ), 'still' => __( 'Still background', 'kaleidoscope-hero' ) ) );
	wp_localize_script( 'dh-admin', 'DH_MODELS', array( 'ajaxUrl' => admin_url( 'admin-ajax.php' ), 'nonce' => wp_create_nonce( 'dh_models' ), 'upload' => __( 'Upload GLB', 'kaleidoscope-hero' ), 'choose' => __( 'Choose a 3D model', 'kaleidoscope-hero' ), 'use' => __( 'Use this model', 'kaleidoscope-hero' ), 'loading' => __( 'Uploading model…', 'kaleidoscope-hero' ), 'uploaded' => __( 'Model uploaded. Preview it, then save your preset.', 'kaleidoscope-hero' ), 'error' => __( 'The model could not be uploaded. Refresh and try again.', 'kaleidoscope-hero' ), 'svgSize' => __( 'Choose a .svg file smaller than 512 KB.', 'kaleidoscope-hero' ), 'size' => __( 'Choose a .glb file smaller than 10 MB.', 'kaleidoscope-hero' ) ) );
	wp_enqueue_script( 'dh-model-admin', DH_URL . 'assets/dh-model-admin.js', array( 'jquery', 'dh-admin', 'media-editor' ), DH_VERSION, true );
	wp_enqueue_script( 'dh-templates', DH_URL . 'assets/dh-templates.js', array( 'jquery', 'dh-admin' ), DH_VERSION, true );
	wp_localize_script( 'dh-templates', 'DH_TEMPLATES', array( 'ajaxUrl' => admin_url( 'admin-ajax.php' ), 'nonce' => wp_create_nonce( 'dh_templates' ), 'templates' => array_values( dh_get_templates() ), 'messages' => array( 'choose' => __( 'Choose a template first.', 'kaleidoscope-hero' ), 'name' => __( 'Give the template a name.', 'kaleidoscope-hero' ), 'error' => __( 'The template could not be saved. Refresh and try again.', 'kaleidoscope-hero' ), 'applied' => __( 'Template applied to the preview. Review, then Save preset to keep it.', 'kaleidoscope-hero' ), 'undone' => __( 'Previous settings restored. Preset changes are still unsaved.', 'kaleidoscope-hero' ), 'delete' => __( 'Delete this template from the library? Presets that used it will stay unchanged.', 'kaleidoscope-hero' ), 'look' => __( 'Look only', 'kaleidoscope-hero' ), 'full' => __( 'Full settings', 'kaleidoscope-hero' ) ) ) );
}
add_action( 'admin_enqueue_scripts', 'dh_admin_assets' );

function dh_field( $k, $f, $v ) {
	$name = 'dh[' . $k . ']';
	$id   = 'dh-' . $k;
	echo '<div class="dh-field dh-field--' . esc_attr( $f['type'] ) . '">';
	echo '<label for="' . esc_attr( $id ) . '">' . esc_html( $f['label'] ) . '</label>';
	echo '<div class="dh-control">';
	switch ( $f['type'] ) {
		case 'range':
			printf(
				'<div class="dh-range"><input type="range" min="%1$s" max="%2$s" step="%3$s" value="%4$s" aria-hidden="true" tabindex="-1"><input type="number" id="%5$s" name="%6$s" min="%1$s" max="%2$s" step="%3$s" value="%4$s"></div>',
				esc_attr( $f['min'] ), esc_attr( $f['max'] ), esc_attr( $f['step'] ), esc_attr( $v ), esc_attr( $id ), esc_attr( $name )
			);
			break;
		case 'enum':
			echo '<select id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '">';
			$groups = isset( $f['option_groups'] ) ? $f['option_groups'] : array( '' => $f['options'] );
			foreach ( $groups as $group => $options ) {
				if ( '' !== $group ) {
					echo '<optgroup label="' . esc_attr( $group ) . '">';
				}
				foreach ( $options as $o ) {
					$label = isset( $f['option_labels'][ $o ] ) ? $f['option_labels'][ $o ] : $o;
					echo '<option value="' . esc_attr( $o ) . '"' . selected( $v, $o, false ) . '>' . esc_html( $label ) . '</option>';
				}
				if ( '' !== $group ) {
					echo '</optgroup>';
				}
			}
			echo '</select>';
			break;
		case 'bool':
			echo '<input type="hidden" name="' . esc_attr( $name ) . '" value="0">';
			echo '<label class="dh-toggle"><input type="checkbox" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" value="1"' . checked( $v, true, false ) . '> <span>' . esc_html__( 'On', 'kaleidoscope-hero' ) . '</span></label>';
			break;
		case 'color':
			echo '<input type="text" class="dh-color" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $v ) . '" data-default-color="' . esc_attr( $f['default'] ) . '">';
			break;
		case 'textarea':
			echo '<textarea id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" rows="2">' . esc_textarea( $v ) . '</textarea>';
			break;
		case 'url':
			echo '<input type="url" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $v ) . '" placeholder="https://">';
			break;
		case 'model':
			echo '<input type="url" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $v ) . '" placeholder="' . esc_attr__( 'Included crystal, or paste a GLB URL', 'kaleidoscope-hero' ) . '">';
			echo '<div class="dh-model-actions"><button type="button" class="button" id="dh-model-upload">' . esc_html__( 'Upload GLB', 'kaleidoscope-hero' ) . '</button> <button type="button" class="button" id="dh-model-library">' . esc_html__( 'Media library', 'kaleidoscope-hero' ) . '</button> <button type="button" class="button" id="dh-model-clear">' . esc_html__( 'Use sample crystal', 'kaleidoscope-hero' ) . '</button><input type="file" id="dh-model-file" accept=".glb,model/gltf-binary" hidden></div><p id="dh-model-upload-status" role="status" aria-live="polite"></p>';
			break;
		case 'svgmodel':
			echo '<input type="url" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $v ) . '" placeholder="' . esc_attr__( 'Included badge, or paste an SVG source URL', 'kaleidoscope-hero' ) . '">';
			echo '<div class="dh-model-actions"><button type="button" class="button" id="dh-svg-upload">' . esc_html__( 'Upload SVG', 'kaleidoscope-hero' ) . '</button> <button type="button" class="button" id="dh-svg-library">' . esc_html__( 'Media library', 'kaleidoscope-hero' ) . '</button> <button type="button" class="button" id="dh-svg-clear">' . esc_html__( 'Use sample badge', 'kaleidoscope-hero' ) . '</button><input type="file" id="dh-svg-file" accept=".svg,image/svg+xml" hidden></div><p id="dh-svg-upload-status" role="status" aria-live="polite"></p>';
			break;
		default:
			echo '<input type="text" id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $v ) . '">';
	}
	if ( ! empty( $f['help'] ) ) {
		echo '<p class="description">' . esc_html( $f['help'] ) . '</p>';
	}
	echo '</div></div>';
}

function dh_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$presets = dh_get_presets();
	$g       = dh_get_global();
	$tab     = isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : 'presets'; // phpcs:ignore WordPress.Security.NonceVerification
	$is_new  = ! empty( $_GET['new'] ); // phpcs:ignore WordPress.Security.NonceVerification
	$edit    = isset( $_GET['edit'] ) ? sanitize_title( wp_unslash( $_GET['edit'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	if ( ! $is_new && ! isset( $presets[ $edit ] ) ) {
		$edit = (string) key( $presets );
	}
	$current = $is_new ? array( 'name' => '', 'settings' => dh_defaults() ) : $presets[ $edit ];
	$notice  = isset( $_GET['dh_notice'] ) ? sanitize_key( wp_unslash( $_GET['dh_notice'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	$notices = array( 'saved' => 'Preset saved.', 'deleted' => 'Preset deleted.', 'duplicated' => 'Preset duplicated.', 'global' => 'Settings saved.', 'last' => 'You need at least one preset.', 'templates_imported' => __( 'Templates imported. Existing templates and presets were preserved.', 'kaleidoscope-hero' ), 'template_deleted' => __( 'Template deleted. Existing presets were preserved.', 'kaleidoscope-hero' ) );
	?>
	<div class="wrap dh-admin">
		<h1>Kaleidoscope Hero</h1>
		<?php if ( isset( $notices[ $notice ] ) ) : ?>
			<div class="notice <?php echo 'last' === $notice ? 'notice-warning' : 'notice-success'; ?> is-dismissible"><p><?php echo esc_html( $notices[ $notice ] ); ?></p></div>
		<?php endif; ?>
		<nav class="nav-tab-wrapper">
			<a href="<?php echo esc_url( dh_admin_url() ); ?>" class="nav-tab<?php echo 'presets' === $tab ? ' nav-tab-active' : ''; ?>">Presets</a>
			<a href="<?php echo esc_url( dh_admin_url( array( 'tab' => 'templates' ) ) ); ?>" class="nav-tab<?php echo 'templates' === $tab ? ' nav-tab-active' : ''; ?>">Templates</a>
			<a href="<?php echo esc_url( dh_admin_url( array( 'tab' => 'global' ) ) ); ?>" class="nav-tab<?php echo 'global' === $tab ? ' nav-tab-active' : ''; ?>">Transitions &amp; performance</a>
			<a href="<?php echo esc_url( dh_admin_url( array( 'tab' => 'help' ) ) ); ?>" class="nav-tab<?php echo 'help' === $tab ? ' nav-tab-active' : ''; ?>">How to use</a>
		</nav>
		<?php
		if ( 'templates' === $tab ) {
			dh_admin_templates();
		} elseif ( 'global' === $tab ) {
			dh_admin_global( $g );
		} elseif ( 'help' === $tab ) {
			dh_admin_help();
		} else {
			dh_admin_presets( $presets, $edit, $is_new, $current );
		}
		?>
	</div>
	<?php
}

function dh_admin_presets( $presets, $edit, $is_new, $current ) {
	require_once __DIR__ . '/includes/admin-editor.php';
	dh_admin_editor( $presets, $edit, $is_new, $current );
}
function dh_admin_global( $g ) {
	?>
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" class="dh-form dh-form--narrow dh-form--savebar">
		<?php wp_nonce_field( 'dh_save_global' ); ?>
		<input type="hidden" name="action" value="dh_save_global">
		<div class="dh-panel">
			<h2>Page transitions</h2>
			<div class="dh-field"><label for="dh-tr">Black wipe on</label><div class="dh-control">
				<select id="dh-tr" name="g[transitions]">
					<option value="marked"<?php selected( $g['transitions'], 'marked' ); ?>>Hero links + links with the class dh-transition</option>
					<option value="all"<?php selected( $g['transitions'], 'all' ); ?>>All internal links</option>
					<option value="off"<?php selected( $g['transitions'], 'off' ); ?>>Off</option>
				</select>
				<p class="description">Add <code>data-dh-dir="left"</code> to a link to make the wipe come from the left.</p>
			</div></div>
			<div class="dh-field"><label for="dh-rv">On the next page, the wipe</label><div class="dh-control">
				<select id="dh-rv" name="g[reveal]">
					<option value="fade"<?php selected( $g['reveal'], 'fade' ); ?>>Fades away to reveal the page</option>
					<option value="continue"<?php selected( $g['reveal'], 'continue' ); ?>>Continues across and exits the opposite side</option>
					<option value="reverse"<?php selected( $g['reveal'], 'reverse' ); ?>>Slides back out the way it came</option>
				</select>
			</div></div>
			<div class="dh-field"><label for="dh-wc">Wipe colour</label><div class="dh-control"><input type="text" class="dh-color" id="dh-wc" name="g[wipe_color]" value="<?php echo esc_attr( $g['wipe_color'] ); ?>" data-default-color="#000000"></div></div>
		</div>
		<div class="dh-panel">
			<h2>Performance</h2>
			<div class="dh-field"><label for="dh-q">Render quality</label><div class="dh-control">
				<select id="dh-q" name="g[quality]">
					<option value="low"<?php selected( $g['quality'], 'low' ); ?>>Low (fastest)</option>
					<option value="medium"<?php selected( $g['quality'], 'medium' ); ?>>Medium (recommended)</option>
					<option value="high"<?php selected( $g['quality'], 'high' ); ?>>High (sharpest)</option>
				</select>
				<p class="description">Phones automatically render a little lower. The animation pauses when it is off screen or the tab is hidden.</p>
			</div></div>
				<div class="dh-field"><label for="dh-f">Load hero fonts</label><div class="dh-control"><input type="hidden" name="g[fonts]" value="0"><label class="dh-toggle"><input type="checkbox" id="dh-f" name="g[fonts]" value="1"<?php checked( $g['fonts'] ); ?>> <span>Bricolage Grotesque + Hanken Grotesk (served locally)</span></label></div></div>
		</div>
		<p class="submit dh-savebar"><button type="submit" class="button button-primary">Save settings</button></p>
	</form>
	<?php
}

function dh_admin_help() {
	?>
	<div class="dh-panel dh-help">
		<h2><?php esc_html_e( 'Save and reuse templates', 'kaleidoscope-hero' ); ?></h2>
		<p><?php esc_html_e( 'In a preset, open Apply or save a template → Save as template to capture the current controls, including unsaved changes. Look only preserves destination content and layout; Full settings includes them. Apply a template to the preview, use Undo apply if needed, then Save preset. The Templates tab exports and imports JSON files for other websites with Kaleidoscope Hero installed.', 'kaleidoscope-hero' ); ?></p>
		<h2><?php esc_html_e( 'A background behind your own content', 'kaleidoscope-hero' ); ?></h2>
		<ol>
			<li><?php esc_html_e( 'In the WordPress editor, add a Kaleidoscope Section block.', 'kaleidoscope-hero' ); ?></li>
			<li><?php esc_html_e( 'Choose an animation preset and background darkness in the block settings.', 'kaleidoscope-hero' ); ?></li>
			<li><?php esc_html_e( 'Add headings, columns, images, buttons, forms, and other blocks inside it. The background grows with the content.', 'kaleidoscope-hero' ); ?></li>
		</ol>
		<p><?php esc_html_e( 'The editor shows a still preview to save resources. View the page to see the animation.', 'kaleidoscope-hero' ); ?></p>
		<p><?php esc_html_e( 'For an existing Group block or page-builder section, place the following shortcode inside that container alongside your content:', 'kaleidoscope-hero' ); ?> <code>[kaleidoscope_hero preset="home" mode="background" darkness="0.35"]</code></p>
		<p><?php esc_html_e( 'WordPress Groups, GenerateBlocks containers, Avada full-width containers, and HTML sections are detected automatically. For another container type, give it the CSS class dh-section. No custom CSS is needed.', 'kaleidoscope-hero' ); ?></p>
		<p><?php esc_html_e( 'For HTML or nested shortcodes, enclose the content:', 'kaleidoscope-hero' ); ?> <code>[kaleidoscope_hero preset="home" mode="background"]Your content[/kaleidoscope_hero]</code></p>
		<h2>Shortcodes</h2>
		<p><code>[kaleidoscope_hero preset="home"]</code> shows one preset.</p>
		<p><code>[kaleidoscope_hero presets="home,ocean,rings" interval="20"]</code> plays a slideshow, fading between presets every 20 seconds.</p>
		<p><code>[kaleidoscope_hero preset="work" height="60vh" opacity="0.5" overlay="no"]</code> overrides any setting for that page only. Setting names: <code>style, palette, opacity, density, flow, glow, brightness, multicolor, kaleidoscope, tessellation, tessellationdensity, tessellationzoom, tessellationrotation, ribboncount, ribbonwidth, ribbonfold, ribbontwist, ribbontransparency, ribboniridescence, ribbonedge, ribbonbend, ribbonradius, ribbonscroll, ribbonscrollstrength, ribbonscrolldistance, randomize, randominterval, bgcolor1, bgcolor2, gradient, gradientangle, lookrange, warp, bloom, blendmode, blendsource, blendcolor, blendamount, vortex, vortexramp, overlay, headingtag, heading, subheading, buttontext, buttonurl, abouttext, abouturl, worktext, workurl, moretext, moreurl, brackets, height</code>.</p>
		<p><?php esc_html_e( 'Kaleidoscope mode supports Forward elements, Whole screen, or Both. Automatic vortex starts the full-animation twist on load, with strength, speed, direction and startup controls under Interaction.', 'kaleidoscope-hero' ); ?></p>
		<p><code>[kaleidoscope_hero preset="home" kaleidoscope="6" kaleidoscopemode="Whole screen" autovortex="true" autovortexstrength="0.5" autovortexspeed="0.6" autovortexdirection="Clockwise" autovortexramp="2"]</code></p>
		<p><?php esc_html_e( 'LED globe offers Cycle, Fireworks, Waves and Shapes under LED globe pattern. Digital disco ball casts moving mirror-tile light onto the surrounding wall. Density adjusts the LED or tile spacing; Flow speed animates the show.', 'kaleidoscope-hero' ); ?></p>
		<p><code>[kaleidoscope_hero preset="home" style="LED globe" ledpattern="Fireworks" kaleidoscope="0"]</code></p>
		<p><code>[kaleidoscope_hero preset="work"]Your own HTML or shortcodes[/kaleidoscope_hero]</code> replaces the built-in text with your own content, centred over the animation.</p>
		<h2>Transitions</h2>
		<p>The hero's links use the black wipe automatically. To add it to any other link, give it the class <code>dh-transition</code> (in Avada: the element's CSS Class field). Use <code>data-dh-dir="left"</code> for a wipe from the left. Add <code>data-dh-no-transition</code> to opt a link out.</p>
		<p>Your theme must call <code>wp_body_open()</code> (Avada and GeneratePress do) so the cover is in place before the next page paints.</p>
		<h2>Tips</h2>
		<ul>
			<li>Put the shortcode in a full-width container with no padding so the hero runs edge to edge.</li>
			<li>Use a 100% width "Code Block" or "Text" element in Avada Builder, or a Shortcode block in the WordPress editor.</li>
			<li>Very light background colours wash out the glow; darker colours work best.</li>
		</ul>
	</div>
	<?php
}

function dh_redirect( $args ) {
	wp_safe_redirect( dh_admin_url( $args ) );
	exit;
}

function dh_handle_save_preset() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'kaleidoscope-hero' ) );
	}
	check_admin_referer( 'dh_save_preset' );
	$presets = dh_get_presets();
	$old     = isset( $_POST['dh_slug'] ) ? sanitize_title( wp_unslash( $_POST['dh_slug'] ) ) : '';
	$name    = isset( $_POST['dh_name'] ) ? sanitize_text_field( wp_unslash( $_POST['dh_name'] ) ) : '';
	$name    = '' !== $name ? $name : 'Preset';
	$want    = isset( $_POST['dh_new_slug'] ) ? sanitize_title( wp_unslash( $_POST['dh_new_slug'] ) ) : '';
	$new     = '' !== $want ? $want : ( $old ? $old : sanitize_title( $name ) );
	$new     = '' !== $new ? $new : 'preset';
	if ( $new !== $old && isset( $presets[ $new ] ) ) {
		$i = 2;
		while ( isset( $presets[ $new . '-' . $i ] ) ) {
			$i++;
		}
		$new = $new . '-' . $i;
	}
	$in       = isset( $_POST['dh'] ) && is_array( $_POST['dh'] ) ? wp_unslash( $_POST['dh'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	$settings = dh_sanitize_settings( $in, dh_defaults() );
	if ( $old && $old !== $new ) {
		unset( $presets[ $old ] );
	}
	$presets[ $new ] = array( 'name' => $name, 'settings' => $settings );
	update_option( 'dh_presets', $presets, false );
	dh_redirect( array( 'edit' => $new, 'dh_notice' => 'saved' ) );
}
add_action( 'admin_post_dh_save_preset', 'dh_handle_save_preset' );

function dh_handle_delete_preset() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'kaleidoscope-hero' ) );
	}
	check_admin_referer( 'dh_delete_preset' );
	$presets = dh_get_presets();
	$slug    = isset( $_POST['dh_slug'] ) ? sanitize_title( wp_unslash( $_POST['dh_slug'] ) ) : '';
	if ( count( $presets ) < 2 ) {
		dh_redirect( array( 'edit' => $slug, 'dh_notice' => 'last' ) );
	}
	unset( $presets[ $slug ] );
	update_option( 'dh_presets', $presets, false );
	dh_redirect( array( 'dh_notice' => 'deleted' ) );
}
add_action( 'admin_post_dh_delete_preset', 'dh_handle_delete_preset' );

function dh_handle_duplicate_preset() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'kaleidoscope-hero' ) );
	}
	check_admin_referer( 'dh_duplicate_preset' );
	$presets = dh_get_presets();
	$slug    = isset( $_POST['dh_slug'] ) ? sanitize_title( wp_unslash( $_POST['dh_slug'] ) ) : '';
	if ( ! isset( $presets[ $slug ] ) ) {
		dh_redirect( array() );
	}
	$i = 2;
	while ( isset( $presets[ $slug . '-' . $i ] ) ) {
		$i++;
	}
	$new             = $slug . '-' . $i;
	$presets[ $new ] = array( 'name' => $presets[ $slug ]['name'] . ' copy', 'settings' => $presets[ $slug ]['settings'] );
	update_option( 'dh_presets', $presets, false );
	dh_redirect( array( 'edit' => $new, 'dh_notice' => 'duplicated' ) );
}
add_action( 'admin_post_dh_duplicate_preset', 'dh_handle_duplicate_preset' );

function dh_handle_save_global() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'kaleidoscope-hero' ) );
	}
	check_admin_referer( 'dh_save_global' );
	$in = isset( $_POST['g'] ) && is_array( $_POST['g'] ) ? wp_unslash( $_POST['g'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	$c  = isset( $in['wipe_color'] ) ? sanitize_hex_color( $in['wipe_color'] ) : '';
	update_option(
		'dh_global',
		array(
			'transitions' => isset( $in['transitions'] ) && in_array( $in['transitions'], array( 'marked', 'all', 'off' ), true ) ? $in['transitions'] : 'marked',
			'reveal'      => isset( $in['reveal'] ) && in_array( $in['reveal'], array( 'fade', 'continue', 'reverse' ), true ) ? $in['reveal'] : 'fade',
			'wipe_color'  => $c ? $c : '#000000',
			'quality'     => isset( $in['quality'] ) && in_array( $in['quality'], array( 'low', 'medium', 'high' ), true ) ? $in['quality'] : 'medium',
			'fonts'       => ! empty( $in['fonts'] ),
		)
	);
	dh_redirect( array( 'tab' => 'global', 'dh_notice' => 'global' ) );
}
add_action( 'admin_post_dh_save_global', 'dh_handle_save_global' );

function dh_action_links( $links ) {
	array_unshift( $links, '<a href="' . esc_url( dh_admin_url() ) . '">' . esc_html__( 'Settings', 'kaleidoscope-hero' ) . '</a>' );
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'dh_action_links' );

/* Native section block: the animation is decorative; InnerBlocks own the content. */
function dh_register_section_block() {
	$assets = plugin_dir_path( __FILE__ ) . 'assets/';
	$motion_file = 'dh-section-motion' . ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min' ) . '.js';
	wp_register_script( 'dh-section-motion', DH_URL . 'assets/' . $motion_file, array(), (string) filemtime( $assets . $motion_file ), true );
	wp_script_add_data( 'dh-section-motion', 'strategy', 'defer' );
	wp_register_script( 'dh-section-editor', DH_URL . 'assets/dh-section-editor.js', array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ), (string) filemtime( $assets . 'dh-section-editor.js' ), true );
	wp_register_style( 'dh-section-editor', DH_URL . 'assets/dh-section-editor.css', array(), (string) filemtime( $assets . 'dh-section-editor.css' ) );
	$choices = array();
	foreach ( dh_get_presets() as $slug => $preset ) {
		$choices[] = array( 'value' => (string) $slug, 'label' => $preset['name'], 'bg1' => $preset['settings']['bgColor1'], 'bg2' => $preset['settings']['bgColor2'] );
	}
	wp_add_inline_script( 'dh-section-editor', 'window.DH_SECTION_EDITOR=' . wp_json_encode( array( 'presets' => $choices ) ) . ';', 'before' );
	register_block_type( 'kaleidoscope-hero/section', array(
		'api_version' => 3,
		'title' => __( 'Kaleidoscope Section', 'kaleidoscope-hero' ),
		'description' => __( 'An animated background behind your own content.', 'kaleidoscope-hero' ),
		'category' => 'design',
		'icon' => 'format-gallery',
		'editor_script' => 'dh-section-editor',
		'editor_style' => 'dh-section-editor',
		'style' => 'kaleidoscope-hero',
		'attributes' => array(
			'preset' => array( 'type' => 'string', 'default' => 'home' ),
			'darkness' => array( 'type' => 'number', 'default' => 0.35 ),
			'htmlAttributes' => array( 'type' => 'array', 'default' => array(), 'items' => array( 'type' => 'object' ) ),
			'stickyPosition' => array( 'type' => 'string', 'default' => 'off', 'enum' => array( 'off', 'top', 'bottom' ) ),
			'stickyOffset' => array( 'type' => 'number', 'default' => 0 ),
			'stickyZIndex' => array( 'type' => 'number', 'default' => 1 ),
			'scrollDirection' => array( 'type' => 'string', 'default' => 'none', 'enum' => array( 'none', 'up', 'down', 'left', 'right' ) ),
			'scrollDistance' => array( 'type' => 'number', 'default' => 100 ),
			'scrollTarget' => array( 'type' => 'string', 'default' => 'background', 'enum' => array( 'background', 'section' ) ),
		),
		'supports' => array( 'align' => array( 'wide', 'full' ), 'anchor' => true, 'html' => false, 'spacing' => array( 'padding' => true, 'margin' => true ), 'color' => array( 'text' => true, 'background' => false ) ),
		'render_callback' => 'dh_render_section_block',
	) );
}
add_action( 'init', 'dh_register_section_block', 20 );

function dh_render_section_block( $attributes, $content ) {
	$preset = isset( $attributes['preset'] ) ? sanitize_title( $attributes['preset'] ) : 'home';
	$darkness = isset( $attributes['darkness'] ) && is_numeric( $attributes['darkness'] ) ? max( 0, min( 0.9, (float) $attributes['darkness'] ) ) : 0.35;
	$background = dh_shortcode( array( 'preset' => $preset, 'mode' => 'background', 'darkness' => $darkness ) );
	$extra = dh_section_html_attributes( isset( $attributes['htmlAttributes'] ) ? $attributes['htmlAttributes'] : array() );
	$extra['class'] = 'dh-section' . ( isset( $extra['class'] ) && '' !== $extra['class'] ? ' ' . $extra['class'] : '' );
	$sticky = isset( $attributes['stickyPosition'] ) && in_array( $attributes['stickyPosition'], array( 'top', 'bottom' ), true ) ? $attributes['stickyPosition'] : 'off';
	$direction = isset( $attributes['scrollDirection'] ) && in_array( $attributes['scrollDirection'], array( 'up', 'down', 'left', 'right' ), true ) ? $attributes['scrollDirection'] : 'none';
	$distance = dh_section_number( $attributes, 'scrollDistance', 100, 0, 400 );
	$style = isset( $extra['style'] ) ? rtrim( $extra['style'], ';' ) . ';' : '';
	if ( 'off' !== $sticky ) {
		$extra['data-dh-sticky'] = $sticky;
		$style .= '--dh-sticky-offset:' . dh_section_number( $attributes, 'stickyOffset', 0, 0, 300 ) . 'px;--dh-sticky-layer:' . dh_section_number( $attributes, 'stickyZIndex', 1, 0, 100 ) . ';';
	}
	if ( 'none' !== $direction && $distance > 0 ) {
		$extra['data-dh-scroll'] = $direction;
		$extra['data-dh-scroll-distance'] = (string) $distance;
		$extra['data-dh-scroll-target'] = isset( $attributes['scrollTarget'] ) && 'section' === $attributes['scrollTarget'] ? 'section' : 'background';
		wp_enqueue_script( 'dh-section-motion' );
	}
	if ( '' !== $style ) $extra['style'] = $style;
	return '<section ' . get_block_wrapper_attributes( $extra ) . '>' . $background . '<div class="dh-section-content">' . $content . '</div></section>';
}

/** Bound numeric presentation settings, including values from imported blocks. */
function dh_section_number( $attributes, $key, $default, $min, $max ) {
	return isset( $attributes[ $key ] ) && is_numeric( $attributes[ $key ] ) ? max( $min, min( $max, (float) $attributes[ $key ] ) ) : $default;
}

/** Validate section attributes against WordPress's normal post HTML rules. */
function dh_section_html_attributes( $rows ) {
	$out = array();
	if ( ! is_array( $rows ) ) return $out;
	$allowed = wp_kses_allowed_html( 'post' );
	foreach ( $rows as $row ) {
		if ( ! is_array( $row ) || ! isset( $row['name'], $row['value'] ) || ! is_string( $row['name'] ) || ! is_scalar( $row['value'] ) ) continue;
		$name = strtolower( trim( $row['name'] ) );
		if ( ! preg_match( '/^[a-z][a-z0-9_-]*$/D', $name ) || 0 === strpos( $name, 'on' ) || 'srcdoc' === $name ) continue;
		$value = (string) $row['value'];
		if ( 'id' === $name ) {
			$value = preg_replace( '/\s+/', '-', trim( $value ) );
			if ( '' === $value ) continue;
		}
		$value = esc_attr( $value );
		$whole = $name . '="' . $value . '"';
		if ( wp_kses_attr_check( $name, $value, $whole, false, 'section', $allowed ) ) {
			$out[ $name ] = wp_specialchars_decode( $value, ENT_QUOTES );
		}
	}
	return $out;
}
