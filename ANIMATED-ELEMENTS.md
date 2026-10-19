# Animated elements

Select a preset under Kaleidoscope Hero and choose Animation → Style. Scene offers Kaleidoscope and Off. Off removes the animation and retains the section background and content.

Digital fabric uses broad transparent wave sheets with a faint weave and fold highlights. Blueprint city builds wireframe architecture as it approaches.

**Iridescent ribbons** uses broad translucent ribbon surfaces with shifting thin-film colors, reflective faces and bright edges. The dedicated panel controls count, width, folding, twist, transparency, iridescence, shine, cursor bending and scroll response. Scroll can twist or unwrap the ribbons, and reversing the scroll reverses the deformation. Cursor bend works with Mouse look 0; both interactions work with Flow speed 0. See [Iridescent ribbons](IRIDESCENT-RIBBONS.md).

**Floating shape** builds a softly rotating particle sculpture: Torus knot, Ring, Orb, Twisted ribbon, Helix, Star, Crystal or Seeded sculpture. Mouse movement scatters it and then lets it reform; scroll can pull it apart and reverse scrolling rebuilds it. Choose either input, both, or Off. Seed, lobes, twist, size, float, strength, sensitivity and recovery are configurable. See [Floating shapes](FLOATING-SHAPES.md) for instructions and shortcode examples.

**LED globe** places the viewer inside a curved LED surface. Choose its LED globe pattern: Cycle, Fireworks, Waves or Shapes. Cycle fades between the three shows. Fireworks includes rising trails, expanding spokes and fading sparks; Shapes includes rotating stars, polygons and rings. Density adjusts LED spacing, Flow speed animates the patterns, and Palette/Multicolour/Glow/Brightness control their light.

**Digital disco ball** places a sphere of round mirror tiles in the center, with colorful silver reflections, sharp white star glints and sparkle. Colored rays radiate behind the ball; soft wall lights and defocused reflections surround it. Ball facets and wall spots share the same rotation and reflection directions. Density adjusts mirror-tile size, Flow speed controls rotation speed, and Glow increases sparkle and ray intensity. The palette and brightness controls change the lighting. For purple/pink lighting choose Neon or Violet; Vapor adds cyan. Set Warp to 0 for crisp mirror tiles, or increase it for light trails. This is a procedural reflection effect, rather than ray tracing.

Under Interaction, **Mouse controls disco rotation** is enabled by default for this style. The pointer to the left of the ball turns it left, and to the right turns it right. Moving farther from its center increases the speed; the center eases it to a stop. Leaving the scene returns to automatic rotation. This works with Mouse look at 0. Disable the option for continuous automatic rotation. Flow speed at 0 stops the ball.

Growing circuits was removed in 1.10.0. Old saved references fall back to the standard Digital grid style.

Dot matrix structures mixes rectangles, wedges, L shapes, skewed blocks and faceted solids. Each object has its own seeded travel speed and rotation speed/direction across three axes. A fixed light gives different faces different shades, changing as the object spins. Flow speed controls both travel and spin; zero stops them. Density adjusts the number of objects.

Suggested palettes: Neon or Vapor for fabric and the light shows, Electric blue for Blueprint city, and Cyan or Ice for dotted forms. Mirrors at 0 show the original composition; 2–12 mirror it.

```text
[kaleidoscope_hero preset="home" style="LED globe" ledpattern="Fireworks" palette="Neon" multicolor="0.7" kaleidoscope="0"]
[kaleidoscope_hero preset="home" style="Digital disco ball" palette="Neon" density="0.7" kaleidoscope="0"]
```

## Kaleidoscope modes

Animation → Kaleidoscope mode provides three choices, all using the same mirror count:

- **Forward elements:** preserves the existing additive mirrored scene rays and the original forward scene.
- **Whole screen:** mirrors the complete rendered animation across the screen, including nearby and outer elements.
- **Both:** combines forward mirrors with whole-screen mirrors.

Set mirrors to 2–12. Zero or one bypasses both modes. Existing presets default to Forward elements until you choose another mode. Text and navigation remain ordinary page content.

## Automatic vortex

Under Interaction, enable **Automatic vortex** to start the full-animation twist as soon as the visible animation loads. Adjust strength, speed, direction (Clockwise or Counterclockwise), and startup time. Zero startup time begins immediately; a longer value builds strength gradually. Strength 0 removes the twist/rotation. Speed 0 holds a static twist. Turning the option off eases the animation back to neutral.

The automatic vortex works with Mouse look at 0, Flow speed at 0, every animated style and every kaleidoscope mode. Edge vortex retains its separate mouse-edge behavior. Automatic vortex defaults to off. Offscreen/hidden-tab pausing and reduced-motion/Save-Data fallback still apply.

```text
[kaleidoscope_hero preset="home" kaleidoscope="6" kaleidoscopemode="Whole screen" autovortex="true" autovortexstrength="0.5" autovortexspeed="0.6" autovortexdirection="Clockwise" autovortexramp="2"]
```

```text
[kaleidoscope_hero preset="home" style="Dot matrix structures" palette="Cyan" density="0.7" flow="2" kaleidoscope="0"]
```

Use mode="background" inside a Group or section to place the animation behind ordinary content. Background darkness controls its contrast. Mouse look at 0 disables camera following.

Effects are procedural WebGL art with adaptive resolution and a target of 30 FPS. Offscreen/hidden instances pause; reduced-motion and Save-Data visitors receive the static background. Digital fabric is an artistic surface rather than a physical cloth simulation.

Fixed disco scenes and disco-only slideshows download **assets/dh-disco.min.js**, a dedicated renderer of about 32 KB (about 12 KB with gzip). Only disco's reachable shader functions compile; unused noise and word samplers/textures are omitted. The floating renderer/shaders are excluded from the disco bundle. Hidden backdrop calculations are skipped behind the ball. Random style mode and mixed-style slideshows retain the full renderer and normal fade transitions. Mixed pages can use renderer versions independently. Existing rendering quality, pausing and reduced-motion/Save-Data behavior are retained.

The readable shaders are assets/dh-particle-waves.glsl (filtered wave points), assets/dh-digital-structures.glsl (surfaces/structures), assets/dh-light-shows.glsl (LED and disco lighting), assets/dh-floating.vert/.frag (particle shapes) and assets/dh-post.glsl (whole-screen effects). Integrate changes with `node tools/prepare-digital-structures.cjs` from the site directory; this also generates specialized disco and floating renderers. Regenerate kaleidoscope-hero.min.js, dh-disco.min.js and dh-floating.min.js after renderer/shader changes, and dh-scenes.min.js after loader changes. The light shows add no textures, particle objects, libraries or render passes. Floating shape substitutes one instanced point draw for the existing scene draw, reusing its compositor and render target. Whole-screen mirrors and automatic vortex reuse the existing composite pass and texture, adding no render targets, downloads or animation loops. Version 1.8.0 removed the experimental water feature and its renderer dependencies.

**Morphing sculptures** transforms the same points between eight procedural surfaces. Cycle all shapes, alternate a selected pair, use scroll with reversal, or choose a manual blend. Duration, hold, particle stagger and optional explosion are adjustable. Its small renderer is shared with Floating shape. See [Morphing sculptures](MORPHING-SCULPTURES.md).

Local explosion, cursor attraction and repulsion are available in the shared Sculpture panel. Radius, force strength and Outside influence control whether nearby points or the whole sculpture respond. See [Local particle mouse effects](PARTICLE-MOUSE.md).
