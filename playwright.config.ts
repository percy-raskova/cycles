import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for CYCLES.
 *
 * Uses the Vite preview server as the webServer so E2E tests
 * always run against the production build.
 *
 * Artifacts (trace, screenshot, video) are captured only on failure
 * to aid debugging without bloking the passing suite.
 */
export default defineConfig({
  testDir: "./tests/e2e/specs",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/playwright-results.json" }],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: "http://localhost:4173",

    /* Collect trace, screenshot, and video when a test fails */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],

  /* Run local preview server before starting the tests */
  webServer: {
    command: "bun run preview --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
});
