# Morphing sculptures

In a preset, select **Animation → Style → Morphing sculptures**. The sculpture's particles travel between procedural surfaces, retaining their identities through each transition. This is a geometric transformation, not a crossfade. Eight forms are available: Torus knot, Ring, Orb, Twisted ribbon, Helix, Star, Crystal and Seeded sculpture. This version uses particle surfaces; custom logo/model/text targets are not included.

## Controls

The **Morphing sculptures** panel offers four control modes:

- **Cycle shapes** visits all eight forms, starting with From shape, then repeats. To shape is hidden in this mode.
- **Back and forth** alternates between From shape and To shape.
- **Scroll** maps downward scrolling from the section's document top to the selected pair. Scrolling back reverses the transformation. Morph scroll distance sets the distance in viewport heights; this mode also works with Flow speed at 0.
- **Manual** holds Morph progress: 0 is From shape, 1 is To shape, and values between them create intermediate sculptures. Slider changes ease into place.

Morph duration and Hold each shape control automatic modes. Their seconds are measured at Flow speed 2.5; a higher Flow speed accelerates morphing and rotation. Flow 0 pauses automatic morphing and rotation. Particle stagger lets different points start at different times, with smooth, exact endpoints at every setting. Set it to 0 for coordinated movement.

The shared **Sculpture** panel controls size, floating motion, seed, lobes and twist. The seed gives repeatable point arrangements and changes Seeded sculpture's surface. Lobes changes Star and Seeded sculpture; twist changes Twisted ribbon and Seeded sculpture. The original Floating shape style also uses this panel.

**Also allow explosion** is off by default. Turn it on to expose the existing explosion input, strength, sensitivity, reform time and distance settings. Morphing itself requires no explosion interaction. Mouse look, palettes, density, glow, brightness, background mode, kaleidoscope modes and automatic vortex remain available. Scene → Off removes the animation and retains the still background/content.

## Shortcodes

Use a preset or override its settings:

```text
[kaleidoscope_hero preset="home" style="Morphing sculptures" morphmode="Back and forth" morphfrom="Orb" morphto="Torus knot" morphduration="4" morphhold="1" palette="Gold and blue"]

[kaleidoscope_hero preset="work" style="Morphing sculptures" mode="background" morphmode="Scroll" morphfrom="Orb" morphto="Crystal" morphscrolldistance="1.5" flow="0"]

[kaleidoscope_hero style="Morphing sculptures" morphmode="Manual" morphfrom="Ring" morphto="Star" morphprogress="0.5" morphexplode="no"]
```

## Performance

Morphing shares the small Floating shape renderer. Fixed scenes and slideshows containing only these two styles load that renderer; mixed effects and randomized styles use the complete renderer. Geometry and interpolation are calculated on the GPU. There are no model/image downloads, per-frame point uploads, additional render targets or additional animation loops. During a transition, each point evaluates two procedural shapes, so morphing has additional geometry work compared with holding one shape. Existing density/quality limits, visibility pausing, long-section canvas placement, reduced-motion and Save-Data fallbacks still apply.
