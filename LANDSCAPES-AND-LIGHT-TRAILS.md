# Landscapes, tunnel runners and night skylines

Choose a preset under Kaleidoscope Hero and select Animation → Style. All three effects use procedural GPU rendering, with no image, video, model or additional library download. Existing presets remain unchanged.

## Wireframe tunnel

Bright particles travel along the longitudinal wires toward you, with smaller runners around selected cross rings. Each lane has its own repeatable phase and speed. Light tails stay on the wire behind the moving head. The Wireframe tunnel panel offers Particle speed, Light tail length and Active particle lanes. Lanes 0 removes the runners; Flow speed 0 freezes tunnel travel and particles. Density changes wire spacing; Glow and Bloom control the light's softness. Try low Warp for a crisp head and tail.

## Wireframe landscape

The new style places the camera above a continuous moving heightfield. Mixed landscape changes between broad flat deserts, hills and mountain ridges as you travel. You can also select Hills, Mountains or Desert alone. Terrain height 0 gives a flat ground grid; Landform scale changes the size of features, and Grid spacing detail changes the wire spacing. Retro horizon sun adds an optional striped sun, occluded by the land. Flow controls forward travel and 0 stops it. Try Neon, Multicolour 0, Bloom 0.2, Warp 0 and a nearly black purple background for the reference's retro look.

## Blueprint City → Night skyline

Keep Style at Blueprint city and choose City appearance → Night skyline. Buildings become opaque dark facades with scattered rectangular white windows, with subtle warm/cool variation and shaded sides. Nearby facades hide those behind them. Lit windows controls occupancy, from all dark to fully occupied. The original Blueprint appearance remains the default, including its growing wireframe buildings.

To approach the supplied night-city reference: Night skyline, Mono or Ice palette, Multicolour 0, Glow 0.3, Bloom 0.15–0.3, Warp 0, Mirrors 0 and black background colors. Increase Density for a denser skyline. This is generated architecture, not a photographic city image.

```text
[kaleidoscope_hero preset="home" style="Wireframe tunnel" trailspeed="1.3" traillength="1.5" trailamount="0.85"]
[kaleidoscope_hero preset="home" style="Wireframe landscape" terraintype="Mixed landscape" terrainheight="1" terrainsun="yes" palette="Neon" warp="0" bloom="0.2"]
[kaleidoscope_hero preset="home" style="Blueprint city" cityappearance="Night skyline" citywindows="0.35" palette="Mono" multicolor="0" warp="0" bloom="0.2" bgcolor1="#000000" bgcolor2="#000000"]
```

All controls are included in look/full templates and support shortcode overrides. Kaleidoscope, tessellation, vortex, opacity and color blending remain available. Scene Off and reduced-motion/Save-Data fallback use the existing static background; long sections retain the viewport-sized render and pixel caps. Terrain ray sampling adds GPU work; it does not create a page-height texture or extra rendering pass.
