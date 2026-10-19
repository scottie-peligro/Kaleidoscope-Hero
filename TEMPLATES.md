# Reusable templates

Templates are named snapshots of plugin settings. Use them to reuse a look on another preset, or export a JSON file for another website running Kaleidoscope Hero 1.14.0 or later. Presets still supply the shortcode IDs used by pages; templates do not replace those IDs.

## Save a look

1. Open **Kaleidoscope Hero → Presets** and adjust a preset.
2. In **Reusable templates**, enter a template name under Save current settings.
3. Choose **Look only** or **Full settings**, then **Save as template**.

This captures the controls currently in the editor, including unsaved changes. It saves the template independently; it does not save the preset. Reusing a name creates a numbered copy, so a previous look is not silently overwritten.

| Scope | Included | Preserved when applied |
| --- | --- | --- |
| Look only | Scene, animation, palette, background colours, darkness, sculpture/morph controls and mouse/vortex interactions | Destination Content controls (including text, links, overlay and brackets), height and display mode |
| Full settings | All plugin settings in the preset editor, including Content and Layout | Preset name and shortcode ID |

Neither scope includes site-wide transition/performance/font settings, page content, block attributes, theme CSS or other plugins. Full settings preserves its saved link URLs as written; review them when moving to another website.

## Reuse on a preset

Open the destination preset, select a saved template, and choose **Apply to preview**. Review the controls and live preview. **Undo apply** restores the settings from before the latest application. Choose **Save preset** when you want the result to affect pages using that preset.

Applying a template never changes the preset name or shortcode ID. Templates are independent snapshots: changes to a preset do not update its source template, and deleting a template does not change presets that already used it.

## Move to another website

1. Open **Kaleidoscope Hero → Templates** on the source site.
2. Use **Export JSON** beside a template, or **Export all templates**.
3. On the other website, install/update Kaleidoscope Hero, open **Templates**, choose the JSON file, then **Import into library**.
4. Open a destination preset and apply the imported template. Review, then Save preset.

Import adds new copies. It never replaces an existing template or applies anything to presets automatically. Duplicate names receive a numbered suffix. A file with an invalid record is rejected before any records are added. Files using unsupported style/settings options report an error so you can update the destination plugin rather than silently receiving a different look.

## File format and limits

Downloads use a versioned `kaleidoscope-hero-templates` JSON format (format version 1), carrying template names, scopes, settings and the source plugin version. They contain no database IDs, credentials or site-wide configuration. Look-only files exclude Content links/text. Full settings files include their saved Content, so choose the appropriate scope when sharing.

Imports accept JSON uploads up to 1 MB and 100 templates, within a library limit of 100 templates and approximately 1 MB of stored data. Only supported settings are retained and sanitized. Older partial templates apply only their captured fields, preserving newer destination controls.

All template actions require WordPress administration permissions and request nonces. Uploaded JSON is read into the template library, not published as an attachment or executed. Template scripts/styles are restricted to the plugin's admin screen; frontend rendering and downloads are unchanged.
