import { describe, expect, it } from "vitest";
import { scoreForPlayer } from "../../score";
import { createInitialState, placeCoin } from "../../state";

describe("scoreForPlayer", () => {
  it("returns 0 for empty board", () => {
    const state = createInitialState("HEADS");
    expect(scoreForPlayer(state, "HEADS")).toBe(0);
    expect(scoreForPlayer(state, "TAILS")).toBe(0);
  });

  it("counts coins matching the player's face", () => {
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 1 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");

    expect(scoreForPlayer(state, "HEADS")).toBe(2);
    expect(scoreForPlayer(state, "TAILS")).toBe(1);
  });

  it("counts all heads coins for HEADS player", () => {
    let state = createInitialState("HEADS");
    for (let i = 0; i < 12; i++) {
      state = placeCoin(state, { row: i % 7, col: Math.floor(i / 7) }, "heads");
    }
    expect(scoreForPlayer(state, "HEADS")).toBe(12);
    expect(scoreForPlayer(state, "TAILS")).toBe(0);
  });

  it("counts all tails coins for TAILS player", () => {
    let state = createInitialState("HEADS");
    for (let i = 0; i < 12; i++) {
      state = placeCoin(state, { row: i % 7, col: Math.floor(i / 7) }, "tails");
    }
    expect(scoreForPlayer(state, "HEADS")).toBe(0);
    expect(scoreForPlayer(state, "TAILS")).toBe(12);
  });

  it("does not mutate state", () => {
    const state = createInitialState("HEADS");
    const originalCoins = new Map(state.coins);
    scoreForPlayer(state, "HEADS");
    expect(state.coins).toEqual(originalCoins);
  });
});
