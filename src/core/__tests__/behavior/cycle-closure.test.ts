import { describe, expect, it } from "vitest";
import { applyMove, coinsInsideCycle, findCycle } from "../../move";
import { createInitialState } from "../../state";
import type { Position } from "../../types";

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

    // All coins in the enclosed region should have flipped
    expect(next.coins.get("2,2")?.face).toBe("tails"); // interior
    expect(next.coins.get("1,1")?.face).toBe("heads"); // boundary
    expect(next.coins.get("1,4")?.face).toBe("heads"); // boundary
    expect(next.coins.get("4,4")?.face).toBe("tails"); // boundary
    expect(next.coins.get("4,1")?.face).toBe("tails"); // boundary
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

    // All boundary coins should flip when a cycle closes, even with empty interior
    expect(next.coins.get("1,1")?.face).toBe("heads");
    expect(next.coins.get("1,4")?.face).toBe("heads");
    expect(next.coins.get("4,4")?.face).toBe("tails");
    expect(next.coins.get("4,1")?.face).toBe("tails");
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

    // Interior coins flipped
    expect(next.coins.get("2,2")?.face).toBe("tails");
    expect(next.coins.get("3,3")?.face).toBe("heads");
    // Boundary coins also flipped
    expect(next.coins.get("1,1")?.face).toBe("heads");
    expect(next.coins.get("1,5")?.face).toBe("heads");
    expect(next.coins.get("5,5")?.face).toBe("tails");
    expect(next.coins.get("5,1")?.face).toBe("tails");
  });

  it("flips boundary coins that are NOT the closing edge endpoints", () => {
    let state = createInitialState();
    // Build a rectangle: (1,1)-(1,3)-(3,3)-(3,1)
    // Place coins on all four corners plus one interior
    state = applyMove(state, { type: "PLACE", position: { row: 1, col: 1 }, face: "heads" });
    state = applyMove(state, { type: "PLACE", position: { row: 1, col: 3 }, face: "tails" });
    state = applyMove(state, { type: "PLACE", position: { row: 3, col: 3 }, face: "heads" });
    state = applyMove(state, { type: "PLACE", position: { row: 3, col: 1 }, face: "tails" });
    state = applyMove(state, { type: "PLACE", position: { row: 2, col: 2 }, face: "heads" });

    // Connect three sides
    state = applyMove(state, { type: "JOIN", a: { row: 1, col: 1 }, b: { row: 1, col: 3 } });
    state = applyMove(state, { type: "JOIN", a: { row: 1, col: 3 }, b: { row: 3, col: 3 } });
    state = applyMove(state, { type: "JOIN", a: { row: 3, col: 3 }, b: { row: 3, col: 1 } });

    // Before closure:
    // (1,1) heads→tails (first join), (1,3) tails→heads→tails (join 1 & 2)
    // (3,3) heads→tails→heads (join 2 & 3), (3,1) tails→heads (join 3)
    // (2,2) heads (never flipped)

    // Close with edge (3,1)-(1,1). Boundary coins (1,3) and (3,3) are NOT endpoints.
    const next = applyMove(state, {
      type: "JOIN",
      a: { row: 3, col: 1 },
      b: { row: 1, col: 1 },
    });

    // Cycle closure flips EVERY coin in the region once
    expect(next.coins.get("1,1")?.face).toBe("heads"); // endpoint: tails→heads
    expect(next.coins.get("1,3")?.face).toBe("heads"); // boundary (not endpoint): tails→heads — was the bug
    expect(next.coins.get("3,3")?.face).toBe("tails"); // boundary (not endpoint): heads→tails
    expect(next.coins.get("3,1")?.face).toBe("tails"); // endpoint: heads→tails
    expect(next.coins.get("2,2")?.face).toBe("tails"); // interior: heads→tails
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

  describe("coinsInsideCycle", () => {
    it.each([
      {
        name: "square with empty interior",
        vertices: [
          { row: 1, col: 1 },
          { row: 1, col: 4 },
          { row: 4, col: 4 },
          { row: 4, col: 1 },
        ],
        interiorCoins: [],
        boundaryCoins: [
          { row: 1, col: 1 },
          { row: 1, col: 4 },
          { row: 4, col: 4 },
          { row: 4, col: 1 },
        ],
        outsideCoins: [
          { row: 0, col: 0 },
          { row: 5, col: 5 },
        ],
      },
      {
        name: "square with interior and two boundary extras",
        vertices: [
          { row: 1, col: 1 },
          { row: 1, col: 4 },
          { row: 4, col: 4 },
          { row: 4, col: 1 },
        ],
        interiorCoins: [{ row: 2, col: 2 }],
        boundaryCoins: [
          { row: 1, col: 1 },
          { row: 1, col: 4 },
          { row: 4, col: 4 },
          { row: 4, col: 1 },
          { row: 2, col: 1 },
          { row: 1, col: 2 },
        ],
        outsideCoins: [{ row: 0, col: 0 }],
      },
      {
        name: "triangle",
        vertices: [
          { row: 0, col: 0 },
          { row: 0, col: 4 },
          { row: 4, col: 0 },
        ],
        interiorCoins: [{ row: 1, col: 1 }],
        boundaryCoins: [
          { row: 0, col: 0 },
          { row: 0, col: 4 },
          { row: 4, col: 0 },
          { row: 2, col: 2 },
        ],
        outsideCoins: [{ row: 5, col: 5 }],
      },
      {
        name: "diagonal square (diamond)",
        vertices: [
          { row: 2, col: 0 },
          { row: 4, col: 2 },
          { row: 2, col: 4 },
          { row: 0, col: 2 },
        ],
        interiorCoins: [{ row: 2, col: 2 }],
        boundaryCoins: [
          { row: 2, col: 0 },
          { row: 4, col: 2 },
          { row: 2, col: 4 },
          { row: 0, col: 2 },
          { row: 1, col: 1 },
          { row: 3, col: 3 },
        ],
        outsideCoins: [{ row: 0, col: 0 }],
      },
    ])(
      "$name — returns boundary + interior coins",
      ({ vertices, interiorCoins, boundaryCoins, outsideCoins }) => {
        let state = createInitialState();

        // Place all coins (must stay within TOTAL_COINS = 12)
        const allCoins = [...interiorCoins, ...boundaryCoins, ...outsideCoins];
        for (const pos of allCoins) {
          state = applyMove(state, { type: "PLACE", position: pos, face: "heads" });
        }

        const first = vertices[0];
        if (!first) throw new Error("vertices array is empty");
        const cyclePath: Position[] = [...vertices, first]; // close the polygon
        const result = coinsInsideCycle(state, cyclePath);
        const resultKeys = new Set(result.map((p) => `${p.row},${p.col}`));

        const expected = new Set([
          ...interiorCoins.map((p) => `${p.row},${p.col}`),
          ...boundaryCoins.map((p) => `${p.row},${p.col}`),
        ]);

        expect(resultKeys).toEqual(expected);

        for (const pos of outsideCoins) {
          expect(resultKeys.has(`${pos.row},${pos.col}`)).toBe(false);
        }
      },
    );
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
