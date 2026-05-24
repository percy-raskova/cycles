import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "CYCLES",
        short_name: "CYCLES",
        description: "A two-player planar-graph strategy game",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0a1a",
        theme_color: "#ff00ff",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "./src/core"),
      "@ui": path.resolve(__dirname, "./src/ui"),
    },
  },
  build: {
    outDir: "dist",
  },
});
