import { createInitialState, placeCoin } from "@core";
import { joinCoins } from "@core/state";
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { makeCycleBoardState } from "./helpers/fixtures";
import { renderGame } from "./helpers/render-game";
import { getCoinAt, getEdgeBetween } from "./helpers/selectors";

// "blocks input during the 500ms flip animation" was deleted along with the flip
// animation itself — coins change face in place via a normal re-render, and there
// is no longer an animation window during which input is gated.

describe("Cycle Edge Cases", () => {
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
});
