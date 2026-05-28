// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { makeCycleBoardState } from "./helpers/fixtures";
import { renderGame } from "./helpers/render-game";
import { getCoinAt, getEdgeBetween } from "./helpers/selectors";

// Animation-dependent tests ("applies coin-flipping class …", "blocks input during
// the 500ms flip animation") were removed when the flip animation was deleted —
// coins now change face in place via a normal re-render. The engine-level flip
// behavior (cycle closure → face inversion of enclosed coins) is asserted below
// via the rendered glyph (H/T), which is the user-observable outcome.

describe("Cycle Closure (US3)", () => {
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
});
