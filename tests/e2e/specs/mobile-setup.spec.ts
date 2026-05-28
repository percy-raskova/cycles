import { expect, test } from "../helpers/fixtures";

// Mobile-width viewport so the ≤767px layout is active. Viewport-only (not the full
// `devices["Pixel 5"]` descriptor) so the spec runs safely under both the chromium
// and firefox projects — Firefox rejects the descriptor's `isMobile` flag.
test.use({ viewport: { width: 390, height: 844 } });

test.describe("E2E (mobile viewport) — opponent chooser", () => {
  test("shows the chooser at / and can start a CPU game", async ({ page }) => {
    // Land on the app root with NO ?mode= — i.e. the installed PWA's start_url.
    // Regression: the opponent chooser was 'missing' here on the mobile PWA.
    await page.goto("/");

    const chooser = page.getByRole("dialog", { name: "New Game" });
    await expect(chooser).toBeVisible();
    await expect(page.getByRole("radio", { name: "Human opponent" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Strategic bot opponent" })).toBeVisible();

    // Pick a CPU opponent and start — exactly what a mobile player could not do before.
    await page.getByRole("radio", { name: "Strategic bot opponent" }).click();
    await page.getByRole("button", { name: "Start game" }).click();

    // Chooser dismissed → a game started; a bot game exposes the "Back to setup" control.
    await expect(chooser).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Back to setup" })).toBeVisible();
  });
});
