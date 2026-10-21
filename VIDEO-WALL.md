# Video wall

Choose **Video wall** under **Element → Animated element**. Select a video from the Media Library, then choose **Video** or **Particle wall**. The particle wall samples each decoded frame on the GPU; spacing, size, color, shape, brightness depth, dark pixel cutoff, contrast and playback speed are adjustable. Both views can sit behind page content. Existing bloom, kaleidoscope, tessellation, blending and background controls remain available.

For a small source, use **Make a smaller video** in the same tab. Choose a local video file or a Media Library video, a size preset and a clip length up to 30 seconds. The browser records a silent WebM or MP4 copy using its native encoder, then adds that copy to the Media Library. Recording takes the clip's playback time and depends on browser codec support. Review the resulting size and preview before saving the preset; the original is retained. Short silent loops and a separate still image load best. The particle effect does not reduce the source video's download size by itself.

Free skyline example: [Tour high above a city at dusk](https://mixkit.co/free-stock-video/tour-high-above-a-city-at-dusk-41375/) (Mixkit Stock Video Free License). Download the HD video from Mixkit, then upload or compress it in the plugin. The clip is not bundled with the plugin, so unused sites do not download it.

For best compatibility, use a video hosted in your site's Media Library. A remote host must allow cross-origin video textures (CORS). The video is muted for automatic playback. Offscreen, hidden, reduced-motion and data-saving scenes stop loading or pause playback; a selected still image is shown where available. Brightness depth is an artistic effect based on video luminance, not real 3D reconstruction.
