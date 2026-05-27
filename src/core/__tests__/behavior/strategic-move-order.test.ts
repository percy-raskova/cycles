import { describe, expect, it } from "vitest";
import { buildMoveContext } from "../../bots/strategic/context";
import { compareScoredMoves, moveTypeRank, orderKey } from "../../bots/strategic/move-order";
import type { ScoredMove } from "../../bots/strategic/types";
import { createInitialState, joinCoins, placeCoin } from "../../state";
import type { Move } from "../../types";

function scored(partial: Partial<ScoredMove> & { move: Move }): ScoredMove {
  return {
    totalScore: 0,
    breakdown: {},
    moveTypeRank: 2,
    orderKey: "",
    ...partial,
  };
}

describe("moveTypeRank (T006)", () => {
  it("ranks PLACE as 2", () => {
    const state = createInitialState("HEADS");
    expect(
      moveTypeRank(state, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" }),
    ).toBe(2);
  });

  it("ranks a non-cycle JOIN as 1", () => {
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");
    expect(
      moveTypeRank(state, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 2 } }),
    ).toBe(1);
  });

  it("ranks a cycle-closing JOIN as 0", () => {
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "heads");
    state = placeCoin(state, { row: 2, col: 2 }, "heads");
    state = placeCoin(state, { row: 2, col: 0 }, "heads");
    state = joinCoins(state, { row: 0, col: 0 }, { row: 0, col: 2 });
    state = joinCoins(state, { row: 0, col: 2 }, { row: 2, col: 2 });
    state = joinCoins(state, { row: 2, col: 2 }, { row: 2, col: 0 });
    // Closing edge (2,0)-(0,0) completes the square → cycle.
    expect(
      moveTypeRank(state, { type: "JOIN", a: { row: 2, col: 0 }, b: { row: 0, col: 0 } }),
    ).toBe(0);
  });
});

describe("orderKey (T006)", () => {
  it("PLACE key is position then face (heads < tails)", () => {
    expect(orderKey({ type: "PLACE", position: { row: 0, col: 0 }, face: "heads" })).toBe(
      "0,0|heads",
    );
    const heads = orderKey({ type: "PLACE", position: { row: 1, col: 1 }, face: "heads" });
    const tails = orderKey({ type: "PLACE", position: { row: 1, col: 1 }, face: "tails" });
    expect(heads < tails).toBe(true);
  });

  it("JOIN key is the sorted endpoint-key pair (order-independent)", () => {
    const ab = orderKey({ type: "JOIN", a: { row: 0, col: 2 }, b: { row: 0, col: 0 } });
    const ba = orderKey({ type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 2 } });
    expect(ab).toBe(ba);
    expect(ab).toBe("0,0|0,2");
  });

  it("PASS sorts after any coordinate key", () => {
    expect(orderKey({ type: "PASS" })).toBe("~");
    expect("6,6|tails" < "~").toBe(true);
  });
});

describe("compareScoredMoves — FR-002 deterministic tie-break (T006)", () => {
  it("sorts by totalScore descending first", () => {
    const lo = scored({ move: { type: "PASS" }, totalScore: 1 });
    const hi = scored({ move: { type: "PASS" }, totalScore: 5 });
    expect([lo, hi].sort(compareScoredMoves)).toEqual([hi, lo]);
  });

  it("on equal score, prefers cycle JOIN ≺ non-cycle JOIN ≺ PLACE", () => {
    const place = scored({ move: { type: "PASS" }, totalScore: 3, moveTypeRank: 2 });
    const nonCycle = scored({ move: { type: "PASS" }, totalScore: 3, moveTypeRank: 1 });
    const cycle = scored({ move: { type: "PASS" }, totalScore: 3, moveTypeRank: 0 });
    expect([place, nonCycle, cycle].sort(compareScoredMoves)).toEqual([cycle, nonCycle, place]);
  });

  it("on equal score and type, prefers the lexicographically smallest orderKey", () => {
    const big = scored({
      move: { type: "PASS" },
      totalScore: 3,
      moveTypeRank: 2,
      orderKey: "5,5|heads",
    });
    const small = scored({
      move: { type: "PASS" },
      totalScore: 3,
      moveTypeRank: 2,
      orderKey: "0,0|heads",
    });
    expect([big, small].sort(compareScoredMoves)).toEqual([small, big]);
  });
});

describe("buildMoveContext (T008)", () => {
  it("computes successor, player, isCycleClose and signed deltaSigma without mutating input", () => {
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "tails");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");
    const frozen = new Map(state.coins);

    const ctx = buildMoveContext(state, {
      type: "JOIN",
      a: { row: 0, col: 0 },
      b: { row: 0, col: 2 },
    });

    expect(ctx.player).toBe("HEADS");
    expect(ctx.isCycleClose).toBe(false);
    expect(ctx.deltaSigma).toBe(4); // both tails → both heads, HEADS perspective
    expect(ctx.successor.coins.get("0,0")?.face).toBe("heads");
    expect(state.coins).toEqual(frozen); // input untouched
  });
});
