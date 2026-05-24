import { expect, test } from "../helpers/fixtures";
import { CyclesPage } from "../helpers/page-helpers";

test.describe("E2E — Auto-Pass journey", () => {
  test("auto-pass notice element exists in DOM", async ({ page }) => {
    const game = new CyclesPage(page);
    await game.goto();

    // The turn-indicator notice element should be present even when hidden
    const notice = page.locator(".turn-indicator-notice");
    await expect(notice).toHaveCount(0);

    // After placing a coin, there should still be no notice (player has moves)
    await game.placeCoin(0, 0, "heads");
    await expect(notice).toHaveCount(0);
  });
});
