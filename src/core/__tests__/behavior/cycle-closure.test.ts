import { describe, expect, it } from "vitest";
import { applyMove, findCycle } from "../../move";
import { createInitialState } from "../../state";

describe("Cycle closure", () => {
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

    expect(state.coins.get("2,2")?.face).toBe("heads");

    // Close the rectangle — creates a cycle
    const next = applyMove(state, {
      type: "JOIN",
      a: { row: 4, col: 1 },
      b: { row: 1, col: 1 },
    });

    // Interior coin should have flipped: heads → tails
    expect(next.coins.get("2,2")?.face).toBe("tails");
    // Endpoints should have flipped too
    expect(next.coins.get("4,1")?.face).toBe("tails");
    expect(next.coins.get("1,1")?.face).toBe("heads");
  });

  it("only flips endpoints when interior is empty", () => {
    let state = createInitialState();
    state = applyMove(state, { type: "PLACE", position: { row: 1, col: 1 }, face: "heads" });
    state = applyMove(state, { type: "PLACE", position: { row: 1, col: 4 }, face: "tails" });
    state = applyMove(state, { type: "PLACE", position: { row: 4, col: 4 }, face: "heads" });
    state = applyMove(state, { type: "PLACE", position: { row: 4, col: 1 }, face: "tails" });

    state = applyMove(state, { type: "JOIN", a: { row: 1, col: 1 }, b: { row: 1, col: 4 } });
    state = applyMove(state, { type: "JOIN", a: { row: 1, col: 4 }, b: { row: 4, col: 4 } });
    state = applyMove(state, { type: "JOIN", a: { row: 4, col: 4 }, b: { row: 4, col: 1 } });

    const next = applyMove(state, {
      type: "JOIN",
      a: { row: 4, col: 1 },
      b: { row: 1, col: 1 },
    });

    expect(next.coins.get("4,1")?.face).toBe("tails");
    expect(next.coins.get("1,1")?.face).toBe("heads");
    expect(next.coins.size).toBe(4);
  });

  it("flips multiple interior coins", () => {
    let state = createInitialState();
    state = applyMove(state, { type: "PLACE", position: { row: 1, col: 1 }, face: "heads" });
    state = applyMove(state, { type: "PLACE", position: { row: 1, col: 5 }, face: "tails" });
    state = applyMove(state, { type: "PLACE", position: { row: 5, col: 5 }, face: "heads" });
    state = applyMove(state, { type: "PLACE", position: { row: 5, col: 1 }, face: "tails" });
    state = applyMove(state, { type: "PLACE", position: { row: 2, col: 2 }, face: "heads" });
    state = applyMove(state, { type: "PLACE", position: { row: 3, col: 3 }, face: "tails" });

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

  it("coins outside the new cycle region remain unchanged", () => {
    let state = createInitialState();
    state = applyMove(state, { type: "PLACE", position: { row: 1, col: 1 }, face: "heads" });
    state = applyMove(state, { type: "PLACE", position: { row: 1, col: 4 }, face: "tails" });
    state = applyMove(state, { type: "PLACE", position: { row: 4, col: 4 }, face: "heads" });
    state = applyMove(state, { type: "PLACE", position: { row: 4, col: 1 }, face: "tails" });
    state = applyMove(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });

    state = applyMove(state, { type: "JOIN", a: { row: 1, col: 1 }, b: { row: 1, col: 4 } });
    state = applyMove(state, { type: "JOIN", a: { row: 1, col: 4 }, b: { row: 4, col: 4 } });
    state = applyMove(state, { type: "JOIN", a: { row: 4, col: 4 }, b: { row: 4, col: 1 } });

    const next = applyMove(state, {
      type: "JOIN",
      a: { row: 4, col: 1 },
      b: { row: 1, col: 1 },
    });

    expect(next.coins.get("0,0")?.face).toBe("heads");
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
      expect(cycle).toHaveLength(3);
    });

    it("BFS returns simple cycle path including repeated closing vertex", () => {
      let state = createInitialState();
      state = applyMove(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      state = applyMove(state, { type: "PLACE", position: { row: 2, col: 2 }, face: "tails" });
      state = applyMove(state, { type: "PLACE", position: { row: 4, col: 0 }, face: "heads" });

      state = applyMove(state, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 2, col: 2 } });
      state = applyMove(state, { type: "JOIN", a: { row: 2, col: 2 }, b: { row: 4, col: 0 } });

      const cycle = findCycle(state, { row: 4, col: 0 }, { row: 0, col: 0 });
      expect(cycle).not.toBeNull();
      expect(cycle).toHaveLength(4);

      const uniqueVertices = new Set(cycle?.map((p) => `${p.row},${p.col}`));
      expect(uniqueVertices.size).toBe(3);
    });
  });
});
