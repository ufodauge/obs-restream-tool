import path, { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      optimize: {
        minify: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    license: true,
    rolldownOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        scene: resolve(__dirname, "scene.html"),
      },
    },
  },
  base: "./",
});
