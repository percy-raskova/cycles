import { describe, expect, it } from "vitest";
import { allLegalMoves } from "../../bots/legal-moves";
import { applyMove } from "../../move";
import { createInitialState, joinCoins, legalJoins, placeCoin } from "../../state";

describe("allLegalMoves", () => {
  it("returns PLACE moves on empty board", () => {
    const state = createInitialState("HEADS");
    const moves = allLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((m) => m.type === "PLACE")).toBe(true);
    expect(moves).toHaveLength(98); // all 49 positions × 2 faces
  });

  it("returns JOIN moves when coins exist and can be joined", () => {
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");

    const moves = allLegalMoves(state);
    const joins = moves.filter((m) => m.type === "JOIN");
    expect(joins.length).toBeGreaterThan(0);
  });

  it("returns empty array when no legal moves exist", () => {
    let state = createInitialState("HEADS");
    // Exhaust all coins
    for (let i = 0; i < 12; i++) {
      state = placeCoin(state, { row: i % 7, col: Math.floor(i / 7) }, "heads");
    }
    // Exhaust all joins
    while (true) {
      const joins = legalJoins(state);
      if (joins.length === 0) break;
      const pair = joins[0];
      if (!pair) break;
      const [a, b] = pair;
      state = joinCoins(state, a, b);
    }

    const moves = allLegalMoves(state);
    expect(moves).toHaveLength(0);
  });

  it("combines placements and joins into a single array", () => {
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");

    const moves = allLegalMoves(state);
    const placements = moves.filter((m) => m.type === "PLACE");
    const joins = moves.filter((m) => m.type === "JOIN");

    expect(placements.length).toBeGreaterThan(0);
    expect(joins.length).toBeGreaterThan(0);
    expect(moves.length).toBe(placements.length + joins.length);
  });

  it("returns only moves that applyMove accepts without throwing (property check)", () => {
    let state = createInitialState("HEADS");
    // Build a mid-game state
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");
    state = placeCoin(state, { row: 2, col: 0 }, "heads");

    const moves = allLegalMoves(state);
    for (const move of moves) {
      expect(() => applyMove(state, move)).not.toThrow();
    }
  });

  it("does not mutate state", () => {
    const state = createInitialState("HEADS");
    const originalCoins = new Map(state.coins);
    const originalEdges = [...state.edges];
    allLegalMoves(state);
    expect(state.coins).toEqual(originalCoins);
    expect(state.edges).toEqual(originalEdges);
  });
});
