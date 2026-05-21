import { describe, expect, it } from "vitest";
import { canJoin, createInitialState, joinCoins, placeCoin } from "../game";

describe("game rules", () => {
  describe("canJoin", () => {
    it("allows a join between two coins on a queen-line", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      expect(canJoin(state, { row: 0, col: 0 }, { row: 0, col: 3 })).toBe(true);
    });

    it("rejects joins between empty intersections", () => {
      const state = createInitialState();
      expect(canJoin(state, { row: 0, col: 0 }, { row: 0, col: 3 })).toBe(false);
    });

    it("rejects non-queen-line joins", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 2, col: 3 }, "tails");
      expect(canJoin(state, { row: 0, col: 0 }, { row: 2, col: 3 })).toBe(false);
    });

    it("rejects duplicate edges", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      state = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 3 });
      expect(canJoin(state, { row: 0, col: 0 }, { row: 0, col: 3 })).toBe(false);
    });

    it("rejects edges that pass through another coin", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 2 }, "tails");
      state = placeCoin(state, { row: 0, col: 4 }, "heads");
      expect(canJoin(state, { row: 0, col: 0 }, { row: 0, col: 4 })).toBe(false);
    });
  });

  describe("joinCoins", () => {
    it("flips the two endpoint coins on a non-cycle join", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      state = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 3 });
      expect(state.coins.get("0,0")?.face).toBe("tails");
      expect(state.coins.get("0,3")?.face).toBe("heads");
    });

    it("switches player after joining", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      state = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 3 });
      expect(state.currentPlayer).toBe("TAILS");
    });

    it("records the action", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      state = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 3 });
      expect(state.lastAction).toBe("JOIN");
    });
  });
});
