import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // DOM-rendering tests run in jsdom by directory, instead of relying on per-file
    // `// @vitest-environment jsdom` pragmas (which Biome's import autofix can strip
    // when the pragma sits atop an unused import). Pure logic (src/core, src/cli) stays node.
    environmentMatchGlobs: [
      ["src/ui/**", "jsdom"],
      ["tests/integration/**", "jsdom"],
      ["tests/visual/**", "jsdom"],
      ["tests/a11y/**", "jsdom"],
    ],
    setupFiles: ["./tests/setup-jsdom.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
    slowTestThreshold: 100,
    reporter: ["verbose", "html", "json"],
    outputFile: {
      html: "test-results/vitest-report.html",
      json: "test-results/vitest-results.json",
    },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "json"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
      include: ["src/core/**/*"],
      exclude: [
        "src/core/**/*.test.ts",
        "src/core/**/*.spec.ts",
        "src/core/__tests__/**",
        "src/core/types.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "./src/core"),
      "@ui": path.resolve(__dirname, "./src/ui"),
    },
  },
});
