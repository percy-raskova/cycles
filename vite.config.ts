import path from "node:path";
import reactScan from "@react-scan/vite-plugin-react-scan";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Dev-only overlay; the plugin auto-gates so production builds are unaffected.
    reactScan(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "CYCLES",
        short_name: "CYCLES",
        description: "A two-player game of planar graphs, parity, and enclosure.",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#1a0b2e",
        theme_color: "#9b4f96",
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
