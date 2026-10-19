# Performance notes (1.1.0)

Version 1.2.0 also supports [backgrounds behind normal section content](SECTION-BACKGROUNDS.md), using the same rendering budgets. The editor's section preview is static.

The foreground content is server-rendered. Animation starts only after an intersection notification and an animation frame. Unsupported WebGL, reduced-motion, and Save-Data preferences use the CSS gradient and retain the text and navigation.

## Gradient blend source (1.15.1)

Background gradient source reuses the compositor gradient, including radial/linear geometry and angle. Element coverage derives from post-bloom emitted RGB so empty background pixels remain unchanged. It adds one source-selection uniform and a few scalar operations only when blending is enabled; no additional passes, textures or downloads. Existing separate-color source remains the default.

## Color blending (1.15.0)

Fifteen optional color blend modes run in the existing final shader pass after bloom. No additional draw calls, textures, image assets or framebuffer allocations are added. Off skips blend math and preserves previous output. The compressed renderer increase is 905–986 bytes with Node gzip; actual transfer size depends on server encoding. All three engines use the same functions. A 3,000-sample GPU comparison against browser Canvas 2D blend operations differed by at most 2 of 255 per channel (including existing dither and browser rounding). This is correctness validation, not a GPU timing benchmark.

## Rendering budget

Version 1.11.1 prevents a long section from spending its entire pixel budget on page height. Above 1.6 viewport heights, the renderer moves a viewport-sized canvas inside the clipped section, with an overscan margin for scroll motion. The scene stays viewport-relative rather than stretching down the document. It reuses the existing framebuffer and pixel caps, with no additional render passes or animation loops. Canvas placement is updated on scroll/layout changes, and short sections retain normal rendering. A 1,905px-wide, 9,000px-tall test improved buffer width from 384 to 974 pixels under the same 700,000-pixel cap. These are local fixture measurements, not device performance guarantees.

Version 1.11.2 replaces frame-bound canvas placement with a transformed viewport stage. A root scroll timeline drives supported browsers; sticky/fixed ancestors and unsupported browsers update placement directly in the passive scroll event. The canvas's own transform remains available for section motion. ResizeObserver refreshes timeline geometry when document dimensions change. A paused-render scroll check measured zero viewport drift, including page growth/shrink checks. Particle Waves now refines sheet intersections to eight iterations instead of four, filters according to the ray's pixel footprint, and uses slower, smaller twinkle variation. A four-phase, 256px GPU comparison measured normalized temporal second difference at 0.522 versus 1.147 before the change, about 55% lower; this is a local sampling check, not a guarantee for every view or device. Reference: [MDN scroll animation timelines](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations/Timelines).

- Maximum 30 rendered frames per second, with a timer between animation callbacks.
- No animation callbacks or draws while offscreen or the document is hidden.
- Requests a low-power WebGL context without depth, stencil, or antialiasing buffers; avoids software rendering when the browser reports a major performance caveat.
- Caps device pixel ratio at 1 for the decorative canvas. Low/medium/high settings retain distinct resolution scales, with maximum buffers of 350,000 / 700,000 / 1,250,000 pixels.
- Reduces resolution further after two consecutive samples of 45 rendered frames averaging over 45 ms each. This is a frame-delivery heuristic, not a GPU utilization measurement.
- Uses asynchronous shader completion polling when KHR_parallel_shader_compile is available. The text and CSS background remain usable while shaders compile.
- Caches vertex arrays and uses ResizeObserver instead of checking layout every frame.
- Samples the scene once when warp is idle; medium/low use 8 warp taps while high retains 14. Glow remains available and its shader work is skipped when disabled. The scene mipmap chain remains necessary for the glow filter.
- Creates the word atlas only when Word rain first appears, using 24px cells instead of 48px. The smaller bitmap uses 75% less texture storage. A 1px placeholder keeps the inactive sampler complete.
- Deletes textures, framebuffers, vertex arrays, buffers, and programs on destroy. Shader objects are detached and deleted after linking.

The two Latin font files are served locally with `font-display: swap`; their SIL OFL licenses are included in `assets/fonts/`. The existing font toggle still disables these downloads. Other characters use the browser's font fallback.

The child theme skips legacy homepage assets when the Kaleidoscope shortcode supplies the homepage hero. This is a site-specific integration outside the distributable plugin.

## Updating JavaScript

