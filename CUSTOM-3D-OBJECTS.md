# Custom 3D objects and raised SVG logos

In a preset, choose **Element → Animated element → Custom 3D Object**. Choose the source:

- **3D model (GLB)**: Upload GLB, choose a previously uploaded model from the Media library, or paste a model URL. Leave it blank for the included 3.6 KB faceted crystal. Self-contained glTF 2.0 binary files are supported; embed buffers and PNG/JPEG/WebP textures. Draco and Meshopt geometry compression are supported. Plain `.gltf` packages with separate files and KTX2 textures are not supported.
- **SVG extrusion**: Upload SVG or choose a previously uploaded SVG source. Leave it blank for the included badge. Raised depth controls thickness relative to the artwork's longest dimension; 0 is flat. Rounded edges / bevel softens the edges; use small values for fine detail. Filled paths, basic shapes, compound holes, transforms, inline/simple CSS colors and linear/radial gradients are supported. Convert text and strokes to filled paths first. Raster images, filters, masks, clipping, live text and linked instances are not extruded. This is vector extrusion, not reconstruction of arbitrary images.

Choose **Solid**, **Wireframe** or **Particles**. Original materials uses base colors, vertex colors, base-color textures and simple shaded lighting. Palette recolors the object using the preset palette. Wireframe uses the palette. This is a lightweight stylized renderer rather than a complete physically based glTF viewer; embedded animation clips and advanced material maps are not played/rendered.

Object size and Floating motion affect all views. Rotation can be Automatic, Mouse or Off. Automatic rotation has an axis and reversible speed. Animation speed 0 freezes automatic rotation and floating; mouse rotation remains independent. Open Starting orientation for X/Y/Z tilt. Mouse follow strength is a separate camera-look control; use 0 to keep the camera steady while controlling rotation with the mouse.

In Particles view, use **Interaction → Particle interaction** for whole/local explosions, attraction, repulsion, nearby radius, global influence, mouse/scroll triggers and recovery. Density sets the sampled surface-particle count; it does not change the solid mesh. Particles are distributed over triangle surfaces so a low-poly model retains a recognizable silhouette. Kaleidoscope, tessellation, vortex, blending and bloom use the existing compositor. Scene Off, reduced motion and Save-Data retain the existing still-background behavior.

## Files and performance

Only administrators with upload permission can use the upload endpoint; every upload requires a valid nonce. GLB uploads are validated and limited to 10 MB. SVG sources are limited to 512 KB, sanitized and stored as inert `.dh-svg.json` vector instructions, without enabling general SVG uploads. Existing SVG URLs are also sanitized in the browser before geometry creation. The source is never inserted into the page's live DOM. Objects are limited to 100,000 triangles, 128 material groups, 2,000 nodes, and at most 100 instances per mesh; simpler models are strongly preferred. SVGs should have fewer than 64 filled paths. Textures are capped at 2048 pixels per side on upload to the GPU, and surface particles are capped at about 24,000 before quality/density and deliberate mirror copies.

For a hero, aim for under 500 KB, a few thousand triangles, few materials and small textures. The importer (~503 KB minified, before HTTP compression) and renderer (~12 KB) are fetched only for visible Custom 3D Object scenes. Draco decoder files load only for compressed models. Other elements do not fetch these files or any model. Geometry is prepared once per source/depth change and uploaded once; animation stays on the GPU. Off/disposal aborts pending fetches and releases model buffers, textures and programs.

Presets, shortcodes and look/full templates retain these controls. Templates include the source URL, not the model binary: upload the model/SVG on another website and choose its local URL when transferring a look. No existing presets are changed when updating the plugin.

```text
[kaleidoscope_hero preset="home" style="Custom 3D Object" modelurl="https://example.com/model.glb" modeldisplay="Wireframe"]
[kaleidoscope_hero preset="home" style="Custom 3D Object" modelsource="SVG extrusion" svgdepth="0.15" svgbevel="0.005" modelrotation="Off"]
```

The included crystal and badge are original CC0 samples. Three.js and Meshoptimizer use MIT licenses; Draco uses Apache 2.0. License files are included with the assets. External models retain their own licenses.
