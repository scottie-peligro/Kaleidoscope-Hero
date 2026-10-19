<?php
/** Reusable settings snapshots. Loaded by the plugin; no frontend assets required. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'DH_TEMPLATE_LIMIT', 100 );
define( 'DH_TEMPLATE_MAX_BYTES', 1048576 );

function dh_template_fields( $scope ) {
	$fields = dh_fields();
	if ( 'look' === $scope ) {
		$schema = dh_schema();
		$fields = array_diff_key( $fields, $schema['Content'], array( 'mode' => true, 'height' => true ) );
	}
	return $fields;
}

/** Keep only supplied, supported fields so older templates preserve newer controls. */
function dh_template_clean_settings( $input, $scope ) {
	if ( ! is_array( $input ) || ! in_array( $scope, array( 'look', 'full' ), true ) ) {
		return new WP_Error( 'template_settings', __( 'Invalid template settings or scope.', 'kaleidoscope-hero' ) );
	}
	$out = array();
	foreach ( dh_template_fields( $scope ) as $key => $field ) {
		if ( ! array_key_exists( $key, $input ) ) { continue; }
		$value = $input[ $key ];
		if ( ! is_scalar( $value ) || ( 'range' === $field['type'] && ! is_numeric( $value ) ) || ( 'range' === $field['type'] && ! is_finite( (float) $value ) ) ) {
			return new WP_Error( 'template_value', sprintf( __( 'Invalid value for %s.', 'kaleidoscope-hero' ), $field['label'] ) );
		}
		if ( 'enum' === $field['type'] && ! in_array( (string) $value, $field['options'], true ) ) {
			return new WP_Error( 'template_option', sprintf( __( 'Unsupported option for %s. Update the plugin if this template uses a newer feature.', 'kaleidoscope-hero' ), $field['label'] ) );
		}
		$out[ $key ] = dh_sanitize_value( $field, $value );
	}
	return $out ? $out : new WP_Error( 'template_empty', __( 'The template has no supported settings.', 'kaleidoscope-hero' ) );
}

function dh_get_templates() {
	$out = array();
	foreach ( (array) get_option( 'dh_templates', array() ) as $id => $record ) {
		if ( ! is_array( $record ) || ! isset( $record['name'], $record['scope'], $record['settings'] ) || ! is_string( $id ) || ! preg_match( '/^t-[a-z0-9-]+$/', $id ) || ! is_string( $record['name'] ) ) { continue; }
		$settings = dh_template_clean_settings( $record['settings'], $record['scope'] );
		if ( is_wp_error( $settings ) ) { continue; }
		$out[ $id ] = array( 'id' => $id, 'name' => sanitize_text_field( $record['name'] ), 'scope' => $record['scope'], 'settings' => $settings );
		if ( count( $out ) >= DH_TEMPLATE_LIMIT ) { break; }
	}
	return $out;
}

