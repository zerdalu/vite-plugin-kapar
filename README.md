# vite-plugin-kapar 

**vite-plugin-kapar** is a Vite dev-plugin for taking screenshots and recording `.webm` videos of your web application directly from the DOM.

It injects a sleek floating widget into your application during development, leveraging the experimental **HTML-in-Canvas API** to achieve zero-permission screen captures. It completely bypasses clunky `getDisplayMedia` screen-sharing prompts.

As a bonus, it includes a **Grease Pencil (Pen) feature**, allowing you to annotate your screen in real-time while recording demos or finding bugs.

## Key Features
- **Vite Dev Plugin:** Injects seamlessly during development mode (`apply: 'serve'`), zero impact on production builds.
- **Framework Agnostic:** Bundles its UI runtime internally—works out of the box with Vue, Svelte, React, Solid, or Vanilla JS projects.
- **Zero Permission Prompts:** No "Share your screen" popups.
- **Pixel-Perfect Scaling:** Define exact capture dimensions regardless of your actual viewport.
- **Fully Interactive:** The captured DOM elements remain interactive (clicks, hovers, inputs).
- **Built-in Pen Tool:** Draw over your application in real-time.

---

## Prerequisites (Crucial)
Because the HTML-in-Canvas API is currently experimental, this package requires specific browser settings to work:
1. Use **Chrome Canary** (or Chromium 147+).
2. Navigate to `chrome://flags/#canvas-draw-element`.
3. Enable the **HTML elements in canvas** flag and restart your browser.

---

## Installation

Install the package via NPM as a development dependency:

```bash
npm install vite-plugin-kapar -D
```

---

## Usage

Add the plugin to your `vite.config.ts`. 

```typescript
import { defineConfig } from 'vite';
import { kaparPlugin } from 'vite-plugin-kapar';

export default defineConfig({
  plugins: [
    kaparPlugin({
      targetSelector: '#app-wrapper' // Optional: target your app's main wrapper (defaults to #app, #root, or body)
    })
  ]
});
```

Once configured, start your Vite dev server (`npm run dev`). A floating widget will automatically appear in the bottom right corner of your app, giving you instant access to screenshot, recording, and pen tools.

---

## Local Testing & Development

If you want to contribute to `kapar` or test it locally within another project:

**1. Clone and Build:**
```bash
git clone https://github.com/zerdalu/kapar.git
cd kapar
npm install
npm run build
npm link
```

**2. Link to a local test project:**
```bash
# Inside your test project folder (e.g., a blank Vite app):
npm link vite-plugin-kapar
```

---

## Known Issues

- **Viewport-Fixed Elements (`position: fixed`):** Elements styled with `position: fixed` relative to the browser viewport may not appear inside the capture canvas. *Workaround: Wrap fixed elements or assign them `position: absolute` relative to your targeted application container.*
- **Cross-Origin Content (CORS):** Elements containing cross-origin resources (such as external images, web fonts, or nested `<iframe>` contents) may fail to render or taint the canvas due to browser security boundaries.
- **Experimental API Reliance:** Since this uses the experimental `drawElementImage` API, performance and rendering stability are tied to the browser's experimental canvas implementation.

---

## Roadmap

- **Video Quality and Bitrate Controls:** Expose advanced configuration options for video capturing (e.g., custom bitrates, VP9/AV1 encoding formats) to maximize output recording quality.
- **Enhanced Grease Pencil Tools:** Expand the annotation tool with vector shapes (arrows, rectangles, circles), an eraser brush, and adjustable brush opacity.
- **Audio Capture Integration:** Add options to capture microphone audio track inputs alongside the video stream during session recording.
- **Additional Image Export Formats:** Support exporting screenshots as `.webp` or `.jpeg` alongside standard `.png`.
- **Preflight Style Refinements:** Optimize the inline CSS preflight reset to ensure broader layout rendering compatibility inside the Shadow DOM widget.

---

## License

MIT © [zerdalu](https://github.com/zerdalu)
