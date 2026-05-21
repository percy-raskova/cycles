import { describe, expect, it } from "vitest";
import { createInitialState, placeCoin } from "../state";

describe("board", () => {
  describe("createInitialState", () => {
    it("creates a 7x7 empty board with 12 coins available", () => {
      const state = createInitialState();
      expect(state.coins.size).toBe(0);
      expect(state.coinsRemaining).toBe(12);
      expect(state.currentPlayer).toBe("HEADS");
      expect(state.lastAction).toBeNull();
    });

    it("allows overriding the first player", () => {
      const state = createInitialState("TAILS");
      expect(state.currentPlayer).toBe("TAILS");
    });
  });

  describe("placeCoin", () => {
    it("places a coin and reduces supply", () => {
      const state = createInitialState();
      const next = placeCoin(state, { row: 3, col: 3 }, "heads");
      expect(next.coins.size).toBe(1);
      expect(next.coinsRemaining).toBe(11);
      expect(next.coins.get("3,3")?.face).toBe("heads");
    });

    it("switches player after placing", () => {
      const state = createInitialState();
      const next = placeCoin(state, { row: 0, col: 0 }, "heads");
      expect(next.currentPlayer).toBe("TAILS");
    });

    it("rejects placement on occupied intersections", () => {
      const state = placeCoin(createInitialState(), { row: 0, col: 0 }, "heads");
      expect(() => placeCoin(state, { row: 0, col: 0 }, "tails")).toThrow("Occupied");
    });

    it("rejects placement outside the grid", () => {
      expect(() => placeCoin(createInitialState(), { row: 7, col: 3 }, "heads")).toThrow("Invalid");
      expect(() => placeCoin(createInitialState(), { row: -1, col: 0 }, "heads")).toThrow(
        "Invalid",
      );
    });

    it("rejects placement when supply is exhausted", () => {
      let state = createInitialState();
      for (let i = 0; i < 12; i++) {
        state = placeCoin(state, { row: i % 7, col: Math.floor(i / 7) }, "heads");
      }
      expect(state.coinsRemaining).toBe(0);
      expect(() => placeCoin(state, { row: 6, col: 6 }, "heads")).toThrow("No coins");
    });
  });
});