/** Validate an entire batch before writing anything. Imported IDs never overwrite local IDs. */
function dh_template_add( $records ) {
	if ( ! is_array( $records ) || ! $records || count( $records ) > DH_TEMPLATE_LIMIT ) {
		return new WP_Error( 'template_count', __( 'Choose between 1 and 100 templates.', 'kaleidoscope-hero' ) );
	}
	$templates = (array) get_option( 'dh_templates', array() );
	if ( count( $templates ) + count( $records ) > DH_TEMPLATE_LIMIT ) {
		return new WP_Error( 'template_limit', __( 'The library can hold 100 templates. Export and remove unused templates before adding more.', 'kaleidoscope-hero' ) );
	}
	$added = array();
	foreach ( $records as $record ) {
		if ( ! is_array( $record ) || ! isset( $record['name'], $record['scope'], $record['settings'] ) || ! is_string( $record['name'] ) || ! in_array( $record['scope'], array( 'look', 'full' ), true ) ) {
			return new WP_Error( 'template_record', __( 'Each template needs a name, scope and settings.', 'kaleidoscope-hero' ) );
		}
		$name = wp_html_excerpt( sanitize_text_field( $record['name'] ), 120, '' );
		if ( '' === trim( $name ) ) { return new WP_Error( 'template_name', __( 'Give the template a name.', 'kaleidoscope-hero' ) ); }
		$settings = dh_template_clean_settings( $record['settings'], $record['scope'] );
		if ( is_wp_error( $settings ) ) { return $settings; }
		$names = array_map( 'strtolower', wp_list_pluck( array_filter( $templates, function( $item ) { return is_array( $item ) && isset( $item['name'] ) && is_string( $item['name'] ); } ), 'name' ) );
		$unique = $name; $suffix = 2;
		while ( in_array( strtolower( $unique ), $names, true ) ) { $unique = wp_html_excerpt( $name, 110, '' ) . ' (' . $suffix++ . ')'; }
		$id = 't-' . wp_generate_uuid4();
		$item = array( 'id' => $id, 'name' => $unique, 'scope' => $record['scope'], 'settings' => $settings );
		$templates[ $id ] = $item;
		$added[] = $item;
	}
	if ( strlen( wp_json_encode( $templates ) ) > DH_TEMPLATE_MAX_BYTES - 4096 ) { return new WP_Error( 'template_library_size', __( 'The template library is full (1 MB). Export and remove unused templates first.', 'kaleidoscope-hero' ) ); }
	if ( ! update_option( 'dh_templates', $templates, false ) ) { return new WP_Error( 'template_write', __( 'The template could not be saved. Try again.', 'kaleidoscope-hero' ) ); }
	return $added;
}

function dh_template_export_data( $id = 'all' ) {
	$templates = dh_get_templates();
	if ( 'all' !== $id ) {
		if ( ! isset( $templates[ $id ] ) ) { return new WP_Error( 'template_missing', __( 'Template not found.', 'kaleidoscope-hero' ) ); }
		$templates = array( $templates[ $id ] );
	}
	$records = array();
	foreach ( $templates as $item ) { $records[] = array( 'name' => $item['name'], 'scope' => $item['scope'], 'settings' => $item['settings'] ); }
	return array( 'format' => 'kaleidoscope-hero-templates', 'version' => 1, 'plugin_version' => DH_VERSION, 'templates' => $records );
}

function dh_template_parse( $json ) {
	if ( ! is_string( $json ) || strlen( $json ) > DH_TEMPLATE_MAX_BYTES ) { return new WP_Error( 'template_size', __( 'Choose a template JSON file smaller than 1 MB.', 'kaleidoscope-hero' ) ); }
	$data = json_decode( $json, true, 32 );
	if ( ! is_array( $data ) || 'kaleidoscope-hero-templates' !== ( $data['format'] ?? '' ) || 1 !== ( $data['version'] ?? null ) || ! isset( $data['templates'] ) || ! is_array( $data['templates'] ) || ! $data['templates'] || count( $data['templates'] ) > DH_TEMPLATE_LIMIT || array_keys( $data['templates'] ) !== range( 0, count( $data['templates'] ) - 1 ) ) {
		return new WP_Error( 'template_file', __( 'This is not a supported Kaleidoscope Hero template file (format version 1).', 'kaleidoscope-hero' ) );
	}
	// dh_template_add validates the complete batch before persisting it.
	return $data['templates'];
}

