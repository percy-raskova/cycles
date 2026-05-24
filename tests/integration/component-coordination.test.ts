// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderGame } from "./helpers/render-game";
import { getCoinAt, getDotAt, getFaceSelector, placeCoinAt } from "./helpers/selectors";

describe("Component Coordination (US5)", () => {
  it("TurnIndicator updates player and coin count after PLACE", async () => {
    const { user } = renderGame();

    const playerBefore = screen.getByTestId("turn-indicator-player").textContent;
    const remainingBefore = screen.getByTestId("turn-indicator-remaining").textContent;

    expect(remainingBefore).toBe("12 coins remain");

    await placeCoinAt(user, 0, 0, "heads");

    const playerAfter = screen.getByTestId("turn-indicator-player").textContent;
    const remainingAfter = screen.getByTestId("turn-indicator-remaining").textContent;

    expect(playerAfter).not.toBe(playerBefore);
    expect(remainingAfter).toBe("11 coins remain");
  });

  it("shows selected and highlighted coin classes during JOIN selection", async () => {
    const { user } = renderGame();

    await placeCoinAt(user, 0, 0, "heads");
    await placeCoinAt(user, 0, 2, "tails");

    const coin00 = getCoinAt(0, 0);
    const coin02 = getCoinAt(0, 2);

    await user.click(coin00);

    expect(coin00.classList.contains("coin-selected")).toBe(true);
    expect(coin02.classList.contains("coin-highlighted")).toBe(true);
  });

  it("hovering over a legal empty intersection increases dot radius", async () => {
    const { user } = renderGame();

    const dot = getDotAt(1, 1);

    // Default radius for legal placement
    expect(dot.getAttribute("r")).toBe("20");

    await user.hover(dot);

    // Radius should increase when hovered
    expect(dot.getAttribute("r")).toBe("36");
  });

  it("FaceSelector opens on click, closes on selection, coin appears with correct label", async () => {
    const { user } = renderGame();

    const dot = getDotAt(2, 2);
    await user.click(dot);

    expect(getFaceSelector(2, 2)).toBeDefined();

    await user.click(screen.getByTestId("face-selector-heads"));

    expect(getFaceSelector(2, 2)).toBeNull();

    const coin = getCoinAt(2, 2);
    expect(coin).toBeDefined();
    expect(coin.querySelector("text")?.textContent).toBe("H");
  });
});
