# kapar 

**kapar** is a Vite dev-plugin for taking screenshots and recording `.webm` videos of your web application directly from the DOM.

It injects a sleek React-based widget into your application during development, leveraging the experimental **HTML-in-Canvas API** to achieve zero-permission, pixel-perfect screen captures. It completely bypasses clunky `getDisplayMedia` screen-sharing prompts.

As a bonus, it includes a **Grease Pencil (Pen) feature**, allowing you to annotate your screen in real-time while recording demos or finding bugs.

## Key Features
- **Vite Dev Plugin:** Injects seamlessly during development mode (`apply: 'serve'`), zero impact on production builds.
- **Zero Permission Prompts:** No "Share your screen" popups.
- **Pixel-Perfect Scaling:** Define exact capture dimensions regardless of your actual viewport.
- **Fully Interactive:** The captured DOM elements remain 100% interactive (clicks, hovers, inputs).
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
npm install kapar -D
```

---

## Usage

Add the plugin to your `vite.config.ts`. 

```typescript
import { defineConfig } from 'vite';
import { kaparPlugin } from 'kapar';

export default defineConfig({
  plugins: [
    kaparPlugin({
      targetSelector: '#app-wrapper', // Important: target your app's main wrapper
      width: 1200, 
      height: 800,
      fps: 60,
      penColor: '#ff1493',
      penWidth: 4
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
npm link kapar
```

---

## License

MIT © [zerdalu](https://github.com/zerdalu)
