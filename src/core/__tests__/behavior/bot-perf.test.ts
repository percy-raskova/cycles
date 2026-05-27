import { describe, expect, it } from "vitest";
import { greedyBot, randomBot } from "../../bots";
import { createInitialState, joinCoins, placeCoin } from "../../state";

describe("bot performance", () => {
  function buildWorstCaseState() {
    let state = createInitialState("HEADS");
    // Place all 12 coins
    for (let i = 0; i < 12; i++) {
      state = placeCoin(
        state,
        { row: i % 7, col: Math.floor(i / 7) },
        i % 2 === 0 ? "heads" : "tails",
      );
    }
    // Add as many joins as possible without completing cycles
    const joinPairs: [number, number][] = [
      [0, 2],
      [2, 4],
      [4, 6],
      [6, 8],
      [8, 10],
      [10, 0],
    ];
    for (const [aIdx, bIdx] of joinPairs) {
      try {
        const a = { row: aIdx % 7, col: Math.floor(aIdx / 7) };
        const b = { row: bIdx % 7, col: Math.floor(bIdx / 7) };
        state = joinCoins(state, a, b);
      } catch {
        // Skip illegal joins
      }
    }
    return state;
  }

  it("randomBot completes move selection within 100ms (T044)", () => {
    const state = buildWorstCaseState();
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      randomBot(state);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 100).toBeLessThan(100);
  });

  it("greedyBot completes move selection within 100ms (T044)", () => {
    const state = buildWorstCaseState();
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      greedyBot(state);
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 100).toBeLessThan(100);
  });
});
