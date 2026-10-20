<?php
/** Preset editor presentation. Field names and stored settings stay in the schema. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function dh_editor_controls( $keys, $settings, &$seen ) {
	$fields = dh_fields();
	$labels = array(
		'style' => __( 'Animated element', 'kaleidoscope-hero' ),
		'flow' => __( 'Animation speed', 'kaleidoscope-hero' ),
		'lookRange' => __( 'Mouse follow strength', 'kaleidoscope-hero' ),
		'warp' => __( 'Mouse-hold warp', 'kaleidoscope-hero' ),
		'bloom' => __( 'Bloom / soft halo', 'kaleidoscope-hero' ),
		'autoVortex' => __( 'Twist automatically on load', 'kaleidoscope-hero' ),
		'vortex' => __( 'Twist at screen edges', 'kaleidoscope-hero' ),
		'kaleidoscope' => __( 'Mirror count', 'kaleidoscope-hero' ),
		'overlay' => __( 'Use built-in text & links', 'kaleidoscope-hero' ),
		'mode' => __( 'Use this preset as', 'kaleidoscope-hero' ),
		'scene' => __( 'Animation', 'kaleidoscope-hero' ),
	);
	$help = array(
		'scene' => '',
		'flow' => __( '0 pauses the element. Mouse and scroll responses have their own controls under Interaction.', 'kaleidoscope-hero' ),
		'glow' => __( 'Strength of the light emitted by the element. Bloom adds the softer halo around it.', 'kaleidoscope-hero' ),
		'bloom' => __( 'Soft light around bright areas. 0 keeps the edges crisper.', 'kaleidoscope-hero' ),
		'warp' => __( 'Hold the mouse button over the animation to stretch and accelerate it. 0 disables this response.', 'kaleidoscope-hero' ),
		'mode' => __( 'Hero includes optional text and links. Section background sits behind the content you add in your page editor.', 'kaleidoscope-hero' ),
		'overlay' => __( 'Turn this off when you are adding your own page content over the animation.', 'kaleidoscope-hero' ),
	);
	foreach ( $keys as $key ) {
		if ( ! isset( $fields[ $key ] ) || isset( $seen[ $key ] ) ) {
			continue;
		}
		$field = $fields[ $key ];
		if ( isset( $labels[ $key ] ) ) {
			$field['label'] = $labels[ $key ];
		}
		if ( isset( $help[ $key ] ) ) {
			$field['help'] = $help[ $key ];
		}
		if ( ! empty( $field['help'] ) ) {
			$field['help'] = str_replace( array( 'Flow speed', 'Flow 0', 'Mouse look' ), array( __( 'Animation speed', 'kaleidoscope-hero' ), __( 'Animation speed 0', 'kaleidoscope-hero' ), __( 'Mouse follow strength', 'kaleidoscope-hero' ) ), $field['help'] );
		}
		if ( 'scene' === $key ) {
			$field['option_labels'] = array( 'Kaleidoscope' => __( 'On', 'kaleidoscope-hero' ), 'Off' => __( 'Off — still background', 'kaleidoscope-hero' ) );
		}
		if ( 'style' === $key ) {
			$field['option_groups'] = array(
				__( 'Light & patterns', 'kaleidoscope-hero' ) => array( 'Digital grid', 'Fiber optics', 'Constellation', 'Word rain', 'LED globe' ),
				__( 'Surfaces & spaces', 'kaleidoscope-hero' ) => array( 'Particle waves', 'Digital fabric', 'Iridescent ribbons', 'Wireframe tunnel', 'Data rings', 'Voronoi crystal', 'Fractal flythrough', 'Wireframe landscape' ),
				__( 'Cities & structures', 'kaleidoscope-hero' ) => array( 'Blueprint city', 'Dot matrix structures' ),
				__( 'Sculptures & objects', 'kaleidoscope-hero' ) => array( 'Digital disco ball', 'Floating shape', 'Morphing sculptures' ),
			);
			$unlisted = array_diff( $field['options'], array_merge( ...array_values( $field['option_groups'] ) ) );
			if ( $unlisted ) {
				$field['option_groups'][ __( 'Other elements', 'kaleidoscope-hero' ) ] = $unlisted;
			}
		}
		$seen[ $key ] = true;
		dh_field( $key, $field, isset( $settings[ $key ] ) ? $settings[ $key ] : $field['default'] );
	}
}

function dh_editor_card( $title, $keys, $settings, &$seen, $styles = '', $animated = true ) {
	?>
	<section class="dh-panel dh-editor-card"<?php echo $animated ? ' data-dh-animation' : ''; ?><?php echo $styles ? ' data-dh-for="' . esc_attr( $styles ) . '"' : ''; ?>>
		<h3><?php echo esc_html( $title ); ?></h3>
		<?php dh_editor_controls( $keys, $settings, $seen ); ?>
	</section>
	<?php
}

function dh_admin_editor( $presets, $edit, $is_new, $current ) {
	$settings = dh_sanitize_settings( array(), $current['settings'] );
	$preview = $settings;
	$preview['height'] = '300px';
	$seen = array();
	$tabs = array( 'element' => __( 'Element', 'kaleidoscope-hero' ), 'appearance' => __( 'Appearance', 'kaleidoscope-hero' ), 'interaction' => __( 'Interaction', 'kaleidoscope-hero' ), 'content' => __( 'Text & links', 'kaleidoscope-hero' ), 'placement' => __( 'Placement', 'kaleidoscope-hero' ) );
	?>
	<div class="dh-chips" aria-label="<?php esc_attr_e( 'Presets', 'kaleidoscope-hero' ); ?>">
		<?php foreach ( $presets as $slug => $preset ) : ?>
			<a class="dh-chip<?php echo ! $is_new && $slug === $edit ? ' is-active' : ''; ?>"<?php echo ! $is_new && $slug === $edit ? ' aria-current="page"' : ''; ?> href="<?php echo esc_url( dh_admin_url( array( 'edit' => $slug ) ) ); ?>"><?php echo esc_html( $preset['name'] ); ?></a>
		<?php endforeach; ?>
		<a class="dh-chip dh-chip--add" href="<?php echo esc_url( dh_admin_url( array( 'new' => 1 ) ) ); ?>"><?php esc_html_e( '+ New preset', 'kaleidoscope-hero' ); ?></a>
	</div>
	<div class="dh-layout">
	<form id="dh-preset-form" class="dh-form dh-form--savebar dh-editor" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
		<?php wp_nonce_field( 'dh_save_preset' ); ?>
		<input type="hidden" name="action" value="dh_save_preset"><input type="hidden" name="dh_slug" value="<?php echo esc_attr( $is_new ? '' : $edit ); ?>">
		<div class="dh-panel dh-preset-meta">
			<div class="dh-field"><label for="dh-name"><?php esc_html_e( 'Preset name', 'kaleidoscope-hero' ); ?></label><div class="dh-control"><input type="text" id="dh-name" name="dh_name" value="<?php echo esc_attr( $current['name'] ); ?>" required placeholder="<?php esc_attr_e( 'e.g. Work page', 'kaleidoscope-hero' ); ?>"></div></div>
		</div>
		<div class="dh-editor-tabs" role="tablist" aria-label="<?php esc_attr_e( 'Preset settings', 'kaleidoscope-hero' ); ?>">
			<?php foreach ( $tabs as $id => $label ) : ?>
				<button type="button" id="dh-tab-<?php echo esc_attr( $id ); ?>" role="tab" aria-controls="dh-page-<?php echo esc_attr( $id ); ?>" aria-selected="<?php echo 'element' === $id ? 'true' : 'false'; ?>" tabindex="<?php echo 'element' === $id ? '0' : '-1'; ?>"><?php echo esc_html( $label ); ?></button>
			<?php endforeach; ?>
		</div>
		<section id="dh-page-element" class="dh-editor-page" role="tabpanel" aria-labelledby="dh-tab-element" tabindex="0">
			<h2><?php esc_html_e( 'Choose your element', 'kaleidoscope-hero' ); ?></h2><p class="dh-editor-intro"><?php esc_html_e( 'Choose a look, then adjust its speed and detail. Only controls for this element appear below.', 'kaleidoscope-hero' ); ?></p>
			<?php dh_editor_card( __( 'Animation', 'kaleidoscope-hero' ), array( 'scene', 'style' ), $settings, $seen, '', false ); ?>
			<p class="dh-editor-notice" id="dh-random-note" hidden><?php esc_html_e( 'Random looks are on. Turn off Cycle through random looks below to preview one element and palette.', 'kaleidoscope-hero' ); ?></p>
			<p class="dh-editor-notice" data-dh-still hidden><?php esc_html_e( 'Animation is off. You can still edit the background colors, text and placement.', 'kaleidoscope-hero' ); ?></p>
			<?php
			dh_editor_card( __( 'Speed & detail', 'kaleidoscope-hero' ), array( 'flow', 'density' ), $settings, $seen );
			dh_editor_card( __( 'Tunnel particles', 'kaleidoscope-hero' ), array_keys( dh_schema()['Wireframe tunnel'] ), $settings, $seen, 'Wireframe tunnel' );
			dh_editor_card( __( 'Landscape', 'kaleidoscope-hero' ), array_keys( dh_schema()['Wireframe landscape'] ), $settings, $seen, 'Wireframe landscape' );
			dh_editor_card( __( 'City', 'kaleidoscope-hero' ), array_keys( dh_schema()['Blueprint city'] ), $settings, $seen, 'Blueprint city' );
			dh_editor_card( __( 'LED show', 'kaleidoscope-hero' ), array( 'ledPattern' ), $settings, $seen, 'LED globe' );
			dh_editor_card( __( 'Particle sculpture', 'kaleidoscope-hero' ), array( 'shape', 'shapeSize', 'shapeFloat', 'shapeSeed', 'shapeLobes', 'shapeTwist' ), $settings, $seen, 'Floating shape|Morphing sculptures' );
			dh_editor_card( __( 'Morphing', 'kaleidoscope-hero' ), array( 'morphMode', 'morphFrom', 'morphTo', 'morphDuration', 'morphHold', 'morphProgress', 'morphStagger', 'morphScrollDistance' ), $settings, $seen, 'Morphing sculptures' );
			dh_editor_card( __( 'Ribbon shape & material', 'kaleidoscope-hero' ), array( 'ribbonCount', 'ribbonWidth', 'ribbonFold', 'ribbonTwist', 'ribbonTransparency', 'ribbonIridescence', 'ribbonEdge' ), $settings, $seen, 'Iridescent ribbons' );
			?>
			<details class="dh-panel dh-editor-details" data-dh-animation><summary><?php esc_html_e( 'Cycle through random looks', 'kaleidoscope-hero' ); ?><span data-dh-status="randomize"></span></summary><?php dh_editor_controls( array( 'randomize', 'randomInterval' ), $settings, $seen ); ?></details>
		</section>
		<section id="dh-page-appearance" class="dh-editor-page" role="tabpanel" aria-labelledby="dh-tab-appearance" tabindex="0">
			<h2><?php esc_html_e( 'Colors & finish', 'kaleidoscope-hero' ); ?></h2><p class="dh-editor-intro"><?php esc_html_e( 'Set the element colors and background first. Open the optional effects when you need them.', 'kaleidoscope-hero' ); ?></p>
			<?php dh_editor_card( __( 'Element colors', 'kaleidoscope-hero' ), array( 'palette', 'opacity', 'brightness', 'multicolor' ), $settings, $seen ); ?>
			<?php dh_editor_card( __( 'Background', 'kaleidoscope-hero' ), array_keys( dh_schema()['Background'] ), $settings, $seen, '', false ); ?>
			<details class="dh-panel dh-editor-details" data-dh-animation><summary><?php esc_html_e( 'Glow & bloom', 'kaleidoscope-hero' ); ?></summary><?php dh_editor_controls( array( 'glow', 'bloom' ), $settings, $seen ); ?></details>
			<details class="dh-panel dh-editor-details" data-dh-animation><summary><?php esc_html_e( 'Kaleidoscope mirrors', 'kaleidoscope-hero' ); ?><span data-dh-status="mirrors"></span></summary><?php dh_editor_controls( array( 'kaleidoscope', 'kaleidoscopeMode' ), $settings, $seen ); ?></details>
			<details class="dh-panel dh-editor-details" data-dh-animation><summary><?php esc_html_e( 'Tessellation / tiling', 'kaleidoscope-hero' ); ?><span data-dh-status="tessellation"></span></summary><?php dh_editor_controls( array_keys( dh_schema()['Tessellation'] ), $settings, $seen ); ?></details>
			<details class="dh-panel dh-editor-details" data-dh-animation><summary><?php esc_html_e( 'Color blending', 'kaleidoscope-hero' ); ?><span data-dh-status="blendMode"></span></summary><?php dh_editor_controls( array_keys( dh_schema()['Color blending'] ), $settings, $seen ); ?></details>
		</section>
		<section id="dh-page-interaction" class="dh-editor-page" role="tabpanel" aria-labelledby="dh-tab-interaction" tabindex="0">
			<h2><?php esc_html_e( 'Mouse, scroll & rotation', 'kaleidoscope-hero' ); ?></h2><p class="dh-editor-intro"><?php esc_html_e( 'Control how the animation responds. Set a strength to 0 to disable that response.', 'kaleidoscope-hero' ); ?></p>
			<p class="dh-editor-notice" data-dh-still hidden><?php esc_html_e( 'Turn Animation on in Element to use these controls.', 'kaleidoscope-hero' ); ?></p>
			<?php dh_editor_card( __( 'Mouse movement', 'kaleidoscope-hero' ), array( 'lookRange', 'discoMouseControl', 'warp' ), $settings, $seen ); ?>
			<?php dh_editor_card( __( 'Particle interaction', 'kaleidoscope-hero' ), array( 'shapeMouseEffect', 'shapeMouseRadius', 'shapeMouseStrength', 'shapeMouseGlobal', 'morphExplode', 'shapeTrigger', 'shapeExplode', 'shapeSensitivity', 'shapeRecovery', 'shapeScrollDistance' ), $settings, $seen, 'Floating shape|Morphing sculptures' ); ?>
			<?php dh_editor_card( __( 'Ribbon interaction', 'kaleidoscope-hero' ), array( 'ribbonBend', 'ribbonRadius', 'ribbonScroll', 'ribbonScrollStrength', 'ribbonScrollDistance' ), $settings, $seen, 'Iridescent ribbons' ); ?>
			<details class="dh-panel dh-editor-details" data-dh-animation><summary><?php esc_html_e( 'Automatic vortex', 'kaleidoscope-hero' ); ?><span data-dh-status="autoVortex"></span></summary><?php dh_editor_controls( array( 'autoVortex', 'autoVortexStrength', 'autoVortexSpeed', 'autoVortexDirection', 'autoVortexRamp' ), $settings, $seen ); ?></details>
			<details class="dh-panel dh-editor-details" data-dh-animation><summary><?php esc_html_e( 'Mouse-edge vortex', 'kaleidoscope-hero' ); ?><span data-dh-status="vortex"></span></summary><?php dh_editor_controls( array( 'vortex', 'vortexRamp' ), $settings, $seen ); ?></details>
		</section>
		<section id="dh-page-content" class="dh-editor-page" role="tabpanel" aria-labelledby="dh-tab-content" tabindex="0">
			<h2><?php esc_html_e( 'Built-in text & links', 'kaleidoscope-hero' ); ?></h2><p class="dh-editor-intro"><?php esc_html_e( 'These belong to a standalone Hero. For a section background, add content in your page editor.', 'kaleidoscope-hero' ); ?></p>
			<p class="dh-editor-notice" id="dh-background-content-note" hidden><?php esc_html_e( 'This preset is a section background. Its built-in text and links are hidden. Change Placement to Hero to use them; your existing text is kept.', 'kaleidoscope-hero' ); ?></p>
			<div data-dh-hero-content>
				<?php dh_editor_card( __( 'Text overlay', 'kaleidoscope-hero' ), array( 'overlay' ), $settings, $seen, '', false ); ?>
				<div data-dh-overlay-content>
					<?php dh_editor_card( __( 'Heading & button', 'kaleidoscope-hero' ), array( 'heading', 'subheading', 'buttonText', 'buttonUrl' ), $settings, $seen, '', false ); ?>
					<details class="dh-panel dh-editor-details"><summary><?php esc_html_e( 'Navigation links', 'kaleidoscope-hero' ); ?></summary><?php dh_editor_controls( array( 'aboutText', 'aboutUrl', 'workText', 'workUrl', 'moreText', 'moreUrl' ), $settings, $seen ); ?></details>
					<details class="dh-panel dh-editor-details"><summary><?php esc_html_e( 'Text details', 'kaleidoscope-hero' ); ?></summary><?php dh_editor_controls( array( 'headingTag', 'brackets' ), $settings, $seen ); ?></details>
				</div>
			</div>
		</section>
		<section id="dh-page-placement" class="dh-editor-page" role="tabpanel" aria-labelledby="dh-tab-placement" tabindex="0">
			<h2><?php esc_html_e( 'Where this preset appears', 'kaleidoscope-hero' ); ?></h2><p class="dh-editor-intro"><?php esc_html_e( 'Choose a standalone hero or a background behind your own page content.', 'kaleidoscope-hero' ); ?></p>
			<?php dh_editor_card( __( 'Display', 'kaleidoscope-hero' ), array( 'mode', 'height', 'darkness' ), $settings, $seen, '', false ); ?>
			<details class="dh-panel dh-editor-details"><summary><?php esc_html_e( 'Shortcode identifier', 'kaleidoscope-hero' ); ?></summary><div class="dh-field"><label for="dh-new-slug"><?php esc_html_e( 'Shortcode ID', 'kaleidoscope-hero' ); ?></label><div class="dh-control"><input type="text" id="dh-new-slug" name="dh_new_slug" value="<?php echo esc_attr( $is_new ? '' : $edit ); ?>" pattern="[a-z0-9\-]*" placeholder="<?php esc_attr_e( 'Generated from the name', 'kaleidoscope-hero' ); ?>"><p class="description"><?php esc_html_e( 'Only change this if you also update the shortcodes already using it.', 'kaleidoscope-hero' ); ?></p></div></div></details>
		</section>
		<?php $remaining = array_diff( array_keys( dh_fields() ), array_keys( $seen ) ); ?>
		<?php if ( $remaining ) : ?><details class="dh-panel dh-editor-details"><summary><?php esc_html_e( 'Other settings', 'kaleidoscope-hero' ); ?></summary><?php dh_editor_controls( $remaining, $settings, $seen ); ?></details><?php endif; ?>
		<details class="dh-editor-template"><summary><?php esc_html_e( 'Apply or save a template', 'kaleidoscope-hero' ); ?></summary><?php dh_template_editor_panel(); ?></details>
		<div class="submit dh-savebar"><span id="dh-save-status" role="status" aria-live="polite"><?php esc_html_e( 'Preview changes, then save your preset.', 'kaleidoscope-hero' ); ?></span><button type="submit" class="button button-primary button-hero"><?php esc_html_e( 'Save preset', 'kaleidoscope-hero' ); ?></button></div>
	</form>
	<aside class="dh-aside" aria-label="<?php esc_attr_e( 'Live preview and shortcode', 'kaleidoscope-hero' ); ?>">
		<details class="dh-preview-fold" open><summary class="dh-preview-title"><strong><?php esc_html_e( 'Live preview', 'kaleidoscope-hero' ); ?></strong><span id="dh-preview-style"><?php echo esc_html( $settings['style'] ); ?></span></summary><div class="dh-preview-body">
		<div class="dh-preview" id="dh-preview"><?php echo dh_render( array( $preview ), 20, null, true ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
		<p class="description"><?php esc_html_e( 'Changes appear here before you save.', 'kaleidoscope-hero' ); ?></p>
		<?php if ( ! $is_new ) : ?>
			<?php $sc = '[kaleidoscope_hero preset="' . $edit . '"]'; ?>
			<div class="dh-shortcode"><code><?php echo esc_html( $sc ); ?></code><button type="button" class="button dh-copy" data-copy="<?php echo esc_attr( $sc ); ?>"><?php esc_html_e( 'Copy', 'kaleidoscope-hero' ); ?></button></div>
			<details class="dh-aside-details"><summary><?php esc_html_e( 'Use behind page content', 'kaleidoscope-hero' ); ?></summary><p><?php esc_html_e( 'Place this shortcode inside a Group or section with your content.', 'kaleidoscope-hero' ); ?></p><?php $bg = '[kaleidoscope_hero preset="' . $edit . '" mode="background"]'; ?><div class="dh-shortcode"><code><?php echo esc_html( $bg ); ?></code><button type="button" class="button dh-copy" data-copy="<?php echo esc_attr( $bg ); ?>"><?php esc_html_e( 'Copy', 'kaleidoscope-hero' ); ?></button></div></details>
			<details class="dh-aside-details"><summary><?php esc_html_e( 'Duplicate or delete preset', 'kaleidoscope-hero' ); ?></summary><div class="dh-actions">
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"><?php wp_nonce_field( 'dh_duplicate_preset' ); ?><input type="hidden" name="action" value="dh_duplicate_preset"><input type="hidden" name="dh_slug" value="<?php echo esc_attr( $edit ); ?>"><button type="submit" class="button"><?php esc_html_e( 'Duplicate', 'kaleidoscope-hero' ); ?></button></form>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('Delete this preset? Shortcodes using it will fall back to the first preset.');"><?php wp_nonce_field( 'dh_delete_preset' ); ?><input type="hidden" name="action" value="dh_delete_preset"><input type="hidden" name="dh_slug" value="<?php echo esc_attr( $edit ); ?>"><button type="submit" class="button button-link-delete"><?php esc_html_e( 'Delete', 'kaleidoscope-hero' ); ?></button></form>
			</div></details>
		<?php endif; ?>
		</div></details>
	</aside>
	</div>
	<?php
}
