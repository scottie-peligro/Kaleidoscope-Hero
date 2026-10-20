=== Kaleidoscope Hero ===
Contributors: nextlevelexchange
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.21.0
License: GPLv2 or later

Animated WebGL hero backgrounds with admin presets, per-page shortcodes, slideshows and seamless black-wipe page transitions.

== Installation ==

1. In WordPress go to Plugins > Add New > Upload Plugin and upload kaleidoscope-hero.zip, then Activate.
2. Open the new "Kaleidoscope Hero" menu. Edit the "Home" preset or add new presets; the live preview updates as you change settings.
3. Copy a preset's shortcode, e.g. [kaleidoscope_hero preset="home"], and paste it into a full-width, zero-padding container at the top of a page.

== Shortcodes ==

[kaleidoscope_hero preset="home"]
[kaleidoscope_hero presets="home,ocean,rings" interval="20"]   (slideshow, fades between presets)
[kaleidoscope_hero preset="work" height="60vh" opacity="0.5" overlay="no"]   (per-page overrides)
[kaleidoscope_hero preset="work"]Your own content[/kaleidoscope_hero]   (replaces the built-in text)

== Transitions ==

Hero links use the black wipe automatically. Add the class dh-transition to any other link, or switch "Black wipe on" to "All internal links" under Kaleidoscope Hero > Transitions & performance. Use data-dh-dir="left" for a wipe from the left.

== Requirements ==

WebGL 2 (all current desktop and mobile browsers). Older browsers show a static gradient in the background colours.

== Landscapes and light trails ==

1.19.1 gives Mountains distinct elevated ranges and deeper valleys instead of low plateaus. The world-anchored flight valley keeps the camera clear of the taller landforms. Terrain height still controls relief and 0 remains flat; no new assets, geometry or render passes are added.

1.18.1 fixes broken/flickering landscape ridges with a continuous depth-tested terrain mesh, rounded landforms, stable shared noise cells and softly filtered grid lines. Saved landscape controls remain supported.

Wireframe tunnel now has independently timed racing particles and light tails, with speed, tail length and active-lane controls. New Wireframe landscape travels across mixed terrain, hills, mountains or desert, with height/scale/grid controls and an optional striped horizon sun. Blueprint city's optional Night skyline appearance uses dark opaque buildings and scattered white windows; Blueprint remains the default. All support presets, templates and shortcode overrides. See LANDSCAPES-AND-LIGHT-TRAILS.md.

== Custom 3D objects and SVG extrusion ==

1.21.0 adds selective random cycles: element type, element colors, all kaleidoscope settings, speeds, finish and gradient backgrounds. Choose Light, Dark or Both for background tones. Unchecked groups retain the saved look. Appearance > Kaleidoscope mirrors now offers Full screen or Centered framing for Whole screen / Both modes. New controls work with templates and shortcode overrides; existing saved settings are preserved.

1.20.0 adds Custom 3D Object under Element. Upload a self-contained GLB or raise an SVG logo with depth and bevel controls. Display solid surfaces, wireframe or interactive particles; adjust rotation, orientation, floating and colors. Works with existing effects, presets, templates and shortcodes. Includes a tiny sample crystal and a vector badge. Model files and their importer load only for visible custom-object sections. See CUSTOM-3D-OBJECTS.md for supported formats, limits and SVG preparation.

== Settings editor ==

Preset controls are now organized into Element, Appearance, Interaction, Text & links, and Placement. Related elements are grouped in the element menu. Only relevant controls appear; optional effects are expandable with active-state labels. Templates sit under Apply or save a template. The preview is collapsible and starts closed on phones. Every setting and saved look is retained. See ADMIN-SETTINGS.md.

Save preset and Save settings stay visible in a fixed footer while you scroll. The footer adapts to the WordPress menu and mobile screens; space below the form keeps the final controls accessible.

== Tessellation ==

The Tessellation panel repeats animated elements in Squares, Mirrored squares, Triangles or Hexagons. Adjust repeat density, tile zoom and rotation. Combine with kaleidoscope, vortex and blending; gradient and text remain untiled. Particle mouse effects follow transformed points across the repeated copies. Defaults to Off. Works in all renderers, presets, shortcodes and templates. See TESSELLATION.md.

== Iridescent ribbons ==

Choose Animation > Style > Iridescent ribbons for broad translucent strips with changing color, shiny faces and bright edges. Cursor bend deforms nearby surfaces; scrolling can twist, unwrap, or combine both, with reversible progress. Adjust count, width, folds, twist, translucency, iridescence, edge shine, bend radius and scroll strength/distance. Cursor bend 0 and Scroll response Off disable those interactions. Works with Flow speed 0, tessellation, kaleidoscope, vortex, blending and templates. GPU-generated surfaces use the smaller mesh renderer for fixed scenes, with no model or image downloads. See IRIDESCENT-RIBBONS.md.

== Color blending ==

