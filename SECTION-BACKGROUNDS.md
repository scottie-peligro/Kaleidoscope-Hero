# Animated section backgrounds

## WordPress editor

1. Add a **Kaleidoscope Section** block from the block inserter.
2. In its settings, choose an **Animation preset** and **Background darkness**.
3. Add normal blocks inside the section: headings, paragraphs, columns, images, buttons, or your form plugin's block.
4. View the page to see the animation. The editor intentionally uses a still gradient preview.

The section's height comes from its content and padding. Text and controls remain normal WordPress blocks. Use the block's spacing, text color, alignment, and anchor settings as needed. Existing presets do not need to be changed to background mode when used by this block.

### HTML attributes

Open **Advanced → HTML attributes** in the Kaleidoscope Section block settings. Enter an attribute name and value, such as `id` / `capabilities`, `aria-labelledby` / `capabilities-title`, or `data-section` / `work`. A new empty row appears automatically; use the red remove button to delete an entry.

Attributes apply to the outer section and are saved with the block. The `id` value stays in sync with WordPress's HTML anchor field. Custom classes preserve the block's layout classes. WordPress sanitizes the rendered attributes; invalid names and executable event attributes are omitted. These editor controls add no frontend JavaScript.

### Sticky positioning and movement on scroll

Open **Advanced → Position & scroll**:

- **Sticky position:** Off, Top, or Bottom. Set an offset in pixels to leave room for a header and a stacking order to control overlapping content. Sticky positioning uses CSS and needs no extra JavaScript.
- **Move on scroll:** Off, Up, Down, Left, or Right. The direction applies when scrolling down; scrolling up reverses it.
- **Move:** Animate the background alone (keeping content in place) or the whole section, including content.
- **Travel distance:** Total movement, from 0 to 400 pixels, as the section passes through the viewport. Movement is centered around its normal position.

Both features are off by default. Preview them on the page; the editor remains still. You can combine sticky positioning with scroll movement. The animated canvas is enlarged just enough to cover its section throughout background movement.

Sticky sections stay inside their parent container. Put the section inside a taller Group to give it room to stick. An ancestor with `overflow: hidden`, `auto`, or `scroll` can change the scrolling container; a section taller than the viewport may not fit against the chosen edge. Leave space around whole-section movement to accommodate its travel, especially horizontally.

Scroll movement uses one small shared script, loaded only when enabled, with passive scroll handling and updates requested only after events. Reduced-motion preferences disable translation; sticky positioning still works. No animation library is added.

## Existing sections and page builders

Put a Shortcode block inside the same Group or section as your content:

```text
[kaleidoscope_hero preset="home" mode="background" darkness="0.35"]
```

Place your other content beside the Shortcode block, inside that same parent container. The animation fills the container automatically and the shortcode does not occupy its own row. There is no built-in headline, button, navigation, or corner decoration in this mode.

WordPress Groups, GenerateBlocks containers (both legacy and current classes), Avada full-width containers, and HTML `section` elements are detected automatically. For another container type, add the CSS class `dh-section` to the parent. A background shortcode with no suitable parent stays inactive rather than drawing behind unrelated content.

The darkness value ranges from `0` to `0.9`. Animation opacity, palette, density, and other preset settings still apply. The parent content determines the height; the preset's standalone hero height is ignored.

For HTML or nested shortcodes, use an enclosing shortcode:

```text
[kaleidoscope_hero preset="home" mode="background" darkness="0.4"]
<h2>Your heading</h2>
<p>Your content</p>
[/kaleidoscope_hero]
```

In the plugin's preset editor, **Layout → Display mode → Section background** sets the default for shortcodes using that preset. Use `mode="hero"` to explicitly request the original standalone hero. A copyable background shortcode is available beside each preset's preview. The plugin's **How to use** tab also contains these instructions.

## Performance and accessibility

Long sections automatically keep the animation relative to the visible viewport. The section still covers all its content, but its canvas follows scrolling with an overscan margin rather than being stretched across the entire page height. This preserves detail within the same rendering budget and makes the background behave like a viewport-relative scene while that section is visible. It applies above 1.6 viewport heights; ordinary short sections retain their existing composition. Mouse coordinates follow the visible canvas, while floating-shape scroll explosions still use the section's scroll origin.

The viewport stage follows browser scroll timing independently of the scene's frame rate, preventing the background from hopping between animation frames. An immediate scroll-event fallback handles sticky/fixed ancestors and browsers without scroll timelines. Document layout changes refresh the scroll mapping. Existing background and whole-section movement remain separate from the viewport stage. Particle Waves also filters fine points to reduce temporal shimmer.

- The same frame-rate cap, pixel budget, adaptive resolution, and offscreen pause apply.
- The editor does not start WebGL.
- Background-only blocks do not load the plugin's typography; their content keeps the site's fonts.
- Reduced-motion and Save-Data users receive the still background.
- The decorative layer is hidden from assistive technology and cannot intercept content clicks or keyboard focus. Mouse look can follow movement over the section; pressing a button or filling a form does not trigger warp.
- Each visible section uses one animation instance. Reuse backgrounds where they add value rather than filling every section with a separate animation.

## Files and checks

`kaleidoscope-hero.php` registers the native block, sanitizes the new settings, renders section markup, and documents the controls. `assets/dh-section-editor.js` and `.css` provide the block editor interface. The renderer's `.js` and `.min.js` prepare existing containers and preserve foreground interactions. `assets/kaleidoscope-hero.css` layers and shades backgrounds without taking content out of normal flow. `assets/dh-admin.js` updates the preset preview.

The local verification fixture is saved in the site's `tools/section-background-check.php`. It checks WordPress block registration and serialization, native and enclosing-shortcode rendering, bounded darkness, decorative accessibility, pointer access to form fields, automatic attachment, removal of empty shortcode gaps, and resizing when content grows. Its test form is local and does not send data.

The site's child-theme `functions.php` also checks for its legacy widgets before loading their assets. Adding an animated section therefore does not disable an existing carousel or restore unused hero downloads.

`tools/section-motion-check.php` verifies sticky boundaries, all four scroll directions and reversal, background coverage, whole-section movement, editor serialization, bounded settings, optional script loading, and reduced-motion behavior. Keep only the source in `tools/` after testing.
