import { expect, test } from "../helpers/fixtures";
import { CyclesPage } from "../helpers/page-helpers";

test.describe("E2E — Game Over journey", () => {
  test("resets game from menu bar and clears the board", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    // Place some coins
    await game.placeCoin(0, 0, "heads");
    await game.placeCoin(1, 1, "tails");
    await game.placeCoin(2, 2, "heads");

    // Reset via menu bar
    await game.resetGame();
    await page.waitForTimeout(200);

    // Board should be empty
    await expect(game.coinAt(0, 0)).not.toBeVisible();
    await expect(game.coinAt(1, 1)).not.toBeVisible();
    await expect(game.coinAt(2, 2)).not.toBeVisible();

    // Undo should be disabled after reset
    expect(await game.isUndoEnabled()).toBe(false);

    // Coins remaining should be back to 12
    expect(await game.coinsRemaining()).toBe(12);
  });

  test("undo button becomes enabled after a move", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    // Initially undo is disabled
    expect(await game.isUndoEnabled()).toBe(false);

    // Place a coin
    await game.placeCoin(0, 0, "heads");

    // Undo should now be enabled
    expect(await game.isUndoEnabled()).toBe(true);

    // Undo the move
    await game.undoMove();
    await page.waitForTimeout(200);

    // Coin should disappear
    await expect(game.coinAt(0, 0)).not.toBeVisible();
    expect(await game.isUndoEnabled()).toBe(false);
  });
});
