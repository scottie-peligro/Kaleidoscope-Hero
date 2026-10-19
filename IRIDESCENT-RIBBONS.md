# Iridescent ribbons

Choose **Animation → Style → Iridescent ribbons**. Broad translucent strips fold through space with angle-dependent color, reflective faces and polished edges. The **Iridescent ribbons** panel appears for this style.

## Controls

- **Ribbon count:** 1–5, default 3.
- **Ribbon width:** 0.3–2.5, default 1.1.
- **Folding:** 0–2, default 1. Changes the bends along each strip.
- **Ribbon twist:** 0–4, default 1.4. Turns the strip along its length.
- **Translucency:** 0.1–0.9, default 0.6. Higher values show more through the faces while keeping reflective rims.
- **Iridescence:** 0–2, default 1. Controls the changing surface colors. Zero uses the selected palette for the body.
- **Edge shine:** 0–3, default 1.4. Strengthens the bright edge highlights.
- **Cursor bend:** 0–2, default 1. Bends nearby surface areas toward the cursor and lifts them in depth. Zero disables this interaction. It works with Mouse look at zero.
- **Bend radius:** 0.1–1, default 0.45. Limits how far the cursor affects the ribbon.
- **Scroll response:** Off, Twist (default), Unwrap, or Twist and unwrap.
- **Scroll strength:** 0–2, default 1. Zero removes scroll deformation.
- **Ribbon scroll distance:** 0.25–4 screen heights, default 1.5. Distance from the section top needed to reach the full scroll response.

Scrolling down adds twist, unfolds the strip into a flatter band, or combines both. Scrolling back reverses the response. Unwrap reduces both the folding and the original twist. Twist and unwrap adds a new scroll-driven twist while unfolding the centerline.

Flow speed controls automatic floating/folding and color motion. Set Flow speed to zero to hold the automatic pose; cursor bending and scrolling continue to work. Mouse look remains a separate camera control. Leaving the scene releases the cursor deformation smoothly. Touch scrolling works without sticky hover bending.

## Combine and reuse

Palette, Multicolour, Brightness, Glow and Bloom adjust the lighting. Try Vapor for cyan/pink, Violet for purple, or Ice for a cooler look. Keep Warp at zero for crisp surfaces, or use mouse-hold warp for trails.

Tessellation repeats the ribbons into tiles. Whole screen kaleidoscope folds the completed ribbon image; Forward elements creates radial reflected ribbon copies; Both combines them. Automatic and edge vortex twist the rendered ribbons, and the cursor mapping follows the displayed transform. Tiled copies share the source ribbon deformation. Background gradients and page content stay untiled. Color blending works after bloom as with the other styles.

Scene Off removes the animation. Shortcodes, section backgrounds, slideshows and both template scopes carry the ribbon settings. Import templates on version 1.17.0 or newer.

```text
[kaleidoscope_hero preset="home" style="Iridescent ribbons" ribbonwidth="1.5" ribbonbend="1" ribbonscroll="Unwrap" ribbonscrolldistance="1"]
[kaleidoscope_hero preset="home" style="Iridescent ribbons" ribbonbend="0" ribbonscroll="Off" flow="0"]
```

## Rendering

Ribbon vertices and normals are generated on the GPU, without model, image or environment-map downloads or per-frame mesh uploads. Translucency and thin-film/reflection lighting are approximations; the surfaces do not ray trace background refraction. Folds in one strip can overlap, using the existing transparent scene compositing.

Fixed ribbons and mesh-only ribbon/particle slideshows use the smaller mesh renderer. Mixed ray-shader styles and random mode retain the full renderer. The existing viewport-sized long-section rendering, 30 fps cap, offscreen/hidden-tab pause, static reduced-motion/Save-Data fallback and GPU cleanup apply.

Quality controls grid detail. At default density/count, low/medium/high use about 7,500/17,700/33,100 submitted vertices per frame. With many ribbons and forward mirrors, the grid reduces to keep totals below 90,000/180,000/300,000 vertices. These are geometry budgets, not measured device frame-rate guarantees.
