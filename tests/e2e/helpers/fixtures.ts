import { test as base, expect } from "@playwright/test";

/**
 * Shared E2E test fixtures.
 *
 * The preview build E2E runs against is production-mode, where the app's debug
 * logger is off by default. This fixture turns it on (via the localStorage flag
 * the logger checks) and forwards every browser console message + page error to
 * the test-runner stdout in real time — so a human or an LLM watching the run
 * can read the app's `[CYCLES:*]` logs as actions happen, and to the HTML/JSON
 * report as an attachment for after-the-fact troubleshooting.
 */
export const test = base.extend<{ captureBrowserLogs: undefined }>({
  captureBrowserLogs: [
    async ({ page }, use, testInfo) => {
      const lines: string[] = [];

      // Enable the in-app debug logger before any page script runs.
      await page.addInitScript(() => {
        try {
          localStorage.setItem("cycles:debug", "1");
        } catch {
          // localStorage may be unavailable; the ?debug fallback still applies.
        }
      });

      const record = (line: string): void => {
        lines.push(line);
        // Stream immediately so the log is visible during the run, not just after.
        process.stdout.write(`${line}\n`);
      };

      page.on("console", (msg) => {
        record(`[browser:${msg.type()}] ${msg.text()}`);
      });
      page.on("pageerror", (err) => {
        record(`[browser:pageerror] ${err.message}`);
      });

      await use(undefined);

      if (lines.length > 0) {
        await testInfo.attach("browser-console.log", {
          body: lines.join("\n"),
          contentType: "text/plain",
        });
      }
    },
    { auto: true },
  ],
});

export { expect };
