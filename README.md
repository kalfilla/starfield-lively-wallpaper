# Starfield Wallpaper

This project builds an optimized browser wallpaper for Lively Wallpaper and
Wallpaper Engine. Lively properties provide saved controls for the starfield
without showing the website's sidebar on the desktop.

`_LivelyInfo.json` contains the wallpaper title, author, description, version,
and references to its thumbnail and animated preview. Increment its integer
`Version` for each wallpaper change you package or publish.

## Install in Lively Wallpaper

1. Run `npm install` once, then run `npm run build` whenever you update the
   wallpaper. This creates the optimized `dist` folder.
2. In Lively Wallpaper, use **Add Wallpaper** to browse to `dist/index.html`.
   You can also drag that file into the Lively window.
3. Assign the wallpaper to the desired display.
4. Right-click its tile in the Lively library and choose **Customize**.
   Lively's settings include sliders and toggles for the starfield.

If you change `LivelyProperties.json` after importing, use Lively's **Restore
Default** option in the customization panel to reload the supplied defaults.

## Lively controls

The Lively controls cover star count, speed, warp, star size, glow, trail, roll,
star color and color mode, steering, auto-drift direction and speed, comets,
twinkle, clock options, fullscreen behavior, information display, performance
counter visibility, and auto quality. Lively calls
`livelyPropertyListener(name, value)` when a control changes; the wallpaper
applies the setting immediately.
The star-count slider ranges up to 5,000.

When the clock overlay is enabled, its options include seconds, size, alignment,
and a position mode. **Free position** uses the horizontal and vertical sliders;
the four fixed modes place the clock in a corner. **Automatic positioning**
cycles the clock through the corners to reduce burn-in, using a configurable
interval from 1 to 60 minutes. Corner positions align the time and date toward
the nearest side; manual alignment is available only in **Free position**.
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
seconds, and `afc=1` to show the countdown. **Show information** displays the
idle duration, remaining auto-fullscreen or automatic-clock time, and FPS/star
count information. FPS is measured from completed animation frames; the star
count shows the number of star centers inside the viewport against the
configured total. The panel uses the upper corner opposite an upper clock, or
the upper-right when the clock is below. The Performance options can hide the
FPS and star counter without disabling auto quality.
The interface uses the locally bundled Source Code Pro font, and the standalone
settings page has a compact Allerta Stencil `STARFIELD` banner with green/cyan
shadow layers, randomized letter glitches, and jitter; the underscore cursor
blinks. Both fonts are available offline. Their SIL OFL licenses are in
`files/fonts/SourceCodePro-OFL.txt` and `files/fonts/OFL.txt`. The effects stop
when reduced motion is requested, and the banner is hidden in fullscreen and
Lively. The sidebar's About section lists keyboard shortcuts, all share-URL
keys, and how to compose a URL: use `?` before the first key and `&` to combine
more, such as `?hm=1&af=1`. Set `hm=1` to hide the cursor or `hm=0` to keep it
visible. **Reset Defaults** stays at the bottom of the options bar while its
settings scroll independently. The themed SVG favicon is in `files/favicon.svg`.

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

## Code style

Run `npm install` to install the development tools. Use `npm run format` to
format the JavaScript, `npm run lint` to check block and brace style, or
`npm run check` to run both checks.

## Wallpaper Engine

Run `.\export-wallpaper-engine.cmd` to build the optimized files and copy them
from `dist` into `WallpaperEngineExport`. In the Wallpaper Engine editor, drag
`WallpaperEngineExport\wallpaper-engine.html` onto **Create Wallpaper**. This
entry point opens the full-screen wallpaper without the settings sidebar. The
editor creates the Wallpaper Engine `project.json` when it imports the HTML
project; no pre-created project file is required.

## References

- [Lively Web Wallpaper Interaction Guide](https://github.com/rocksdanister/lively/wiki/Web-Guide-IV-:-Interaction)
- [Lively Wallpaper](https://github.com/lively-community/lively)
- [Wallpaper Engine Web Wallpaper Guide](https://docs.wallpaperengine.io/en/web/first/gettingstarted.html)