Edit the readable `.js` files, then regenerate both `.min.js` files before deployment. WordPress serves the minified files unless `SCRIPT_DEBUG` is true, and uses modification times to invalidate caches.

From this plugin directory:

```sh
npm exec --yes --package=terser@5.44.0 -- terser assets/kaleidoscope-hero.js --compress --mangle --comments '/^!/' --output assets/kaleidoscope-hero.min.js
npm exec --yes --package=terser@5.44.0 -- terser assets/dh-transitions.js --compress --mangle --comments '/^!/' --output assets/dh-transitions.min.js
```

## Verification

The local browser fixture and recorded results are kept in the site's `tools/` directory. The fixture exercises all nine styles, checks WebGL errors, compares frame counts and base texture allocations, scrolls the hero out of view and back, and checks context loss and destruction. Separate reduced-motion and Save-Data checks verify that no WebGL context is created.

Local desktop comparison (Wireframe tunnel, medium quality, same fixture size):

| Measurement | Before | Optimized |
| --- | ---: | ---: |
| Rendered frames/second | 60.3 | 27.9 |
| Base texture bytes before Word rain | 13,839,244 | 2,042,768 |
| Offscreen callbacks over 0.5 seconds | 30 | 0 |
| Textures remaining after destroy | 3 | 0 |

The 390px-wide check rendered at 28.7 frames/second with a 218 × 472 canvas and passed the same effect and lifecycle checks. A simulated 3840 × 2160 hero stayed under the medium setting's 700,000-pixel budget. Reduced-motion and Save-Data checks each created zero WebGL contexts. These are local browser observations, not physical-phone measurements.

The homepage also stops requesting 42,668 uncompressed bytes of legacy hero, carousel, and homepage assets. Typography is preserved with 74,416 bytes of local WOFF2 files instead of external font requests.

Texture byte counts exclude mipmaps, the browser's default framebuffer, compositor memory, and driver overhead. Frame counts describe the tested browser, not guaranteed performance on every device. These checks do not replace a production network or real-device audit.

Changed files: `assets/kaleidoscope-hero.js` and its minified build control rendering and lifecycle; `assets/kaleidoscope-hero.css` supplies the static fallback; `assets/fonts.css` and `assets/fonts/` serve the existing typography locally; `assets/dh-transitions.min.js` compresses the unchanged transition behavior; `kaleidoscope-hero.php` registers deferred, cache-versioned assets. The site's child-theme `functions.php` controls legacy homepage asset loading.

## Sources

- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): smaller back buffers, static vertex arrays, asynchronous shader compilation, and resource cleanup.
- [web.dev reduced-motion guidance](https://web.dev/articles/prefers-reduced-motion): offer a static presentation when animation is unwanted.

Version 1.12.0 adds Morphing sculptures to the dedicated floating renderer and the complete renderer. GPU interpolation evaluates the two selected procedural surfaces per point during a transition. Seeded point identities, staggered quintic interpolation and matching endpoint surfaces avoid a dissolve or a visible reset at automatic cycle boundaries. Morphing and Floating shape slides can share the same compact engine. Morphing adds no textures, position buffers, libraries, targets, passes or scheduling loops; scene density, quality limits and visibility lifecycle remain shared. See MORPHING-SCULPTURES.md.

Version 1.13.0 adds bounded local mouse displacement to the particle vertex shader. Distance is measured after projection and forward mirror folding, with a compact smooth radius and optional outside influence. The original whole-sculpture mouse explosion is the default; local burst and hover forces use separate envelopes so attraction never accidentally drives the original global mouse explosion. A single pointer state is refreshed on input/scroll/resize and released on leave, blur and document hiding. The compositor's primary pointer sample is mapped on the CPU for full-screen mirrors/vortex. These effects add no per-point CPU state, simulation textures, render passes, model downloads or scheduling loops. GPU transform-feedback checks verified 5,013 distant points stayed unchanged at zero outside influence in the local test; both particle style families and the complete renderer were exercised. See PARTICLE-MOUSE.md.

Version 1.14.0 adds an admin-only template library stored in a non-autoloaded option. Saving, import/export and removal are capability/nonce checked; settings use the existing schema. The browser applies selected fields to the current editor and existing preview, with an undo snapshot, before the normal Save preset step. No template script, template data or new rendering asset is enqueued on frontend pages. See TEMPLATES.md.
