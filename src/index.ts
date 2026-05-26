import { Plugin } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Polyfill path variables for compatibility with both ES modules and older module loaders
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface KaparPluginOptions {
  targetSelector?: string;
}

export function kaparPlugin(options: KaparPluginOptions = {}): Plugin {
  return {
    name: "vite-plugin-kapar",
    apply: "serve", // Restrict injection to development mode only
    transformIndexHtml(html) {
      try {
        const clientPath = path.resolve(__dirname, "client.js");

        if (!fs.existsSync(clientPath)) {
          console.warn(
            "[Kapar] client.js bundle not found in dist/. Please run 'npm run build' inside the kapar library folder.",
          );
          return html;
        }

        const clientScriptContent = fs.readFileSync(clientPath, "utf-8");

        return [
          {
            tag: "script",
            attrs: { type: "module" },
            children: `
              ${clientScriptContent}
              if (window.initKapar) {
                window.initKapar(${JSON.stringify(options)});
              }
            `,
            injectTo: "body",
          },
        ];
      } catch (e) {
        console.error("[Kapar] Failed to inject browser script: ", e);
        return html;
      }
    },
  };
}
