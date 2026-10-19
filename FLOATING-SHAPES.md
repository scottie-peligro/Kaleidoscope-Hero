# Floating particle shapes

Open a preset under **Kaleidoscope Hero**, then choose **Animation → Style → Floating shape**. A new **Floating shape** panel appears. Existing presets and pages keep their current settings until you select this style and save.

Choose Torus knot, Ring, Orb, Twisted ribbon, Helix, Star, Crystal or Seeded sculpture. The latter makes an organic surface whose silhouette changes with its seed. A seed is repeatable: use the same number to keep the same particle arrangement. Lobes change Star and Seeded sculpture; Twist changes Twisted ribbon and Seeded sculpture. Size and Floating motion control scale and bobbing. Flow speed controls automatic rotation, drift and sparkle; 0 freezes them.

**Explode with** offers:

- **Off:** keeps the shape assembled.
- **Mouse movement:** moving across the shape scatters it; it reforms when movement stops. Sensitivity controls how much movement is needed and Reform time controls its return.
- **Scroll:** scrolling past the section pulls it apart. Scroll back to rebuild it. Scroll distance sets how many viewport heights it takes to fully scatter.
- **Mouse and scroll:** uses both effects.

Explosion strength controls the distance particles travel. Strength 0 leaves the shape intact. The assembled surface is deterministic, so particles return to their original locations.

Try **Gold and blue** for gold, white and blue particles, or Neon/Violet for colorful light. Density controls particle count. Brightness, Glow and Bloom control the light. The example below uses the named preset as a starting point and overrides its animation settings:

```text
[kaleidoscope_hero preset="home" style="Floating shape" shape="Torus knot" palette="Gold and blue" shapetrigger="Mouse and scroll" shapeseed="17" lookrange="0" kaleidoscope="0"]
```

For a unique organic form:

```text
[kaleidoscope_hero preset="home" style="Floating shape" shape="Seeded sculpture" shapeseed="93" shapelobes="7" shapetwist="2.4" shapetrigger="Scroll" shapescrolldistance="0.75"]
```

The section block uses your chosen preset. You can also use `mode="background"` to place a shortcode behind ordinary section content. Scroll interaction needs a page with room to scroll. All three kaleidoscope modes and automatic vortex remain available.

Fixed floating scenes use a dedicated renderer of about 30 KB, or about 11 KB with gzip. It generates particles on the GPU, with no model/image downloads and no particle position uploads per frame. Density and the global quality setting control count: low/medium/high allow up to 6,000/16,000/26,000 particles before kaleidoscope copies. It uses the existing 30 FPS scheduling, adaptive resolution, offscreen/tab pausing and reduced-motion/Save-Data fallback. Random styles and mixed slideshows use the complete renderer, including the floating particle pass.

This version creates procedural shapes; variation comes from the shape, seed, lobes and twist controls.
