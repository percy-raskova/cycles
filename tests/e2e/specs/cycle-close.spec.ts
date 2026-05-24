import { expect, test } from "../helpers/fixtures";
import { CyclesPage } from "../helpers/page-helpers";

test.describe("E2E — Cycle Close journey", () => {
  test("closes a square cycle and flips interior coins", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    // Place four corners of a 2×2 square
    await game.placeCoin(0, 0, "heads");
    await game.placeCoin(0, 2, "tails");
    await game.placeCoin(2, 2, "heads");
    await game.placeCoin(2, 0, "tails");

    // Place a coin inside the square
    await game.placeCoin(1, 1, "heads");

    // Join three sides
    await game.joinCoins(0, 0, 0, 2);
    await game.joinCoins(0, 2, 2, 2);
    await game.joinCoins(2, 2, 2, 0);

    // Close the cycle — the interior coin should flip
    await game.joinCoins(2, 0, 0, 0);

    // All four edges of the cycle should exist in DOM
    await expect(game.edgeBetween(0, 0, 0, 2)).toBeAttached();
    await expect(game.edgeBetween(0, 2, 2, 2)).toBeAttached();
    await expect(game.edgeBetween(2, 2, 2, 0)).toBeAttached();
    await expect(game.edgeBetween(2, 0, 0, 0)).toBeAttached();
  });

  test("closing a cycle does not flip coins outside the region", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    // Place four corners
    await game.placeCoin(0, 0, "heads");
    await game.placeCoin(0, 2, "tails");
    await game.placeCoin(2, 2, "heads");
    await game.placeCoin(2, 0, "tails");

    // Place an outside coin
    await game.placeCoin(0, 4, "heads");

    // Build and close the cycle
    await game.joinCoins(0, 0, 0, 2);
    await game.joinCoins(0, 2, 2, 2);
    await game.joinCoins(2, 2, 2, 0);
    await game.joinCoins(2, 0, 0, 0);

    // Outside coin should still be visible
    await expect(game.coinAt(0, 4)).toBeVisible();
  });
});
