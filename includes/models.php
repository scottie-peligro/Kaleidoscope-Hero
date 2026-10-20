<?php
/** Self-contained GLB uploads, restricted to plugin administrators. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function dh_validate_model_file( $path ) {
	$size = is_file( $path ) ? filesize( $path ) : 0;
	if ( $size < 20 || $size > 10 * MB_IN_BYTES ) { return new WP_Error( 'model_size', __( 'Choose a GLB file smaller than 10 MB.', 'kaleidoscope-hero' ) ); }
	$stream = fopen( $path, 'rb' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	if ( ! $stream ) { return new WP_Error( 'model_read', __( 'The model could not be read.', 'kaleidoscope-hero' ) ); }
	$head = unpack( 'Vmagic/Vversion/Vlength/Vjson_length/Vjson_type', fread( $stream, 20 ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	if ( 0x46546c67 !== $head['magic'] || 2 !== $head['version'] || $size !== $head['length'] || 0x4e4f534a !== $head['json_type'] || $head['json_length'] > MB_IN_BYTES || $head['json_length'] < 2 || $head['json_length'] > $size - 20 ) { fclose( $stream ); return new WP_Error( 'model_format', __( 'This is not a valid glTF 2.0 GLB file.', 'kaleidoscope-hero' ) ); }
	$data = json_decode( fread( $stream, $head['json_length'] ), true, 64 ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	fclose( $stream );
	if ( ! is_array( $data ) || '2.0' !== ( $data['asset']['version'] ?? '' ) || empty( $data['meshes'] ) ) { return new WP_Error( 'model_data', __( 'The GLB needs a glTF 2.0 mesh.', 'kaleidoscope-hero' ) ); }
	foreach ( array_merge( (array) ( $data['buffers'] ?? array() ), (array) ( $data['images'] ?? array() ) ) as $resource ) {
		if ( ! is_array( $resource ) || ( isset( $resource['uri'] ) && ( ! is_string( $resource['uri'] ) || ! preg_match( '#^data:(application/octet-stream|application/gltf-buffer|image/(png|jpeg|webp));base64,#', $resource['uri'] ) ) ) ) { return new WP_Error( 'model_external', __( 'Export a self-contained GLB with embedded buffers and textures.', 'kaleidoscope-hero' ) ); }
	}
	foreach ( (array) ( $data['images'] ?? array() ) as $image ) {
		if ( isset( $image['mimeType'] ) && ! in_array( $image['mimeType'], array( 'image/png', 'image/jpeg', 'image/webp' ), true ) ) { return new WP_Error( 'model_texture', __( 'Export textures as PNG, JPEG or WebP.', 'kaleidoscope-hero' ) ); }
	}
	return true;
}

/** Applied only during the already-authorized, validated GLB upload. */
function dh_model_upload_filetype( $data, $file, $filename, $mimes ) {
	if ( 'glb' === strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) ) && 'model/gltf-binary' === ( $mimes['glb'] ?? '' ) && true === dh_validate_model_file( $file ) ) {
		return array( 'ext' => 'glb', 'type' => 'model/gltf-binary', 'proper_filename' => false );
	}
	return $data;
}

