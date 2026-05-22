// @vitest-environment jsdom
import { act, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeCycleBoardState } from "./helpers/fixtures";
import { renderGame } from "./helpers/render-game";
import { getCoinAt, getDotAt, getEdgeBetween, getFaceSelector } from "./helpers/selectors";

describe("Cycle Closure (US3)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("closing a square cycle flips interior and endpoint coins", async () => {
    const state = makeCycleBoardState();
    const { user } = renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    // Close the cycle: join (4,2) → (2,2)
    const coin42 = getCoinAt(4, 2);
    const coin22 = getCoinAt(2, 2);

    await user.click(coin42);
    await user.click(coin22);

    // Edge should appear
    expect(getEdgeBetween({ row: 4, col: 2 }, { row: 2, col: 2 })).toBeDefined();

    // Endpoint coins flipped:
    // (4,2) was placed tails → flipped to heads by edge (4,4)-(4,2)
    // → flipped back to tails by cycle-closing edge (4,2)-(2,2)
    expect(getCoinAt(4, 2).querySelector("text")?.textContent).toBe("T");
    // (2,2) was placed heads → flipped to tails by edge (2,2)-(2,4)
    // → flipped back to heads by cycle-closing edge (4,2)-(2,2)
    expect(getCoinAt(2, 2).querySelector("text")?.textContent).toBe("H");

    // Interior coin flipped: (3,3) was heads → tails
    expect(getCoinAt(3, 3).querySelector("text")?.textContent).toBe("T");
  });

  it("applies coin-flipping class after cycle-closing JOIN", async () => {
    const state = makeCycleBoardState();
    const { user } = renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    await user.click(getCoinAt(4, 2));
    await user.click(getCoinAt(2, 2));

    // All three flipped coins should have the animation class
    expect(getCoinAt(4, 2).classList.contains("coin-flipping")).toBe(true);
    expect(getCoinAt(2, 2).classList.contains("coin-flipping")).toBe(true);
    expect(getCoinAt(3, 3).classList.contains("coin-flipping")).toBe(true);
  });

  it("blocks input during the 500ms flip animation", () => {
    vi.useFakeTimers();
    const state = makeCycleBoardState();
    renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    // Close the cycle to trigger animation (use fireEvent because fake timers are active)
    fireEvent.click(getCoinAt(4, 2));
    fireEvent.click(getCoinAt(2, 2));

    // Animation is running
    expect(getCoinAt(4, 2).classList.contains("coin-flipping")).toBe(true);

    // Clicks during animation should be ignored by GamePage
    const emptyDot = getDotAt(0, 0);
    fireEvent.click(emptyDot);
    expect(getFaceSelector(0, 0)).toBeNull();

    const coin = getCoinAt(2, 4);
    fireEvent.click(coin);
    expect(coin.classList.contains("coin-selected")).toBe(false);

    // After animation completes, input should work again
    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(emptyDot);
    expect(getFaceSelector(0, 0)).not.toBeNull();
  });
});