Color blending adds Multiply, Screen, Overlay, Color, Luminosity and other standard blend modes, with a color picker and strength slider. Blend source > Background gradient blends the elements using the existing background colors, type and angle while preserving empty background areas. The chosen color blends over the finished animation after bloom. Multiply tints white highlights; Color preserves luminosity. Text retains its colors. Off is the default. Works across every renderer, shortcodes and portable templates. See COLOR-BLENDING.md for examples.

== Digital structures ==

Animation > Style includes Digital fabric, Blueprint city, Dot matrix structures, LED globe and Digital disco ball. LED globe offers Cycle, Fireworks, Waves and Shapes patterns. Use them with the Kaleidoscope scene. Density and Flow speed control detail and motion. Scene > Off removes the effect. See ANIMATED-ELEMENTS.md for examples and controls.

Animation > Kaleidoscope mode offers Forward elements, Whole screen, and Both. Set mirrors to 2 or more. Interaction > Automatic vortex starts a full-animation twist on load, with strength, speed, direction and startup controls. Transformed artwork now fades beyond the captured frame instead of reflecting back as duplicate designs. Deliberate kaleidoscope folds and tessellation remain available.

1.19.2 fits the Whole screen kaleidoscope source wedge to the viewport diagonal so mirrored artwork reaches the sides and corners, including wide and portrait layouts. Both uses the same fit. Cursor interactions follow the corrected mapping. Vortex alone still exits the frame without reflected duplicates. No additional rendering passes, assets or settings are needed.

Digital disco ball uses round mirror tiles, colorful silver reflections, white star glints, soft wall lights and radial light rays. Interaction > Mouse controls disco rotation turns it toward the pointer, slows it at the center and returns to automatic rotation outside the scene. This works with Mouse look at 0. Disable the option for continuous automatic rotation; Flow speed controls rotation speed, and Glow increases sparkle and rays. Choose Neon or Violet for purple/pink lighting; Warp at 0 keeps the tiles crisp.

Fixed disco scenes load a smaller dedicated renderer, without the other effects or unused noise textures. Mixed-style slideshows and random style mode use the complete renderer. Both versions retain the existing quality controls, offscreen pausing and static fallback for reduced motion/Save-Data.

== Floating particle shapes ==

Choose Animation > Style > Floating shape. The Sculpture panel offers Torus knot, Ring, Orb, Twisted ribbon, Helix, Star, Crystal and Seeded sculpture. Change seed, lobes and twist to create variations. Set Explode with to Off, Mouse movement, Scroll, or Mouse and scroll. Particles reform after mouse movement stops; scrolling back rebuilds the shape. Strength, sensitivity, reform time, scroll distance, size and floating motion are adjustable. Flow speed 0 freezes automatic drift and rotation. Gold and blue is a new palette inspired by the particle reference.

Floating shape and Morphing sculptures share a dedicated particle renderer. Particles are generated on the GPU without model/image downloads or per-frame particle uploads. It shares existing quality budgets, kaleidoscope/vortex controls, background mode and motion preferences. See FLOATING-SHAPES.md for setup and shortcode examples.

== Long-page sharpness ==

Long backgrounds render a viewport-sized area as you scroll, instead of stretching a low-resolution canvas across the entire page. This keeps the existing pixel budget concentrated on what is visible. Sections taller than 1.6 viewport heights use this automatically; shorter sections keep their existing composition. Content stays in document flow, and background/section scroll motion and mouse interactions continue to work.

Scrolling is independent of the scene's 30 FPS rendering: supported browsers pin a dedicated viewport stage using their scroll timeline, with an immediate scroll-event fallback for sticky/fixed containers or unsupported browsers. Particle Waves uses more accurate surface intersections, pixel-aware point filtering and gentler twinkling to reduce flicker.

== Morphing sculptures ==

Choose Animation > Style > Morphing sculptures. Cycle through all eight procedural shapes, move back and forth between a selected pair, transform with scroll, or hold a manual blend. Adjust duration, hold time and particle stagger. The shared Sculpture panel controls size, seed, float, lobes and twist. Optional explosion is disabled by default. Flow 0 pauses automatic motion while scroll/manual morphing remains available. See MORPHING-SCULPTURES.md for controls and shortcode examples.

== Local particle mouse effects ==

Floating shape and Morphing sculptures now offer Whole sculpture explosion, Local explosion, Attract, Repel and Off under Sculpture > Mouse particle effect. Adjust Mouse influence radius, Mouse force strength and Outside influence. Outside influence 0 limits the mouse response to nearby points; higher values bring the rest along. Attract/Repel follow hovering and replace the mouse movement explosion. Scroll explosion remains separately configurable. See PARTICLE-MOUSE.md for examples and controls.

== Reusable templates ==

Save current preset controls as a named template, including unsaved edits. Choose Look only to preserve destination content/layout, or Full settings to include them. Apply to preview, Undo apply if needed, then Save preset. The Templates tab exports/imports JSON files for other websites. Import adds copies and never changes presets automatically. Template actions require administrator permissions and valid nonces. See TEMPLATES.md.
