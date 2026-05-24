// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderGame } from "./helpers/render-game";
import {
  getCoinAt,
  getDotAt,
  getEdgeBetween,
  getFaceSelector,
  placeCoinAt,
} from "./helpers/selectors";

describe("Boundary Positions", () => {
  it("allows face selector to open at all four corners", async () => {
    const { user } = renderGame();
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 6 },
      { row: 6, col: 0 },
      { row: 6, col: 6 },
    ];

    for (const { row, col } of corners) {
      const dot = getDotAt(row, col);
      await user.click(dot);
      expect(getFaceSelector(row, col)).not.toBeNull();
      await user.keyboard("{Escape}");
      expect(getFaceSelector(row, col)).toBeNull();
    }
  });

  it("allows joining boundary coins", async () => {
    const { user } = renderGame();

    await placeCoinAt(user, 0, 0, "heads");
    await placeCoinAt(user, 0, 6, "tails");

    const coin00 = getCoinAt(0, 0);
    const coin06 = getCoinAt(0, 6);

    await user.click(coin00);
    await user.click(coin06);

    expect(getEdgeBetween({ row: 0, col: 0 }, { row: 0, col: 6 })).toBeDefined();
  });

  it("ignores out-of-bounds clicking without errors", async () => {
    const { user } = renderGame();

    const board = screen.getByTestId("board-view");
    const dots = board.querySelectorAll("circle");
    expect(dots.length).toBe(49);

    // Clicking a grid line (not a dot) should not cause errors
    const lines = board.querySelectorAll("line");
    expect(lines.length).toBe(14);

    const firstLine = lines[0];
    if (!firstLine) throw new Error("Expected at least one grid line");
    await user.click(firstLine as HTMLElement);

    // No face selector should be open
    expect(screen.queryByTestId("face-selector-backdrop")).toBeNull();
  });
});
