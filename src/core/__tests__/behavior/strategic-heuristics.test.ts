import { describe, expect, it } from "vitest";
import { buildMoveContext } from "../../bots/strategic/context";
import {
  boundarySafety,
  centerExposure,
  cycleClose,
  deltaSigma,
  sigmaTerm,
  tempo,
} from "../../bots/strategic/heuristics";
import { signedSigma } from "../../bots/strategic/sigma";
import { createInitialState, joinCoins, placeCoin } from "../../state";

describe("leaf evaluators — take a state (Q7) (T009)", () => {
  it("sigmaTerm === signedSigma", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads");
    s = placeCoin(s, { row: 1, col: 1 }, "tails");
    s = placeCoin(s, { row: 2, col: 2 }, "heads");
    expect(sigmaTerm(s, "HEADS")).toBe(signedSigma(s, "HEADS"));
    expect(sigmaTerm(s, "TAILS")).toBe(signedSigma(s, "TAILS"));
  });

  it("boundarySafety rewards own coins on corners/edges, penalizes opponent's (FR-003)", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads"); // own corner for HEADS
    expect(boundarySafety(s, "HEADS")).toBe(2); // corner = 2
    expect(boundarySafety(s, "TAILS")).toBe(-2); // opponent on a corner

    let edge = createInitialState("HEADS");
    edge = placeCoin(edge, { row: 0, col: 3 }, "heads"); // edge, not corner
    expect(boundarySafety(edge, "HEADS")).toBe(1);

    let center = createInitialState("HEADS");
    center = placeCoin(center, { row: 3, col: 3 }, "heads"); // interior
    expect(boundarySafety(center, "HEADS")).toBe(0);
  });

  it("centerExposure penalizes own coins in the center cluster, rewards opponent's (FR-003)", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 3, col: 3 }, "heads"); // own coin in center
    expect(centerExposure(s, "HEADS")).toBe(-1);
    expect(centerExposure(s, "TAILS")).toBe(1); // opponent (heads) exposed in center

    let off = createInitialState("HEADS");
    off = placeCoin(off, { row: 0, col: 0 }, "heads"); // corner, not center
    expect(centerExposure(off, "HEADS")).toBe(0);
  });
});

describe("ordering evaluators — take a MoveContext (Q7) (T009)", () => {
  it("tempo: +1 for a PLACE when placements remain and neither side has a +2 (FR-006)", () => {
    const empty = createInitialState("HEADS");
    const placeCtx = buildMoveContext(empty, {
      type: "PLACE",
      position: { row: 0, col: 0 },
      face: "heads",
    });
    expect(tempo(placeCtx)).toBe(1); // PLACE, placements remain, no +2 anywhere
  });

  it("tempo: 0 for a JOIN, and 0 for a PLACE when a +2 exists (FR-006)", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "tails");
    s = placeCoin(s, { row: 0, col: 2 }, "tails"); // HEADS now has a +2 (two tails on a line)
    const joinCtx = buildMoveContext(s, {
      type: "JOIN",
      a: { row: 0, col: 0 },
      b: { row: 0, col: 2 },
    });
    expect(tempo(joinCtx)).toBe(0); // tempo applies to PLACE only
    const placeCtx = buildMoveContext(s, {
      type: "PLACE",
      position: { row: 6, col: 6 },
      face: "heads",
    });
    expect(tempo(placeCtx)).toBe(0); // a +2 exists → don't defer
  });

  it("deltaSigma returns the swing for a non-cycle JOIN, 0 otherwise (FR-004)", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "tails");
    s = placeCoin(s, { row: 0, col: 2 }, "tails");
    const joinCtx = buildMoveContext(s, {
      type: "JOIN",
      a: { row: 0, col: 0 },
      b: { row: 0, col: 2 },
    });
    expect(deltaSigma(joinCtx)).toBe(4); // both tails → both heads, HEADS perspective
    expect(cycleClose(joinCtx)).toBe(0); // not a cycle

    const placeCtx = buildMoveContext(s, {
      type: "PLACE",
      position: { row: 6, col: 6 },
      face: "heads",
    });
    expect(deltaSigma(placeCtx)).toBe(0); // PLACE handled by leaf terms, not deltaSigma
  });

  it("cycleClose returns the region swing for a cycle JOIN, 0 otherwise (FR-005)", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "tails");
    s = placeCoin(s, { row: 0, col: 2 }, "tails");
    s = placeCoin(s, { row: 2, col: 2 }, "tails");
    s = placeCoin(s, { row: 2, col: 0 }, "tails");
    s = joinCoins(s, { row: 0, col: 0 }, { row: 0, col: 2 });
    s = joinCoins(s, { row: 0, col: 2 }, { row: 2, col: 2 });
    s = joinCoins(s, { row: 2, col: 2 }, { row: 2, col: 0 });
    const closeCtx = buildMoveContext(s, {
      type: "JOIN",
      a: { row: 2, col: 0 },
      b: { row: 0, col: 0 },
    });
    expect(closeCtx.isCycleClose).toBe(true);
    // Region is 4 tails (signed for side-to-move); cycleClose mirrors ctx.deltaSigma.
    expect(cycleClose(closeCtx)).toBe(closeCtx.deltaSigma);
    expect(deltaSigma(closeCtx)).toBe(0); // a cycle close is not a non-cycle JOIN
  });
});
