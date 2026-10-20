# Kaleidoscope Hero

WordPress plugin for animated WebGL heroes and section backgrounds. Current version: **1.19.0**.

Includes 18 animated styles, saved presets, shortcodes, a native section block, slideshows, kaleidoscope/vortex controls, page transitions and floating particle sculptures. Long sections render a viewport-sized background within a bounded pixel budget. Version 1.14.0 adds reusable look/full-setting templates, preview/undo, and portable JSON import/export. Local particle explosions and cursor forces remain available. Morphing sculptures retain automatic, scroll and manual control. Stable long-page scrolling and filtered Particle Waves remain included.

## Install

Copy this directory to `wp-content/plugins/kaleidoscope-hero`, then activate Kaleidoscope Hero in WordPress. For an update, replace the plugin files; saved presets and global settings remain in WordPress. Requires WordPress 5.8+, PHP 7.4+, and WebGL 2 for animation. Reduced motion, Save-Data and unsupported browsers use the static background.

See [readme.txt](readme.txt), [Section backgrounds](SECTION-BACKGROUNDS.md), [Animated elements](ANIMATED-ELEMENTS.md), [Floating shapes](FLOATING-SHAPES.md), [Morphing sculptures](MORPHING-SCULPTURES.md), [Particle mouse effects](PARTICLE-MOUSE.md), [Reusable templates](TEMPLATES.md) and [Performance](PERFORMANCE.md).

## Build

Readable JavaScript, GLSL sources and production minified assets are included. After editing shared renderer/shader sources, run from this repository:

```sh
node tools/prepare-digital-structures.cjs
npx --yes --package=terser@5.44.0 terser assets/kaleidoscope-hero.js --compress --mangle --comments '/^!/' --output assets/kaleidoscope-hero.min.js
npx --yes --package=terser@5.44.0 terser assets/dh-disco.js --compress --mangle --comments '/^!/' --output assets/dh-disco.min.js
npx --yes --package=terser@5.44.0 terser assets/dh-floating.js --compress --mangle --comments '/^!/' --output assets/dh-floating.min.js
```

Other changed runtime scripts should likewise have their adjacent `.min.js` regenerated. WordPress normally serves the minified builds and uses file modification times to invalidate caches. No Node dependencies are needed at runtime.

## License

GPL-2.0-or-later. Bundled font licenses are in `assets/fonts/`.

## Color blending

Version 1.15.0 adds fifteen optional blend modes, a blend color and strength slider. Mix the color over the finished animation after bloom; Multiply colors white highlights. Defaults preserve existing looks. The controls work in every renderer and portable templates, with no extra render pass or assets. See [COLOR-BLENDING.md](COLOR-BLENDING.md).

Version 1.15.1 adds Background gradient as a blend source, using the existing two background colors, gradient type and angle to blend the elements while preserving empty background areas. Existing separate-color blends retain their look.

Version 1.15.2 keeps Save preset and Save settings in a fixed footer, with WordPress sidebar and mobile sizing and reserved space below the final controls. The responsive preview stays in normal flow on narrow screens.

## Tessellation

Version 1.16.0 adds Squares, Mirrored squares, Triangles and Hexagons with repeat density, tile zoom and pattern rotation. It works with kaleidoscope/vortex/bloom/blending and particle mouse effects in all renderers. Background gradient and text stay untiled; Off preserves existing looks. Portable templates include the controls. No extra geometry or render pass. See [TESSELLATION.md](TESSELLATION.md).

## Iridescent ribbons

Version 1.17.0 adds broad translucent ribbon surfaces with changing thin-film colors, shiny edges, cursor bending and reversible scroll twist/unwrap. Dedicated controls cover geometry, material and input strength/radius. It shares the compact mesh renderer, with no model/image downloads; total mesh detail is capped for high mirror counts. Works with tessellation, kaleidoscope, vortex, blending, presets and templates. See [IRIDESCENT-RIBBONS.md](IRIDESCENT-RIBBONS.md).

Version 1.17.1 removes unintended frame reflections during vortex rotation. Artwork beyond the captured source fades into the background, including bloom/warp, and mouse mapping follows the unwrapped coordinates. Intentional kaleidoscope/tessellation transforms remain available.

## Landscapes and light trails

Version 1.18.0 adds moving wireframe terrain with mixed landscapes, hills, mountains and desert, plus an optional striped sun. Wireframe tunnel now has independently timed racing particles with configurable light tails. Blueprint City offers Night skyline: opaque dark buildings and scattered white windows. Existing blueprint appearance is preserved. Controls work in portable templates and shortcodes. See [Landscapes and light trails](LANDSCAPES-AND-LIGHT-TRAILS.md).

Version 1.18.1 replaces terrain ray tracing with a continuous depth-tested GPU mesh, rounds the mountain ridges and fixes shared height-cell discontinuities. Soft footprint filtering reduces grid shimmer; world-anchored mesh rows recycle continuously. Existing settings are preserved. See the performance notes for bounded geometry and buffer costs.

## Preset editor

Version 1.19.0 organizes the admin into Element, Appearance, Interaction, Text & links, and Placement. Element choices are grouped; only relevant controls appear. Optional effects and templates use expandable sections, with active-state summaries. The preview is collapsible and starts closed on phones. Keyboard tabs, validation reveal, unsaved-state feedback and the fixed Save footer keep editing manageable. All settings and saved looks are preserved; no frontend renderer assets were changed. See [Admin settings](ADMIN-SETTINGS.md).
