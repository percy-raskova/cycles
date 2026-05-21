import { describe, expect, it } from "vitest";
import { createInitialState, legalJoins, legalPlacements, placeCoin } from "../state";

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
});

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