function dh_ajax_save_template() {
	if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! current_user_can( 'manage_options' ) || ! check_ajax_referer( 'dh_templates', 'nonce', false ) ) { wp_send_json_error( array( 'message' => __( 'Not allowed. Refresh the page and try again.', 'kaleidoscope-hero' ) ), 403 ); }
	$json = isset( $_POST['settings'] ) && is_string( $_POST['settings'] ) ? wp_unslash( $_POST['settings'] ) : '';
	if ( strlen( $json ) > DH_TEMPLATE_MAX_BYTES ) { wp_send_json_error( array( 'message' => __( 'The settings are too large.', 'kaleidoscope-hero' ) ), 400 ); }
	$added = dh_template_add( array( array( 'name' => isset( $_POST['name'] ) && is_string( $_POST['name'] ) ? wp_unslash( $_POST['name'] ) : '', 'scope' => isset( $_POST['scope'] ) && is_string( $_POST['scope'] ) ? wp_unslash( $_POST['scope'] ) : '', 'settings' => json_decode( $json, true, 32 ) ) ) );
	if ( is_wp_error( $added ) ) { wp_send_json_error( array( 'message' => $added->get_error_message() ), 400 ); }
	wp_send_json_success( array( 'template' => $added[0], 'message' => __( 'Template saved. Your preset changes have not been saved.', 'kaleidoscope-hero' ) ) );
}
add_action( 'wp_ajax_dh_save_template', 'dh_ajax_save_template' );

function dh_template_require_admin( $action ) {
	if ( 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! current_user_can( 'manage_options' ) ) { wp_die( esc_html__( 'Not allowed.', 'kaleidoscope-hero' ), '', array( 'response' => 403 ) ); }
	check_admin_referer( $action );
}

function dh_handle_export_templates() {
	dh_template_require_admin( 'dh_export_templates' );
	$id = isset( $_POST['template_id'] ) && is_string( $_POST['template_id'] ) ? sanitize_key( wp_unslash( $_POST['template_id'] ) ) : 'all';
	$data = dh_template_export_data( $id );
	if ( is_wp_error( $data ) ) { wp_die( esc_html( $data->get_error_message() ), '', array( 'response' => 404, 'back_link' => true ) ); }
	$filename = 'all' === $id ? 'kaleidoscope-templates' : 'kaleidoscope-' . sanitize_title( $data['templates'][0]['name'] );
	nocache_headers();
	header( 'Content-Type: application/json; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="' . $filename . '.json"' );
	header( 'X-Content-Type-Options: nosniff' );
	echo wp_json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ); // phpcs:ignore WordPress.Security.EscapeOutput -- JSON download.
	exit;
}
add_action( 'admin_post_dh_export_templates', 'dh_handle_export_templates' );

function dh_handle_import_templates() {
	dh_template_require_admin( 'dh_import_templates' );
	$file = isset( $_FILES['template_file'] ) && is_array( $_FILES['template_file'] ) ? $_FILES['template_file'] : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	if ( ! isset( $file['error'], $file['tmp_name'], $file['name'] ) || UPLOAD_ERR_OK !== $file['error'] || ! is_string( $file['tmp_name'] ) || ! is_string( $file['name'] ) || 'json' !== strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) ) || ! is_uploaded_file( $file['tmp_name'] ) ) { wp_die( esc_html__( 'Choose a valid template JSON upload.', 'kaleidoscope-hero' ), '', array( 'response' => 400, 'back_link' => true ) ); }
	$json = file_get_contents( $file['tmp_name'], false, null, 0, DH_TEMPLATE_MAX_BYTES + 1 );
	$records = dh_template_parse( $json );
	$added = is_wp_error( $records ) ? $records : dh_template_add( $records );
	if ( is_wp_error( $added ) ) { wp_die( esc_html( $added->get_error_message() ), '', array( 'response' => 400, 'back_link' => true ) ); }
	dh_redirect( array( 'tab' => 'templates', 'dh_notice' => 'templates_imported' ) );
}
add_action( 'admin_post_dh_import_templates', 'dh_handle_import_templates' );

