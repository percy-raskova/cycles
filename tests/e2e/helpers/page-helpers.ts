import type { Locator, Page } from "@playwright/test";

/**
 * Page-object helpers for CYCLES Playwright E2E tests.
 *
 * All selectors use data-testid or aria-label attributes so tests are
 * resilient to cosmetic CSS changes.
 */

export class CyclesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Navigation ─────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto("/?mode=human");
    await this.page.waitForSelector("[data-testid='board-view']");
  }

  // ─── Turn Indicator ─────────────────────────────────────────────

  get turnIndicator(): Locator {
    return this.page.locator("[data-testid='turn-indicator']").first();
  }

  get turnPlayer(): Locator {
    return this.page.locator("[data-testid='turn-indicator-player']").first();
  }

  get turnRemaining(): Locator {
    return this.page.locator("[data-testid='turn-indicator-remaining']").first();
  }

  async currentPlayer(): Promise<string> {
    const text = await this.turnPlayer.textContent();
    return text?.trim() ?? "";
  }

  async coinsRemaining(): Promise<number> {
    const text = await this.turnRemaining.textContent();
    const match = text?.match(/(\d+)/);
    return match ? Number.parseInt(match[1] ?? "0", 10) : 0;
  }

  // ─── Board Interactions ─────────────────────────────────────────

  /**
   * Click an empty intersection.
   * aria-label is 1-indexed: "Empty intersection at row {r+1}, column {c+1}"
   */
  intersection(row: number, col: number): Locator {
    const r = row + 1;
    const c = col + 1;
    return this.page.locator(`[aria-label^="Intersection r${r} c${c}"]`).first();
  }

  async clickIntersection(row: number, col: number): Promise<void> {
    await this.intersection(row, col).click();
  }

  coinAt(row: number, col: number): Locator {
    return this.page.locator(`[data-testid='coin-${row}-${col}']`).first();
  }

  async clickCoin(row: number, col: number): Promise<void> {
    await this.coinAt(row, col).click();
  }

  edgeBetween(fromRow: number, fromCol: number, toRow: number, toCol: number): Locator {
    return this.page
      .locator(`[data-testid='edge-${fromRow}-${fromCol}-${toRow}-${toCol}']`)
      .first();
  }

  // ─── Face Selector ──────────────────────────────────────────────

  get faceSelectorHeads(): Locator {
    return this.page.locator("[data-testid='face-selector-heads']").first();
  }

  get faceSelectorTails(): Locator {
    return this.page.locator("[data-testid='face-selector-tails']").first();
  }

  get faceSelectorBackdrop(): Locator {
    return this.page.locator("[data-testid='face-selector-backdrop']").first();
  }

  async selectFace(face: "heads" | "tails"): Promise<void> {
    const btn = face === "heads" ? this.faceSelectorHeads : this.faceSelectorTails;
    await btn.click();
  }

  // ─── Menu Bar ───────────────────────────────────────────────────

  get resetButton(): Locator {
    return this.page.locator("[aria-label='Reset game to initial state']").first();
  }

  get undoButton(): Locator {
    return this.page.locator("[aria-label='Undo last move']").first();
  }

  async resetGame(): Promise<void> {
    await this.resetButton.click();
  }

  async undoMove(): Promise<void> {
    await this.undoButton.click();
  }

  // ─── Game Over ──────────────────────────────────────────────────

  get gameOverPanel(): Locator {
    return this.page.locator("[data-testid='game-over-panel']").first();
  }

  get gameOverWinner(): Locator {
    return this.page.locator("[data-testid='game-over-winner']").first();
  }

  get newGameButton(): Locator {
    return this.page.locator("[data-testid='game-over-new-game']").first();
  }

  // ─── Convenience Actions ────────────────────────────────────────

  /** Place a coin in one action (click intersection + select face). */
  async placeCoin(row: number, col: number, face: "heads" | "tails"): Promise<void> {
    await this.clickIntersection(row, col);
    await this.selectFace(face);
    // Wait for the coin to appear
    await this.coinAt(row, col).waitFor({ state: "visible" });
  }

  /** Join two coins in one action (click first, click second, wait for edge). */
  async joinCoins(aRow: number, aCol: number, bRow: number, bCol: number): Promise<void> {
    await this.clickCoin(aRow, aCol);
    await this.clickCoin(bRow, bCol);
    // Wait for the edge to appear in DOM (SVG <line> may not be "visible" per Playwright)
    await this.edgeBetween(aRow, aCol, bRow, bCol).waitFor({ state: "attached" });
    // Wait for the 500ms coin-flip animation to finish before next interaction
    await this.page.waitForTimeout(600);
  }

  /** Check whether the undo button is enabled. */
  async isUndoEnabled(): Promise<boolean> {
    const disabled = await this.undoButton.getAttribute("disabled");
    return disabled === null;
  }
}
