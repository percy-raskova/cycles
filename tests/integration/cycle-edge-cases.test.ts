import { createInitialState, placeCoin } from "@core";
import { joinCoins } from "@core/state";
// @vitest-environment jsdom
import { act, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeCycleBoardState } from "./helpers/fixtures";
import { renderGame } from "./helpers/render-game";
import { getCoinAt, getDotAt, getEdgeBetween, getFaceSelector } from "./helpers/selectors";

describe("Cycle Edge Cases", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("cycle closure flips interior coin", async () => {
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
    await user.click(getCoinAt(4, 2));
    await user.click(getCoinAt(2, 2));

    expect(getEdgeBetween({ row: 4, col: 2 }, { row: 2, col: 2 })).toBeDefined();

    // Interior coin (3,3) was heads → flipped to tails
    expect(getCoinAt(3, 3).querySelector("text")?.textContent).toBe("T");
  });

  it("cycle closure does not flip a coin on the boundary line", async () => {
    // Build a square with a coin on the boundary line (not a vertex)
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");
    state = placeCoin(state, { row: 2, col: 2 }, "heads");
    state = placeCoin(state, { row: 2, col: 0 }, "tails");
    state = placeCoin(state, { row: 1, col: 0 }, "heads"); // on boundary line (0,0)-(2,0)
    state = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 2 });
    state = joinCoins(state, { row: 0, col: 2 }, { row: 2, col: 2 });
    state = joinCoins(state, { row: 2, col: 2 }, { row: 2, col: 0 });

    const { user } = renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    // Boundary coin should still be heads before closure
    expect(getCoinAt(1, 0).querySelector("text")?.textContent).toBe("H");

    // Close the cycle
    await user.click(getCoinAt(2, 0));
    await user.click(getCoinAt(0, 0));

    // Boundary coin on the line should NOT be flipped
    expect(getCoinAt(1, 0).querySelector("text")?.textContent).toBe("H");
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

    // Clicks during animation should be ignored
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