function dh_handle_delete_template() {
	$id = isset( $_POST['template_id'] ) && is_string( $_POST['template_id'] ) ? sanitize_key( wp_unslash( $_POST['template_id'] ) ) : '';
	dh_template_require_admin( 'dh_delete_template_' . $id );
	$result = dh_template_remove( $id );
	if ( is_wp_error( $result ) ) { wp_die( esc_html( $result->get_error_message() ), '', array( 'response' => 'template_missing' === $result->get_error_code() ? 404 : 500, 'back_link' => true ) ); }
	dh_redirect( array( 'tab' => 'templates', 'dh_notice' => 'template_deleted' ) );
}
add_action( 'admin_post_dh_delete_template', 'dh_handle_delete_template' );

function dh_template_remove( $id ) {
	$templates = (array) get_option( 'dh_templates', array() );
	if ( ! is_string( $id ) || ! isset( $templates[ $id ] ) ) { return new WP_Error( 'template_missing', __( 'Template not found.', 'kaleidoscope-hero' ) ); }
	unset( $templates[ $id ] );
	return update_option( 'dh_templates', $templates, false ) ? true : new WP_Error( 'template_write', __( 'The template could not be removed. Try again.', 'kaleidoscope-hero' ) );
}

function dh_template_scope_label( $scope ) {
	return 'full' === $scope ? __( 'Full settings', 'kaleidoscope-hero' ) : __( 'Look only', 'kaleidoscope-hero' );
}

function dh_template_editor_panel() {
	?>
	<div class="dh-panel dh-template-tools">
		<h2><?php esc_html_e( 'Reusable templates', 'kaleidoscope-hero' ); ?></h2>
		<div class="dh-field"><label for="dh-template-select"><?php esc_html_e( 'Apply a template', 'kaleidoscope-hero' ); ?></label><div class="dh-control">
			<select id="dh-template-select"><option value=""><?php esc_html_e( 'Choose a saved template…', 'kaleidoscope-hero' ); ?></option><?php foreach ( dh_get_templates() as $item ) : ?><option value="<?php echo esc_attr( $item['id'] ); ?>"><?php echo esc_html( $item['name'] . ' — ' . dh_template_scope_label( $item['scope'] ) ); ?></option><?php endforeach; ?></select>
			<p class="dh-template-buttons"><button type="button" class="button" id="dh-template-apply"><?php esc_html_e( 'Apply to preview', 'kaleidoscope-hero' ); ?></button> <button type="button" class="button" id="dh-template-undo" disabled><?php esc_html_e( 'Undo apply', 'kaleidoscope-hero' ); ?></button></p>
			<p class="description" id="dh-template-scope-note"><?php esc_html_e( 'Look only preserves this preset’s text, links, height and display mode. Full settings includes text and layout. Review, then Save preset to keep the result.', 'kaleidoscope-hero' ); ?></p>
		</div></div>
		<div class="dh-field"><label for="dh-template-name"><?php esc_html_e( 'Save current settings', 'kaleidoscope-hero' ); ?></label><div class="dh-control">
			<input type="text" id="dh-template-name" maxlength="120" placeholder="<?php esc_attr_e( 'e.g. Soft blue particles', 'kaleidoscope-hero' ); ?>">
			<label class="screen-reader-text" for="dh-template-scope"><?php esc_html_e( 'Template includes', 'kaleidoscope-hero' ); ?></label><select id="dh-template-scope"><option value="look"><?php esc_html_e( 'Look only — animation, colours and interaction', 'kaleidoscope-hero' ); ?></option><option value="full"><?php esc_html_e( 'Full settings — also text, links and layout', 'kaleidoscope-hero' ); ?></option></select>
			<p><button type="button" class="button" id="dh-template-save"><?php esc_html_e( 'Save as template', 'kaleidoscope-hero' ); ?></button> <a href="<?php echo esc_url( dh_admin_url( array( 'tab' => 'templates' ) ) ); ?>"><?php esc_html_e( 'Import / export templates', 'kaleidoscope-hero' ); ?></a></p>
			<p class="description"><?php esc_html_e( 'Captures the current controls, including changes you have not saved as a preset. Duplicate names create a new copy.', 'kaleidoscope-hero' ); ?></p>
		</div></div>
		<p id="dh-template-status" role="status" aria-live="polite"></p>
	</div>
	<?php
}

