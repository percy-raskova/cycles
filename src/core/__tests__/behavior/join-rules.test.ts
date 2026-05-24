import { describe, expect, it } from "vitest";
import {
  canJoin,
  createInitialState,
  isLegalJoin,
  joinCoins,
  legalJoins,
  placeCoin,
} from "../../state";

describe("Join rules", () => {
  describe("legalJoins", () => {
    it("returns empty list when no coins are on the board", () => {
      const state = createInitialState();
      expect(legalJoins(state)).toHaveLength(0);
    });

    it("includes aligned coins with no blocking coin", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      const joins = legalJoins(state);
      expect(joins).toHaveLength(1);
      expect(joins[0]).toEqual([
        { row: 0, col: 0 },
        { row: 0, col: 3 },
      ]);
    });

    it("excludes pairs blocked by an intermediate coin", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 2 }, "tails");
      state = placeCoin(state, { row: 0, col: 4 }, "heads");
      const joins = legalJoins(state);
      expect(joins.some(([a, b]) => a.row === 0 && a.col === 0 && b.row === 0 && b.col === 4)).toBe(
        false,
      );
    });

    it("excludes duplicate edges", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      state = {
        ...state,
        edges: [{ from: { row: 0, col: 0 }, to: { row: 0, col: 3 } }],
      };
      const joins = legalJoins(state);
      expect(joins).toHaveLength(0);
    });

    it("excludes edges that would cross an existing edge", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 2, col: 2 }, "tails");
      state = placeCoin(state, { row: 0, col: 2 }, "heads");
      state = placeCoin(state, { row: 2, col: 0 }, "tails");
      state = {
        ...state,
        edges: [{ from: { row: 0, col: 0 }, to: { row: 2, col: 2 } }],
      };
      const joins = legalJoins(state);
      expect(joins.some(([a, b]) => a.row === 0 && a.col === 2 && b.row === 2 && b.col === 0)).toBe(
        false,
      );
    });

    it("excludes non-queen-line pairs", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 2, col: 3 }, "tails");
      const joins = legalJoins(state);
      expect(joins).toHaveLength(0);
    });

    it("allows adjacent coins on the same row", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 1 }, "tails");
      const joins = legalJoins(state);
      expect(joins).toHaveLength(1);
    });

    it("allows joins that share an endpoint with an existing edge", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 2 }, "tails");
      state = placeCoin(state, { row: 0, col: 4 }, "heads");
      state = {
        ...state,
        edges: [{ from: { row: 0, col: 0 }, to: { row: 0, col: 2 } }],
      };
      const joins = legalJoins(state);
      expect(joins.some(([a, b]) => a.row === 0 && a.col === 2 && b.row === 0 && b.col === 4)).toBe(
        true,
      );
    });
  });

  describe("isLegalJoin edge cases", () => {
    it("rejects collinear overlapping edges", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 2, col: 0 }, "tails");
      state = placeCoin(state, { row: 3, col: 0 }, "heads");
      state = placeCoin(state, { row: 5, col: 0 }, "tails");
      state = {
        ...state,
        edges: [{ from: { row: 0, col: 0 }, to: { row: 3, col: 0 } }],
      };
      expect(isLegalJoin(state, { row: 2, col: 0 }, { row: 5, col: 0 })).toBe(false);
    });

    it("rejects crossing diagonal edges", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 2, col: 2 }, "tails");
      state = placeCoin(state, { row: 0, col: 2 }, "heads");
      state = placeCoin(state, { row: 2, col: 0 }, "tails");
      state = {
        ...state,
        edges: [{ from: { row: 0, col: 0 }, to: { row: 2, col: 2 } }],
      };
      expect(isLegalJoin(state, { row: 0, col: 2 }, { row: 2, col: 0 })).toBe(false);
    });

    it("allows boundary rank/file joins", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 6 }, "tails");
      expect(isLegalJoin(state, { row: 0, col: 0 }, { row: 0, col: 6 })).toBe(true);
    });

    it("rejects diagonal edge passing through intermediate coin", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 1, col: 1 }, "tails");
      state = placeCoin(state, { row: 2, col: 2 }, "heads");
      expect(isLegalJoin(state, { row: 0, col: 0 }, { row: 2, col: 2 })).toBe(false);
    });

    it("rejects reversed duplicate edge", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      state = {
        ...state,
        edges: [{ from: { row: 0, col: 0 }, to: { row: 0, col: 3 } }],
      };
      expect(isLegalJoin(state, { row: 0, col: 3 }, { row: 0, col: 0 })).toBe(false);
    });

    it("rejects non-queen-line pairs (knight move)", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 1, col: 2 }, "tails");
      expect(isLegalJoin(state, { row: 0, col: 0 }, { row: 1, col: 2 })).toBe(false);
    });
  });

  describe("canJoin and joinCoins", () => {
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

    it("flips the two endpoint coins on a non-cycle join", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      const next = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 3 });
      expect(next.coins.get("0,0")?.face).toBe("tails");
      expect(next.coins.get("0,3")?.face).toBe("heads");
    });

    it("switches player after joining", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      const next = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 3 });
      expect(next.currentPlayer).toBe("TAILS");
    });

    it("records the action", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 3 }, "tails");
      const next = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 3 });
      expect(next.lastAction).toBe("JOIN");
    });
  });
});
