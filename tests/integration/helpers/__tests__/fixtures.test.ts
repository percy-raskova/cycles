import { legalJoins, legalPlacements } from "@core";
import { describe, expect, it } from "vitest";
import {
  makeBlockedBoardState,
  makeCycleBoardState,
  makeFullBoardNoEdgesState,
  makeInitialState,
  makeJoinablePairState,
  makeOneLegalMoveState,
} from "../fixtures";

describe("fixtures", () => {
  it("makeInitialState produces an empty board", () => {
    const state = makeInitialState("HEADS");
    expect(state.coins.size).toBe(0);
    expect(state.edges.length).toBe(0);
    expect(state.currentPlayer).toBe("HEADS");
    expect(state.coinsRemaining).toBe(12);
    expect(state.passCount).toBe(0);
  });

  it("makeJoinablePairState has 2 coins and 1 legal join", () => {
    const state = makeJoinablePairState();
    expect(state.coins.size).toBe(2);
    expect(state.edges.length).toBe(0);
    expect(legalJoins(state).length).toBe(1);
  });

  it("makeFullBoardNoEdgesState has 12 coins and 0 edges", () => {
    const state = makeFullBoardNoEdgesState();
    expect(state.coins.size).toBe(12);
    expect(state.edges.length).toBe(0);
    expect(state.coinsRemaining).toBe(0);
  });

  it("makeCycleBoardState has 5 coins and 3 edges", () => {
    const state = makeCycleBoardState();
    expect(state.coins.size).toBe(5);
    expect(state.edges.length).toBe(3);
  });

  it("makeBlockedBoardState has 12 coins and 0 legal moves", () => {
    const state = makeBlockedBoardState();
    expect(state.coins.size).toBe(12);
    expect(legalPlacements(state).length).toBe(0);
    expect(legalJoins(state).length).toBe(0);
  });

  it("makeOneLegalMoveState has exactly 1 legal join", () => {
    const state = makeOneLegalMoveState();
    expect(state.coins.size).toBe(12);
    expect(legalPlacements(state).length).toBe(0);
    expect(legalJoins(state).length).toBe(1);
  });
});
