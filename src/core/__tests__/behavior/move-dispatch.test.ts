import { describe, expect, it } from "vitest";
import { applyMove } from "../../move";
import { createInitialState } from "../../state";

describe("Move dispatch", () => {
  describe("PLACE", () => {
    it("places a coin and updates state correctly", () => {
      const state = createInitialState();
      const next = applyMove(state, {
        type: "PLACE",
        position: { row: 0, col: 0 },
        face: "heads",
      });
      expect(next.coins.size).toBe(1);
      expect(next.coinsRemaining).toBe(11);
      expect(next.coins.get("0,0")?.face).toBe("heads");
      expect(next.currentPlayer).toBe("TAILS");
      expect(next.passCount).toBe(0);
      expect(next.lastAction).toBe("PLACE");
    });

    it("throws for an occupied position", () => {
      let state = createInitialState();
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      expect(() =>
        applyMove(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "tails" }),
      ).toThrow("Occupied");
    });

    it("throws when supply is exhausted", () => {
      let state = createInitialState();
      for (let i = 0; i < 12; i++) {
        state = applyMove(state, {
          type: "PLACE",
          position: { row: i % 7, col: Math.floor(i / 7) },
          face: "heads",
        });
      }
      expect(state.coinsRemaining).toBe(0);
      expect(() =>
        applyMove(state, { type: "PLACE", position: { row: 6, col: 6 }, face: "heads" }),
      ).toThrow("No coins");
    });
  });

  describe("simple JOIN", () => {
    it("adds an edge and flips both endpoints", () => {
      let state = createInitialState();
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 3 }, face: "tails" });
      const next = applyMove(state, {
        type: "JOIN",
        a: { row: 0, col: 0 },
        b: { row: 0, col: 3 },
      });
      expect(next.edges).toHaveLength(1);
      expect(next.coins.get("0,0")?.face).toBe("tails");
      expect(next.coins.get("0,3")?.face).toBe("heads");
      expect(next.currentPlayer).toBe("TAILS");
      expect(next.passCount).toBe(0);
      expect(next.lastAction).toBe("JOIN");
    });

    it("throws for an illegal join (non-queen-line)", () => {
      let state = createInitialState();
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 2, col: 3 }, face: "tails" });
      expect(() =>
        applyMove(state, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 2, col: 3 } }),
      ).toThrow("Illegal join");
    });

    it("throws for a duplicate edge", () => {
      let state = createInitialState();
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 3 }, face: "tails" });
      state = applyMove(state, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 3 } });
      expect(() =>
        applyMove(state, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 3 } }),
      ).toThrow("Illegal join");
    });
  });

  describe("PASS", () => {
    it("increments passCount and switches player", () => {
      const state = createInitialState();
      const next = applyMove(state, { type: "PASS" });
      expect(next.passCount).toBe(1);
      expect(next.currentPlayer).toBe("TAILS");
      expect(next.lastAction).toBe("PASS");
      expect(next.coinsRemaining).toBe(12);
      expect(next.coins.size).toBe(0);
      expect(next.edges).toHaveLength(0);
    });

    it("increments passCount twice in a row", () => {
      let state = createInitialState();
      state = applyMove(state, { type: "PASS" });
      state = applyMove(state, { type: "PASS" });
      expect(state.passCount).toBe(2);
      expect(state.currentPlayer).toBe("HEADS");
    });
  });
});