function dh_svg_declarations( $text ) {
	$allowed = array( 'fill', 'fill-rule', 'fill-opacity', 'opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'display', 'visibility', 'color', 'stop-color', 'stop-opacity' );
	$out = array();
	foreach ( explode( ';', $text ) as $item ) {
		$pair = explode( ':', $item, 2 );
		if ( 2 === count( $pair ) && in_array( trim( $pair[0] ), $allowed, true ) && dh_svg_safe_value( trim( $pair[1] ) ) ) { $out[] = trim( $pair[0] ) . ':' . trim( $pair[1] ); }
	}
	return implode( ';', $out );
}

function dh_svg_safe_value( $value ) {
	return ! preg_match( '/[<>\\\\]|@|expression|javascript:|data:|https?:/i', $value ) && ! preg_match( '/url\s*\(/i', preg_replace( '/url\(\s*[\'"]?#[\w.-]+[\'"]?\s*\)/i', '', $value ) );
}

function dh_svg_json_mime( $mimes ) { $mimes['json'] = 'application/json'; return $mimes; }

/** Store vector instructions as inert JSON, never a publicly executable SVG. */
function dh_clean_svg( $text ) {
	if ( ! is_string( $text ) || strlen( $text ) > 512 * KB_IN_BYTES || preg_match( '/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i', $text ) || ! class_exists( 'DOMDocument' ) ) { return new WP_Error( 'svg_size', __( 'Choose a simple SVG smaller than 512 KB.', 'kaleidoscope-hero' ) ); }
	$old = libxml_use_internal_errors( true ); $doc = new DOMDocument(); $valid = $doc->loadXML( $text, LIBXML_NONET ); libxml_clear_errors(); libxml_use_internal_errors( $old );
	if ( ! $valid || $doc->doctype || ! $doc->documentElement || 'svg' !== $doc->documentElement->localName ) { return new WP_Error( 'svg_format', __( 'This is not a valid SVG.', 'kaleidoscope-hero' ) ); }
	$tags = array( 'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'defs', 'linearGradient', 'radialGradient', 'stop', 'style' );
	$attributes = array( 'id', 'class', 'viewBox', 'width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'transform', 'fill', 'fill-rule', 'fill-opacity', 'opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'display', 'visibility', 'color', 'style', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'fx', 'fy', 'href' );
	$clean = new DOMDocument(); $count = 0;
	$copy = function( $node, $parent = null ) use ( &$copy, &$count, $clean, $tags, $attributes ) {
		if ( XML_ELEMENT_NODE !== $node->nodeType || in_array( $node->localName, array( 'title', 'desc', 'metadata', 'namedview' ), true ) ) { return true; }
		if ( ! in_array( $node->localName, $tags, true ) || ++$count > 1000 ) { return false; }
		$out = $clean->createElementNS( 'http://www.w3.org/2000/svg', $node->localName );
		( $parent ? $parent : $clean )->appendChild( $out );
		foreach ( $node->attributes as $attribute ) {
			$name = $attribute->localName; $value = $attribute->value;
			if ( ! in_array( $name, $attributes, true ) ) { continue; }
			if ( 'style' === $name ) { $value = dh_svg_declarations( $value ); }
			elseif ( 'href' === $name && ! preg_match( '/^#[\w.-]+$/', $value ) ) { continue; }
			elseif ( ! dh_svg_safe_value( $value ) ) { continue; }
			$out->setAttribute( $name, $value );
		}
		if ( 'style' === $node->localName ) {
			preg_match_all( '/([^{}]+)\{([^{}]*)\}/', $node->textContent, $rules, PREG_SET_ORDER ); $css = '';
			foreach ( $rules as $rule ) { $selector = trim( $rule[1] ); $body = dh_svg_declarations( $rule[2] ); if ( preg_match( '/^[.#\w\s,>\-]+$/', $selector ) && $body ) { $css .= $selector . '{' . $body . '}'; } }
			$out->appendChild( $clean->createTextNode( $css ) );
		} else { foreach ( $node->childNodes as $child ) { if ( ! $copy( $child, $out ) ) { return false; } } }
		return true;
	};
	if ( ! $copy( $doc->documentElement ) ) { return new WP_Error( 'svg_paths', __( 'Simplify this SVG: convert text, images, strokes and effects to filled paths; use fewer than 1,000 elements.', 'kaleidoscope-hero' ) ); }
	return $clean->saveXML( $clean->documentElement );
}

function dh_ajax_upload_model() {
	if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! current_user_can( 'manage_options' ) || ! current_user_can( 'upload_files' ) || ! check_ajax_referer( 'dh_models', 'nonce', false ) ) { wp_send_json_error( array( 'message' => __( 'Not allowed. Refresh the page and try again.', 'kaleidoscope-hero' ) ), 403 ); }
	$file = $_FILES['model'] ?? null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	if ( ! is_array( $file ) || ! empty( $file['error'] ) || ! isset( $file['name'], $file['tmp_name'] ) || ! is_string( $file['name'] ) || ! is_string( $file['tmp_name'] ) || ! in_array( strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) ), array( 'glb', 'svg' ), true ) ) { wp_send_json_error( array( 'message' => __( 'Choose a .glb model or .svg logo file.', 'kaleidoscope-hero' ) ), 400 ); }
	$svg = 'svg' === strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );
	if ( $svg ) {
		$valid = filesize( $file['tmp_name'] ) <= 512 * KB_IN_BYTES ? dh_clean_svg( file_get_contents( $file['tmp_name'] ) ) : new WP_Error( 'svg_size', __( 'Choose an SVG smaller than 512 KB.', 'kaleidoscope-hero' ) );
		if ( is_wp_error( $valid ) ) { wp_send_json_error( array( 'message' => $valid->get_error_message() ), 400 ); }
		add_filter( 'upload_mimes', 'dh_svg_json_mime' );
		$result = wp_upload_bits( sanitize_file_name( pathinfo( $file['name'], PATHINFO_FILENAME ) ) . '.dh-svg.json', null, wp_json_encode( array( 'format' => 'kaleidoscope-svg-1', 'svg' => $valid ) ) );
		remove_filter( 'upload_mimes', 'dh_svg_json_mime' );
	} else {
		$valid = dh_validate_model_file( $file['tmp_name'] );
		if ( is_wp_error( $valid ) ) { wp_send_json_error( array( 'message' => $valid->get_error_message() ), 400 ); }
		require_once ABSPATH . 'wp-admin/includes/file.php';
		add_filter( 'wp_check_filetype_and_ext', 'dh_model_upload_filetype', 10, 4 );
		$result = wp_handle_upload( $file, array( 'test_form' => false, 'mimes' => array( 'glb' => 'model/gltf-binary' ) ) );
		remove_filter( 'wp_check_filetype_and_ext', 'dh_model_upload_filetype', 10 );
	}
	if ( ! empty( $result['error'] ) ) { wp_send_json_error( array( 'message' => $result['error'] ), 400 ); }
	$id = wp_insert_attachment( array( 'post_mime_type' => $svg ? 'application/json' : 'model/gltf-binary', 'post_title' => sanitize_text_field( pathinfo( $file['name'], PATHINFO_FILENAME ) ), 'post_status' => 'inherit' ), $result['file'], 0, true );
	if ( is_wp_error( $id ) ) { wp_delete_file( $result['file'] ); wp_send_json_error( array( 'message' => __( 'The model could not be added to the media library.', 'kaleidoscope-hero' ) ), 500 ); }
	wp_send_json_success( array( 'id' => $id, 'url' => esc_url_raw( set_url_scheme( $result['url'] ) ), 'name' => get_the_title( $id ) ) );
}
add_action( 'wp_ajax_dh_upload_model', 'dh_ajax_upload_model' );
