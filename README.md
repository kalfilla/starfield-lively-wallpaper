# Starfield Wallpaper

This folder contains a browser wallpaper prepared for Lively Wallpaper. Lively
properties provide saved controls for the starfield without showing the
website's sidebar on the desktop.

`LivelyInfo.json` contains the wallpaper title, author, description, version,
and references to its thumbnail and animated preview. Increment its integer
`Version` for each wallpaper change you package or publish.

## Install in Lively Wallpaper

1. Keep the project files together: `index.html`, `LivelyProperties.json`,
   `LivelyInfo.json`, `thumbnail.jpg`, `preview.gif`, and the `files` folder.
2. Open Lively Wallpaper and use **Add Wallpaper** to browse to this folder's
   `index.html`. You can also drag `index.html` into the Lively window.
3. Assign the wallpaper to the desired display.
4. Right-click its tile in the Lively library and choose **Customize**.
   Lively's settings include sliders and toggles for the starfield.

If you change `LivelyProperties.json` after importing, use Lively's **Restore
Default** option in the customization panel to reload the supplied defaults.

## Lively controls

The Lively controls cover star count, speed, warp, star size, glow, trail, roll,
star color and color mode, steering, auto-drift direction and speed, nebula,
comets, twinkle, clock options, fullscreen behavior, and auto quality. Lively
calls `livelyPropertyListener(name, value)` when a control changes; the
wallpaper applies the setting immediately.

When the clock overlay is enabled, its options include seconds, size, alignment,
and a position mode. **Free position** uses the horizontal and vertical sliders;
the four fixed modes place the clock in a corner. The time and date can be
aligned to the left or right edge of each other.
Selecting **Auto drift** reveals direction, movement range, and overall,
horizontal, and vertical speed controls. These settings are also available in
Lively and included in copied settings links. The three speed sliders display
0–100 in steps of 2 and scale the effective speed by one twentieth (so 2
becomes 0.1×); the maximum effective speed remains 5×. Movement range remains
a percentage. The sidebar groups settings into
Screensaver, Flight, Steering, Appearance, Clock, and Options.
When **Hide mouse cursor in fullscreen** is enabled, the cursor and fullscreen
controls are hidden. Moving the mouse briefly shows an exit-key hint instead.
Shared settings links use `hm=1` to hide the cursor and `hm=0` to keep it
visible; copied links include the current choice.
On the standalone browser page, **Auto fullscreen when idle** enters fullscreen
after the configured idle delay and exits again as soon as activity resumes.
This only exits fullscreen when the idle option initiated it; Lively already
owns the desktop-sized surface. The delay ranges from 0 to 120 seconds; 0
disables the idle trigger. Browsers may block native fullscreen without a user
gesture; if that happens, the page uses its viewport fullscreen and shows a
notice. An optional `auto fullscreen in Ns` countdown appears inside the canvas;
shared links use `af=1` to enable auto fullscreen, `afd` for the delay in
seconds, and `afc=1` to show the countdown.
The standalone settings page has an intermittently glitching `STARFIELD` banner
above the workspace. It is separate from the animated canvas, hidden in
fullscreen and Lively, and still when reduced motion is requested. The sidebar's
About section lists keyboard shortcuts and all share-URL keys (`st` is the
short key for steering). **Reset Defaults** stays at the bottom of the options
bar while its settings scroll independently.

`files/starfield.js` first loads settings from `LivelyProperties.json`. Browsers
block that fetch when the page is opened directly as a `file://` URL, so
`files/starfield.js` contains only the runtime fallback values needed by the app
for that case. Keep those values synchronized with `LivelyProperties.json` when
changing defaults, slider ranges, or steps. When the wallpaper is served over
HTTP, the external JSON remains the active source. After changing a property,
use Lively's **Restore Default** option if its customization panel still shows
cached bounds or defaults.

Lively itself manages the desktop-sized surface. The **Start standalone page in
fullscreen** property is for the browser page's shareable `fs` setting; it
doesn't request a second fullscreen window from Lively.

## References

- [Lively Web Wallpaper Interaction Guide](https://github.com/rocksdanister/lively/wiki/Web-Guide-IV-:-Interaction)
- [Lively Wallpaper](https://github.com/lively-community/lively)
