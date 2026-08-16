import path, { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // React Compiler。Vite 8 (rolldown) では @vitejs/plugin-react の
    // babel 統合ではなく @rolldown/plugin-babel 経由で babel プラグインとして
    // 差し込む（@vitejs/plugin-react 6.0.4 README 記載の rolldown 向け手順）。
    babel({ presets: [reactCompilerPreset({ target: "19" })] }),
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
        slot: resolve(__dirname, "slot.html"),
        sync: resolve(__dirname, "sync.html"),
      },
    },
  },
  base: "./",
});
