import { describe, expect, it } from "vitest";
import { applyMove, findCycle } from "../move";
import { createInitialState, legalJoins, legalPlacements, placeCoin } from "../state";

describe("applyMove", () => {
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

  describe("simple JOIN (no cycle)", () => {
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

  describe("cyclic JOIN", () => {
    it("flips interior coin in a rectangle cycle", () => {
      let state = createInitialState();
      // Place 5 coins: rectangle corners + interior
      state = applyMove(state, { type: "PLACE", position: { row: 1, col: 1 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 1, col: 4 }, face: "tails" });
      state = applyMove(state, { type: "PLACE", position: { row: 4, col: 4 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 4, col: 1 }, face: "tails" });
      state = applyMove(state, { type: "PLACE", position: { row: 2, col: 2 }, face: "heads" });

      // Connect three sides (each JOIN flips its endpoints)
      state = applyMove(state, { type: "JOIN", a: { row: 1, col: 1 }, b: { row: 1, col: 4 } });
      state = applyMove(state, { type: "JOIN", a: { row: 1, col: 4 }, b: { row: 4, col: 4 } });
      state = applyMove(state, { type: "JOIN", a: { row: 4, col: 4 }, b: { row: 4, col: 1 } });

      // Before closing: (1,1)=tails, (1,4)=tails, (4,4)=heads, (4,1)=heads, (2,2)=heads
      expect(state.coins.get("2,2")?.face).toBe("heads");

      // Close the rectangle — creates a cycle
      const next = applyMove(state, {
        type: "JOIN",
        a: { row: 4, col: 1 },
        b: { row: 1, col: 1 },
      });

      // Interior coin should have flipped: heads → tails
      expect(next.coins.get("2,2")?.face).toBe("tails");
      // Endpoints should have flipped too: (4,1)=heads→tails, (1,1)=tails→heads
      expect(next.coins.get("4,1")?.face).toBe("tails");
      expect(next.coins.get("1,1")?.face).toBe("heads");
    });

    it("only flips endpoints when interior is empty", () => {
      let state = createInitialState();
      // Place 4 coins: rectangle corners only
      state = applyMove(state, { type: "PLACE", position: { row: 1, col: 1 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 1, col: 4 }, face: "tails" });
      state = applyMove(state, { type: "PLACE", position: { row: 4, col: 4 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 4, col: 1 }, face: "tails" });

      // Connect three sides (each JOIN flips its endpoints)
      state = applyMove(state, { type: "JOIN", a: { row: 1, col: 1 }, b: { row: 1, col: 4 } });
      state = applyMove(state, { type: "JOIN", a: { row: 1, col: 4 }, b: { row: 4, col: 4 } });
      state = applyMove(state, { type: "JOIN", a: { row: 4, col: 4 }, b: { row: 4, col: 1 } });

      // Before closing: (1,1)=tails, (1,4)=tails, (4,4)=heads, (4,1)=heads

      // Close the rectangle
      const next = applyMove(state, {
        type: "JOIN",
        a: { row: 4, col: 1 },
        b: { row: 1, col: 1 },
      });

      // Endpoints flipped: (4,1)=heads→tails, (1,1)=tails→heads
      expect(next.coins.get("4,1")?.face).toBe("tails");
      expect(next.coins.get("1,1")?.face).toBe("heads");
      expect(next.coins.size).toBe(4);
    });

    it("flips multiple interior coins", () => {
      let state = createInitialState();
      // Rectangle corners
      state = applyMove(state, { type: "PLACE", position: { row: 1, col: 1 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 1, col: 5 }, face: "tails" });
      state = applyMove(state, { type: "PLACE", position: { row: 5, col: 5 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 5, col: 1 }, face: "tails" });
      // Two interior coins
      state = applyMove(state, { type: "PLACE", position: { row: 2, col: 2 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 3, col: 3 }, face: "tails" });

      // Connect three sides
      state = applyMove(state, { type: "JOIN", a: { row: 1, col: 1 }, b: { row: 1, col: 5 } });
      state = applyMove(state, { type: "JOIN", a: { row: 1, col: 5 }, b: { row: 5, col: 5 } });
      state = applyMove(state, { type: "JOIN", a: { row: 5, col: 5 }, b: { row: 5, col: 1 } });

      const next = applyMove(state, {
        type: "JOIN",
        a: { row: 5, col: 1 },
        b: { row: 1, col: 1 },
      });

      expect(next.coins.get("2,2")?.face).toBe("tails");
      expect(next.coins.get("3,3")?.face).toBe("heads");
    });
  });

  describe("findCycle", () => {
    it("returns null when endpoints are in different components", () => {
      let state = createInitialState();
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 3 }, face: "tails" });
      expect(findCycle(state, { row: 0, col: 0 }, { row: 0, col: 3 })).toBeNull();
    });

    it("returns the cycle path when endpoints are in the same component", () => {
      let state = createInitialState();
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 3 }, face: "tails" });
      state = applyMove(state, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 3 } });

      const cycle = findCycle(state, { row: 0, col: 0 }, { row: 0, col: 3 });
      expect(cycle).not.toBeNull();
      expect(cycle).toHaveLength(3); // [b, a, a] or path + closing vertex
    });
  });
});