function dh_admin_templates() {
	$templates = dh_get_templates();
	?>
	<div class="dh-template-library">
		<h2><?php esc_html_e( 'Template library', 'kaleidoscope-hero' ); ?></h2>
		<p><?php esc_html_e( 'Save a look in the preset editor, then reuse it on another preset or export a JSON file for another website with Kaleidoscope Hero installed.', 'kaleidoscope-hero' ); ?></p>
		<div class="dh-panel"><h2><?php esc_html_e( 'Import templates', 'kaleidoscope-hero' ); ?></h2>
			<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'dh_import_templates' ); ?><input type="hidden" name="action" value="dh_import_templates"><input type="hidden" name="MAX_FILE_SIZE" value="<?php echo (int) DH_TEMPLATE_MAX_BYTES; ?>">
				<label for="dh-template-file"><?php esc_html_e( 'Template JSON file', 'kaleidoscope-hero' ); ?></label> <input id="dh-template-file" name="template_file" type="file" accept=".json,application/json" required> <button type="submit" class="button"><?php esc_html_e( 'Import into library', 'kaleidoscope-hero' ); ?></button>
				<p class="description"><?php esc_html_e( 'Up to 1 MB and 100 templates. Import adds copies; it does not overwrite existing templates or presets. Same-name templates receive a numbered suffix.', 'kaleidoscope-hero' ); ?></p>
			</form>
		</div>
		<?php if ( $templates ) : ?>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" class="dh-export-all"><?php wp_nonce_field( 'dh_export_templates' ); ?><input type="hidden" name="action" value="dh_export_templates"><input type="hidden" name="template_id" value="all"><button type="submit" class="button"><?php esc_html_e( 'Export all templates', 'kaleidoscope-hero' ); ?></button></form>
		<table class="widefat striped"><thead><tr><th><?php esc_html_e( 'Template', 'kaleidoscope-hero' ); ?></th><th><?php esc_html_e( 'Includes', 'kaleidoscope-hero' ); ?></th><th><?php esc_html_e( 'Actions', 'kaleidoscope-hero' ); ?></th></tr></thead><tbody>
		<?php foreach ( $templates as $item ) : ?><tr><td><strong><?php echo esc_html( $item['name'] ); ?></strong></td><td><?php echo esc_html( dh_template_scope_label( $item['scope'] ) ); ?></td><td class="dh-template-row-actions">
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"><?php wp_nonce_field( 'dh_export_templates' ); ?><input type="hidden" name="action" value="dh_export_templates"><input type="hidden" name="template_id" value="<?php echo esc_attr( $item['id'] ); ?>"><button class="button" type="submit"><?php esc_html_e( 'Export JSON', 'kaleidoscope-hero' ); ?></button></form>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" class="dh-template-delete"><?php wp_nonce_field( 'dh_delete_template_' . $item['id'] ); ?><input type="hidden" name="action" value="dh_delete_template"><input type="hidden" name="template_id" value="<?php echo esc_attr( $item['id'] ); ?>"><button class="button button-link-delete" type="submit"><?php esc_html_e( 'Delete', 'kaleidoscope-hero' ); ?></button></form>
		</td></tr><?php endforeach; ?>
		</tbody></table>
		<?php else : ?><p><?php esc_html_e( 'No templates yet. Open a preset, adjust its settings, then choose Save as template.', 'kaleidoscope-hero' ); ?></p><?php endif; ?>
		<p class="description"><?php esc_html_e( 'Templates are independent snapshots. Changing or deleting one does not change presets that already used it. Full settings files include their saved text and links; Look only files do not.', 'kaleidoscope-hero' ); ?></p>
	</div>
	<?php
}
