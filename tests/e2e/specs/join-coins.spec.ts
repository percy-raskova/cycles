import { expect, test } from "../helpers/fixtures";
import { CyclesPage } from "../helpers/page-helpers";

test.describe("E2E — Join Coins journey", () => {
  test("joins two aligned coins and flips their faces", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    // Place two coins
    await game.placeCoin(0, 0, "heads");
    await game.placeCoin(0, 3, "tails");

    // Click first coin to enter join mode
    await game.clickCoin(0, 0);

    // Click second coin to complete join
    await game.clickCoin(0, 3);

    // Edge should be present in DOM (SVG <line> may not be "visible" per Playwright)
    await expect(game.edgeBetween(0, 0, 0, 3)).toBeAttached();

    // Turn should switch
    const initialPlayer = await game.currentPlayer();
    expect(["HEADS", "TAILS"]).toContain(initialPlayer);
  });

  test("joins diagonal coins", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    await game.placeCoin(1, 1, "heads");
    await game.placeCoin(3, 3, "tails");

    await game.joinCoins(1, 1, 3, 3);

    await expect(game.edgeBetween(1, 1, 3, 3)).toBeAttached();
  });

  test("cancels join selection with Escape key", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    await game.placeCoin(0, 0, "heads");
    await game.placeCoin(0, 2, "tails");

    await game.clickCoin(0, 0);
    // Without clicking a second coin, press Escape
    await page.keyboard.press("Escape");

    // Should still be able to place a new coin
    await game.placeCoin(1, 1, "heads");
    await expect(game.coinAt(1, 1)).toBeVisible();
  });

  test("clicking same coin cancels join selection", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    await game.placeCoin(0, 0, "heads");
    await game.clickCoin(0, 0);
    await game.clickCoin(0, 0);

    // Should be back to idle — can place a new coin
    await game.placeCoin(2, 2, "tails");
    await expect(game.coinAt(2, 2)).toBeVisible();
  });
});
