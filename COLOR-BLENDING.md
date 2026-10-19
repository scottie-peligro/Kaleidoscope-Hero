# Color blending

In a preset editor, open **Color blending**. This mixes a chosen color over the finished animation and its background gradient, after bloom, warp, mirrors and vortex. It affects the canvas; headings, links and surrounding page content retain their colors.

- **Blend mode:** Off (the default), Multiply, Screen, Overlay, Darken, Lighten, Color dodge, Color burn, Hard light, Soft light, Difference, Exclusion, Hue, Saturation, Color or Luminosity.
- **Blend color:** the source color layer. Violet (`#8866ff`) is the initial color. Change it to explore different looks.
- **Blend strength:** 0–1. Zero restores the original image; 1 applies the full blend. Intermediate values mix the original and blended results.

For bright white bloom, try **Multiply**, a saturated violet or cyan, and strength **0.7–1**. White highlights take the chosen color and darker areas stay dark. White as the blend color leaves Multiply unchanged; black makes the image black at full strength.

**Color** applies the chosen hue and saturation while preserving the animation's luminosity. Pure white remains white with Color; use Multiply to color white highlights. **Luminosity** transfers the chosen color's luminosity while retaining the animation's hue and saturation. Screen lightens, Overlay/Soft light adjust contrast, and Difference/Exclusion produce inverted color combinations.

These are color grading controls, not CSS blending against other page elements or photos. Background darkness and the vignette remain separate overlays. Scene Off and reduced-motion/Save-Data fallbacks keep the existing static gradient.

## Reuse

The fields belong to each preset, work in slideshows and random style mode, and are included in both Look only and Full settings templates. Template export/import carries them to another website running version 1.15.0 or newer. Older versions ignore unknown fields.

```text
[kaleidoscope_hero preset="home" blendmode="Multiply" blendcolor="#22bbff" blendamount="0.8"]
[kaleidoscope_hero preset="home" blendmode="Off"]
```

## Rendering

All three renderers share the same compositor. The blend functions follow the [W3C Compositing and Blending specification](https://www.w3.org/TR/compositing-1/#blending), including the luminosity/saturation clipping rules for Hue, Saturation, Color and Luminosity. Colors are mixed in the renderer's existing display RGB space.

Blending runs inside the existing final shader pass. It introduces no images, downloads, textures, extra render targets or extra draw calls. Off skips the blend math; legacy presets default to Off without rewriting saved options.
