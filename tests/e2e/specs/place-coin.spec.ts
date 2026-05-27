import { expect, test } from "../helpers/fixtures";
import { CyclesPage } from "../helpers/page-helpers";

test.describe("E2E — Place Coin journey", () => {
  test("places a coin and updates the turn indicator", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    // Verify initial state — first player is random (HEADS or TAILS)
    const initialPlayer = await game.currentPlayer();
    expect(["HEADS", "TAILS"]).toContain(initialPlayer);
    expect(await game.coinsRemaining()).toBe(12);

    // Click an empty intersection
    await game.clickIntersection(0, 0);

    // Face selector should appear
    await expect(game.faceSelectorHeads).toBeVisible();
    await expect(game.faceSelectorTails).toBeVisible();

    // Select heads
    await game.selectFace("heads");

    // Coin should appear
    await expect(game.coinAt(0, 0)).toBeVisible();

    // Turn should switch and count decrease
    const nextPlayer = initialPlayer === "HEADS" ? "TAILS" : "HEADS";
    await expect(game.turnPlayer).toHaveText(new RegExp(nextPlayer));
    expect(await game.coinsRemaining()).toBe(11);
  });

  test("places multiple coins on different intersections", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    await game.placeCoin(0, 0, "heads");
    await game.placeCoin(1, 1, "tails");
    await game.placeCoin(2, 2, "heads");

    await expect(game.coinAt(0, 0)).toBeVisible();
    await expect(game.coinAt(1, 1)).toBeVisible();
    await expect(game.coinAt(2, 2)).toBeVisible();

    expect(await game.coinsRemaining()).toBe(9);
  });

  test("cancels face selection by clicking backdrop", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    await game.clickIntersection(3, 3);
    await expect(game.faceSelectorBackdrop).toBeVisible();

    // Click a corner of the backdrop well away from the popup so the
    // popup does not intercept the pointer event.
    await game.faceSelectorBackdrop.click({ position: { x: 0, y: 0 } });
    await expect(game.faceSelectorBackdrop).not.toBeVisible();
    await expect(game.coinAt(3, 3)).not.toBeVisible();
  });
});
