import { chromium } from "@playwright/test";

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Navigate to the running dev server
  await page.goto("http://localhost:5173/");
  await page.waitForSelector("[data-testid='board-view']", { timeout: 10000 });

  // Screenshot 1: Initial load
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/screenshot-01-initial.png", fullPage: true });
  console.log("✓ Screenshot 1: initial load");

  // Click an empty intersection (row 3, col 3 => aria-label uses 1-indexed)
  const intersection = page.locator('[aria-label="Empty intersection at row 4, column 4"]');
  await intersection.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/screenshot-02-face-selector.png", fullPage: true });
  console.log("✓ Screenshot 2: face selector open");

  // Select heads
  await page.locator('[data-testid="face-selector-heads"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/screenshot-03-coin-placed.png", fullPage: true });
  console.log("✓ Screenshot 3: coin placed");

  // Place a second coin
  await page.locator('[aria-label="Empty intersection at row 4, column 6"]').click();
  await page.locator('[data-testid="face-selector-tails"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/screenshot-04-two-coins.png", fullPage: true });
  console.log("✓ Screenshot 4: two coins placed");

  // Click first coin to enter join mode
  await page.locator('[data-testid="coin-3-3"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/screenshot-05-join-mode.png", fullPage: true });
  console.log("✓ Screenshot 5: join mode");

  // Click second coin to complete join
  await page.locator('[data-testid="coin-3-5"]').click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/screenshot-06-edge-drawn.png", fullPage: true });
  console.log("✓ Screenshot 6: edge drawn");

  // Screenshot 7: Menu bar
  await page.screenshot({
    path: "test-results/screenshot-07-menu-bar.png",
    clip: { x: 0, y: 0, width: 1280, height: 60 },
  });
  console.log("✓ Screenshot 7: menu bar");

  await browser.close();
  console.log("\nAll screenshots saved to test-results/");
}

captureScreenshots().catch((err) => {
  console.error("Failed to capture screenshots:", err);
  process.exit(1);
});
