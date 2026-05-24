import { describe, expect, it } from "vitest";
import { createInitialState, joinCoins, legalPlacements, placeCoin } from "../../state";

describe("Placement rules", () => {
  describe("legalPlacements", () => {
    it("returns all 49 positions on an empty board", () => {
      const state = createInitialState();
      const placements = legalPlacements(state);
      expect(placements).toHaveLength(49);
    });

    it("returns empty list when supply is exhausted", () => {
      let state = createInitialState();
      for (let i = 0; i < 12; i++) {
        state = placeCoin(state, { row: i % 7, col: Math.floor(i / 7) }, "heads");
      }
      expect(state.coinsRemaining).toBe(0);
      const placements = legalPlacements(state);
      expect(placements).toHaveLength(0);
    });

    it("excludes occupied intersections", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 3, col: 3 }, "tails");
      const placements = legalPlacements(state);
      expect(placements).toHaveLength(47);
      expect(placements.some((p) => p.row === 0 && p.col === 0)).toBe(false);
      expect(placements.some((p) => p.row === 3 && p.col === 3)).toBe(false);
    });

    it("returns empty list when supply is 0 even with empty intersections", () => {
      const state = {
        ...createInitialState(),
        coinsRemaining: 0,
      };
      const placements = legalPlacements(state);
      expect(placements).toHaveLength(0);
    });

    it("excludes positions that lie on the geometric line of an existing edge (FR-013)", () => {
      let state = createInitialState();
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 2 }, "tails");
      state = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 2 });

      // (0,1) is empty but lies on the edge from (0,0) to (0,2)
      const placements = legalPlacements(state);
      expect(placements.some((p) => p.row === 0 && p.col === 1)).toBe(false);

      // Defense-in-depth: placeCoin should also reject it
      expect(() => placeCoin(state, { row: 0, col: 1 }, "heads")).toThrow(
        "Blocked by existing edge",
      );
    });
  });

  describe("placeCoin edge cases", () => {
    it("throws with correct message when supply is exhausted", () => {
      let state = createInitialState();
      for (let i = 0; i < 12; i++) {
        state = placeCoin(state, { row: i % 7, col: Math.floor(i / 7) }, "heads");
      }
      expect(state.coinsRemaining).toBe(0);
      expect(() => placeCoin(state, { row: 5, col: 1 }, "heads")).toThrow("No coins remaining");
    });

    it("throws for out-of-bounds positions", () => {
      const state = createInitialState();
      expect(() => placeCoin(state, { row: -1, col: 0 }, "heads")).toThrow("Invalid position");
      expect(() => placeCoin(state, { row: 0, col: -1 }, "heads")).toThrow("Invalid position");
      expect(() => placeCoin(state, { row: 7, col: 0 }, "heads")).toThrow("Invalid position");
      expect(() => placeCoin(state, { row: 0, col: 7 }, "heads")).toThrow("Invalid position");
    });
  });
});
