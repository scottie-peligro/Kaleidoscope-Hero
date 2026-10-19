# Kaleidoscope Hero

WordPress plugin for animated WebGL heroes and section backgrounds. Current version: **1.15.1**.

Includes 16 animated styles, saved presets, shortcodes, a native section block, slideshows, kaleidoscope/vortex controls, page transitions and floating particle sculptures. Long sections render a viewport-sized background within a bounded pixel budget. Version 1.14.0 adds reusable look/full-setting templates, preview/undo, and portable JSON import/export. Local particle explosions and cursor forces remain available. Morphing sculptures retain automatic, scroll and manual control. Stable long-page scrolling and filtered Particle Waves remain included.

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
