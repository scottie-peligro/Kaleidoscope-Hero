# Local particle mouse effects

Available for **Floating shape** and **Morphing sculptures**, under the shared **Sculpture** panel. Existing presets keep **Whole sculpture explosion** unless you select another mouse effect.

## Mouse particle effect

| Option | Behavior |
| --- | --- |
| Whole sculpture explosion | Original behavior: moving the mouse scatters the whole sculpture when the mouse explosion input is enabled. Morphing sculptures also requires Also allow explosion. |
| Local explosion | Mouse movement scatters points near the cursor. The Explode with setting must include mouse movement. This local option works without enabling whole-sculpture explosion on Morphing sculptures. |
| Attract | Nearby points pull toward the cursor while hovering. Replaces the movement-triggered explosion. |
| Repel | Nearby points move away from the cursor while hovering. Replaces the movement-triggered explosion. |
| Off | Disables the mouse particle effect. Independently enabled scroll explosion can still run. |

**Mouse influence radius** controls the affected area, measured as a fraction of the visible canvas's shorter side. A useful starting point is 0.12–0.2. The falloff is smooth and reaches zero at the radius boundary.

**Outside influence** controls the rest of the sculpture. At 0, points outside the radius receive no mouse displacement. Increasing it brings those points along at reduced strength; 1 gives all points full influence. Existing rotation, morphing and camera movement continue separately from the mouse force.

**Mouse force strength** controls Attract and Repel; 0 disables that force. Local explosion instead uses **Explosion strength** and **Mouse sensitivity**. **Reform time** controls how quickly the mouse displacement relaxes after leaving. Attract and Repel work while the mouse is still, and with Flow speed at 0. Set **Mouse look to 0** when you want the camera to remain still while particles react.

Mouse effects and scroll explosion are separate. To use only the local mouse explosion, choose **Explode with → Mouse movement**. For attraction or repulsion without any scroll explosion, set Explode with to Off; these hover forces still work. On Morphing sculptures, leave Also allow explosion disabled to suppress whole-sculpture explosion while retaining local effects.

## Examples

```text
[kaleidoscope_hero preset="home" style="Morphing sculptures" shapemouseeffect="Local explosion" shapemouseradius="0.15" shapemouseglobal="0" shapetrigger="Mouse movement" lookrange="0"]

[kaleidoscope_hero preset="home" style="Morphing sculptures" shapemouseeffect="Attract" shapemouseradius="0.18" shapemousestrength="1.5" shapemouseglobal="0" shapetrigger="Off" lookrange="0"]

[kaleidoscope_hero preset="home" style="Floating shape" shapemouseeffect="Attract" shapemouseradius="0.12" shapemousestrength="1" shapemouseglobal="0.35" shapetrigger="Off" lookrange="0"]
```

## Rendering and interaction

Forces are calculated on the GPU from each point's projected position. This adds no model downloads, particle uploads, simulation textures, extra render targets or extra render passes. Points retain their identities and return to their current unforced shape as the effect relaxes. This is a bounded displacement field, rather than an accumulating physics simulation.

Pointer coordinates follow the actual canvas, including viewport-sized long backgrounds and section transforms. Forward kaleidoscope copies use their own projected positions. Whole-screen mirrors and automatic vortex map the pointer through the compositor's primary sample, so mirrored copies repeat the interaction. Warp and bloom can soften or repeat its visual trail. Hover forces use mouse/pen input; touch retains the existing movement explosion behavior where enabled. Leaving the scene, losing window focus or hiding the document releases the hover force.
