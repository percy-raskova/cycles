import { describe, expect, it } from "vitest";
import { greedyBot } from "../../bots/greedy";
import { allLegalMoves } from "../../bots/legal-moves";
import { randomBot } from "../../bots/random";
import { applyMove } from "../../move";
import { scoreForPlayer } from "../../score";
import { createInitialState, joinCoins, placeCoin } from "../../state";

function buildRandomState(maxCoins: number): ReturnType<typeof createInitialState> {
  let state = createInitialState(Math.random() > 0.5 ? "HEADS" : "TAILS");
  const numCoins = Math.floor(Math.random() * (maxCoins + 1));
  for (let c = 0; c < numCoins; c++) {
    const legal = allLegalMoves(state);
    if (legal.length === 0) break;
    const placeMoves = legal.filter((m) => m.type === "PLACE");
    if (placeMoves.length === 0) break;
    const idx = Math.floor(Math.random() * placeMoves.length);
    const move = placeMoves[idx];
    if (!move) break;
    state = applyMove(state, move);
  }
  return state;
}

describe("randomBot", () => {
  it("returns a legal move for a mid-game state (T010)", () => {
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");
    state = placeCoin(state, { row: 2, col: 0 }, "heads");

    const move = randomBot(state);
    expect(() => applyMove(state, move)).not.toThrow();
  });

  it("never returns an illegal move across many random states (T011)", () => {
    for (let i = 0; i < 100; i++) {
      const state = buildRandomState(12);
      if (allLegalMoves(state).length > 0) {
        const move = randomBot(state);
        expect(() => applyMove(state, move)).not.toThrow();
      }
    }
  });

  it("selects uniformly from all legal moves (T012)", () => {
    // Construct a state with exactly 2 legal moves
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");

    const legal = allLegalMoves(state);
    expect(legal.length).toBeGreaterThanOrEqual(2);

    const counts = new Map<string, number>();
    const samples = 5000;
    for (let i = 0; i < samples; i++) {
      const move = randomBot(state);
      const key = JSON.stringify(move);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // Every legal move should appear at least once
    for (const expectedMove of legal) {
      const key = JSON.stringify(expectedMove);
      expect(counts.has(key)).toBe(true);
    }

    // No move should be selected more than 3x the expected frequency
    const expected = samples / legal.length;
    for (const count of counts.values()) {
      expect(count).toBeLessThan(expected * 3);
    }

    // Chi-squared uniformity test with 95% confidence
    let chiSq = 0;
    for (const count of counts.values()) {
      chiSq += (count - expected) ** 2 / expected;
    }
    const degreesOfFreedom = legal.length - 1;
    // Use a more generous critical value for high df (approximate)
    const criticalValue = degreesOfFreedom * 1.5 + 2;
    expect(chiSq).toBeLessThan(criticalValue);
  });

  it("does not mutate input state", () => {
    const state = createInitialState("HEADS");
    const originalCoins = new Map(state.coins);
    const originalEdges = [...state.edges];
    randomBot(state);
    expect(state.coins).toEqual(originalCoins);
    expect(state.edges).toEqual(originalEdges);
  });

  it("throws Error when called with invalid state (T046)", () => {
    const invalidState = {
      ...createInitialState("HEADS"),
      coins: null as unknown as typeof createInitialState extends () => infer R ? R : never,
    };
    expect(() => randomBot(invalidState as unknown as Parameters<typeof randomBot>[0])).toThrow();
  });
});

describe("greedyBot", () => {
  it("picks the move with highest score delta in a constructed state (T019)", () => {
    // Setup: HEADS to move. Two placements available. One gives HEADS more coins.
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");

    const move = greedyBot(state);
    expect(() => applyMove(state, move)).not.toThrow();

    // Verify the chosen move actually maximizes score
    const before = scoreForPlayer(state, state.currentPlayer);
    const afterState = applyMove(state, move);
    const after = scoreForPlayer(afterState, state.currentPlayer);
    const actualDelta = after - before;

    let maxDelta = Number.NEGATIVE_INFINITY;
    for (const candidate of allLegalMoves(state)) {
      const candidateState = applyMove(state, candidate);
      const candidateScore = scoreForPlayer(candidateState, state.currentPlayer);
      const delta = candidateScore - before;
      if (delta > maxDelta) maxDelta = delta;
    }

    expect(actualDelta).toBe(maxDelta);
  });

  it("tie-breaking is deterministic (stable evaluation order) (T020)", () => {
    // Empty board: all placements yield the same delta (+1 for placing own face)
    const state = createInitialState("HEADS");

    const move1 = greedyBot(state);
    const move2 = greedyBot(state);

    expect(move1).toEqual(move2);
    // Top-left-to-bottom-right order means (0,0) should be chosen first
    if (move1.type === "PLACE") {
      expect(move1.position).toEqual({ row: 0, col: 0 });
    }
  });

  it("correctly values encirclement payoff (cycle closure flips) (T021)", () => {
    // Build a state where a cycle-closing join is available and verify
    // greedyBot evaluates its delta correctly (including flipped coins).
    let state = createInitialState("HEADS");

    // Place coins forming a square with one opponent coin inside
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "heads");
    state = placeCoin(state, { row: 2, col: 2 }, "tails");
    state = placeCoin(state, { row: 2, col: 0 }, "tails");
    // Place a tails coin inside the square at (1,1)
    state = placeCoin(state, { row: 1, col: 1 }, "tails");
    // Exhaust remaining coins
    for (let i = 5; i < 12; i++) {
      state = placeCoin(state, { row: i % 7, col: Math.floor(i / 7) + 3 }, "heads");
    }

    expect(state.coinsRemaining).toBe(0);

    // Join three sides of the square
    state = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 2 });
    state = joinCoins(state, { row: 0, col: 2 }, { row: 2, col: 2 });
    state = joinCoins(state, { row: 2, col: 2 }, { row: 2, col: 0 });

    const player = state.currentPlayer;
    const before = scoreForPlayer(state, player);

    const move = greedyBot(state);
    expect(() => applyMove(state, move)).not.toThrow();

    // Verify the chosen move maximizes delta among all legal moves
    let maxDelta = Number.NEGATIVE_INFINITY;
    for (const candidate of allLegalMoves(state)) {
      const candidateState = applyMove(state, candidate);
      const candidateScore = scoreForPlayer(candidateState, player);
      const delta = candidateScore - before;
      if (delta > maxDelta) maxDelta = delta;
    }

    const chosenState = applyMove(state, move);
    const chosenDelta = scoreForPlayer(chosenState, player) - before;
    expect(chosenDelta).toBe(maxDelta);
  });

  it("never returns an illegal move (T022)", () => {
    for (let i = 0; i < 50; i++) {
      const state = buildRandomState(12);
      if (allLegalMoves(state).length > 0) {
        const move = greedyBot(state);
        expect(() => applyMove(state, move)).not.toThrow();
      }
    }
  });

  it("does not mutate input state", () => {
    const state = createInitialState("HEADS");
    const originalCoins = new Map(state.coins);
    const originalEdges = [...state.edges];
    greedyBot(state);
    expect(state.coins).toEqual(originalCoins);
    expect(state.edges).toEqual(originalEdges);
  });

  it("throws Error when called with invalid state (T046)", () => {
    const invalidState = {
      ...createInitialState("HEADS"),
      coins: null as unknown as typeof createInitialState extends () => infer R ? R : never,
    };
    expect(() => greedyBot(invalidState as unknown as Parameters<typeof greedyBot>[0])).toThrow();
  });
});
