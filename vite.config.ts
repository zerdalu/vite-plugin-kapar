import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"), // Forces production builds of React
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        client: resolve(__dirname, "src/ui/client.tsx"),
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ["path", "fs", "vite", "url"],
    },
  },
});
