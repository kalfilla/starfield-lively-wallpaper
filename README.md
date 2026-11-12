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
star color and color mode, steering, nebula, comets, twinkle, clock options, and
auto quality. Lively calls `livelyPropertyListener(name, value)` when a control
changes; the wallpaper applies the setting immediately.

When the clock overlay is enabled, its clock-options section provides seconds,
size, and horizontal/vertical position. Both position sliders range from 0% to
100% and position the clock from the left and bottom edges respectively. This
can help keep it clear of the Windows taskbar in fullscreen Lively playback.
The time and date can also be aligned to the left or right edge of each other.

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

## License

Unless otherwise noted, all content in this repository is licensed under the
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
License](https://creativecommons.org/licenses/by-nc-sa/4.0/). See [LICENSE](./LICENSE)
for details.

## References

- [Lively Web Wallpaper Interaction Guide](https://github.com/rocksdanister/lively/wiki/Web-Guide-IV-:-Interaction)
- [Lively Wallpaper](https://github.com/lively-community/lively)
