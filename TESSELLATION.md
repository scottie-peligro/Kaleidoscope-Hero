# Tessellation

Open a preset and use the **Tessellation** panel. It repeats the animated elements into geometric cells across the screen. The background gradient, built-in text and page content stay untiled.

- **Tiling pattern:** Off, Squares, Mirrored squares, Triangles or Hexagons. Mirrored squares alternates reflections between neighboring cells. Triangles uses an equilateral lattice with reflected triangle pairs; Hexagons uses a staggered honeycomb lattice.
- **Repeat density:** 1–8, default 3. Higher values create more, smaller tiles. This is a scale, not an exact total tile count; the visible count depends on aspect ratio and pattern.
- **Tile zoom:** 0.5–2, default 1. Enlarges or reduces the motif inside each cell without changing cell spacing. Each cell samples the central area of the original scene, keeping proportions intact. Lower zoom shows more of the original scene.
- **Pattern rotation:** 0–360 degrees. Turns the tiling grid and motifs.

Start with Mirrored squares, density 2–3 and zoom 1. Try Hexagons with a Floating shape or Morphing sculpture for a honeycomb of repeated forms. Squares, triangles and hexagons can show intentional cell boundaries, especially with complex scenes. Mirrored squares gives the smoothest reflected joins.

Tessellation works independently of kaleidoscope. You can also combine it with any kaleidoscope mode, automatic/edge vortex, bloom, warp and color blending. Forward-element mirrors happen in the original scene; tessellation repeats it; whole-screen mirrors and automatic vortex are then applied inside each tile. The background gradient keeps its original screen coordinates, including when used as a blend source.

For particle sculptures, local mouse attraction, repulsion and explosion follow the transformed visible points. The repeated copies share the same underlying sculpture and interaction state, so corresponding points in other tiles respond together. Camera following, whole-sculpture explosion and scroll morphing remain shared as well. This is a tiled image effect, not separate 3D objects in each tile.

## Reuse

Settings work in presets, slideshows, section backgrounds and shortcodes. Both Look only and Full settings templates include them. Transfer to sites running 1.16.0 or newer; older versions ignore unsupported fields. Off is the default and preserves the prior scene.

```text
[kaleidoscope_hero preset="home" tessellation="Hexagons" tessellationdensity="3" tessellationzoom="0.8" tessellationrotation="30"]
[kaleidoscope_hero preset="home" tessellation="Mirrored squares" kaleidoscope="4" kaleidoscopemode="Whole screen"]
[kaleidoscope_hero preset="home" tessellation="Off"]
```

## Rendering

All renderers use the same final compositor. The effect adds coordinate math within the existing pass; it does not create extra particles, meshes, images, draw calls or render targets. Dense tiles reuse the existing mip levels to filter the smaller motifs. Rendering quality still follows the existing resolution and frame budgets. Scene Off and reduced-motion/Save-Data use the existing untiled static gradient.
