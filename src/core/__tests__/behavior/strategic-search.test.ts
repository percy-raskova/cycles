import { describe, expect, it } from "vitest";
import { allLegalMoves } from "../../bots/legal-moves";
import { leafValue } from "../../bots/strategic/evaluate";
import { boundarySafety, centerExposure, sigmaTerm } from "../../bots/strategic/heuristics";
import { searchRoot, searchValue } from "../../bots/strategic/search";
import { signedSigma } from "../../bots/strategic/sigma";
import type { StrategicBotConfig } from "../../bots/strategic/types";
import { DEFAULT_WEIGHTS } from "../../bots/strategic/weights";
import { applyMove } from "../../move";
import { createInitialState, placeCoin } from "../../state";
import type { GameState } from "../../types";

const NO_BEAM: StrategicBotConfig = {
  depth: 3,
  weights: DEFAULT_WEIGHTS,
  beamWidth: Number.POSITIVE_INFINITY,
  exhaustiveLeafLimit: 0, // never auto-switch to exhaustive in searchValue tests
};

/** Reference negamax (no pruning, no beam); forced pass does NOT decrement depth. */
function refNegamax(state: GameState, depth: number): number {
  if (state.passCount >= 2) {
    return signedSigma(state, state.currentPlayer);
  }
  if (depth <= 0) {
    return leafValue(state, state.currentPlayer, DEFAULT_WEIGHTS);
  }
  const moves = allLegalMoves(state);
  if (moves.length === 0) {
    return -refNegamax(applyMove(state, { type: "PASS" }), depth);
  }
  let best = Number.NEGATIVE_INFINITY;
  for (const move of moves) {
    best = Math.max(best, -refNegamax(applyMove(state, move), depth - 1));
  }
  return best;
}

function buildPhaseTwoSmall(): GameState {
  // A deliberately tiny pure-JOIN endgame: 3 coins, no coins remaining (so no
  // placements), no edges yet. Only 3 queen-line joins exist and the tree terminates
  // within a few plies — small enough to trigger the exhaustive switch AND for the
  // unbounded reference search to finish quickly.
  return {
    coins: new Map([
      ["0,0", { position: { row: 0, col: 0 }, face: "heads" }],
      ["0,2", { position: { row: 0, col: 2 }, face: "tails" }],
      ["2,0", { position: { row: 2, col: 0 }, face: "tails" }],
    ]),
    edges: [],
    currentPlayer: "HEADS",
    coinsRemaining: 0,
    passCount: 0,
    lastAction: null,
  };
}

describe("leaf value — antisymmetric state terms, no Δσ double count (Q7) (T010)", () => {
  it("leafValue is exactly the three weighted leaf terms (σ + boundary + center)", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads");
    s = placeCoin(s, { row: 3, col: 3 }, "tails");
    const p = s.currentPlayer;
    const expected =
      DEFAULT_WEIGHTS.sigma * sigmaTerm(s, p) +
      DEFAULT_WEIGHTS.boundary * boundarySafety(s, p) +
      DEFAULT_WEIGHTS.centerAvoid * centerExposure(s, p);
    expect(leafValue(s, p, DEFAULT_WEIGHTS)).toBe(expected);
  });

  it("leafValue is antisymmetric: v(s,P) === −v(s,¬P) (negamax soundness)", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads");
    s = placeCoin(s, { row: 3, col: 3 }, "tails");
    s = placeCoin(s, { row: 6, col: 6 }, "heads");
    expect(leafValue(s, "HEADS", DEFAULT_WEIGHTS)).toBeCloseTo(
      -leafValue(s, "TAILS", DEFAULT_WEIGHTS),
      9,
    );
  });
});

describe("terminal & forced-pass handling (R5) (T010)", () => {
  it("terminal node (passCount=2) returns signed σ", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads");
    const terminal: GameState = { ...s, passCount: 2 };
    expect(searchValue(terminal, 3, NO_BEAM)).toBe(signedSigma(terminal, terminal.currentPlayer));
  });

  it("forced pass does NOT consume a ply (reaches terminal, not a leaf cutoff)", () => {
    // Hand-crafted no-legal-move state: 1 coin, no coins remaining, no edges.
    const noMoves: GameState = {
      coins: new Map([["0,0", { position: { row: 0, col: 0 }, face: "heads" }]]),
      edges: [],
      currentPlayer: "HEADS",
      coinsRemaining: 0,
      passCount: 0,
      lastAction: null,
    };
    expect(allLegalMoves(noMoves).length).toBe(0);
    // Two forced passes → terminal with σ = +1 (HEADS perspective). If passes wrongly
    // decremented depth, depth=1 would bottom out at leafValue (≠ +1).
    expect(searchValue(noMoves, 1, NO_BEAM)).toBe(1);
    expect(searchValue(noMoves, 3, NO_BEAM)).toBe(1);
  });
});

describe("alpha-beta soundness — equals reference minimax with beam off (T010)", () => {
  it("full-width depth-3 negamax value matches the no-pruning reference", () => {
    let s = createInitialState("HEADS");
    // 12 coins → Phase II (joins only): bounded branching keeps the full tree tractable.
    const cells = [
      [0, 0],
      [0, 2],
      [2, 0],
      [2, 2],
      [4, 4],
      [6, 6],
      [6, 4],
      [4, 6],
      [0, 6],
      [6, 0],
      [0, 4],
      [4, 0],
    ];
    cells.forEach(([r, c], i) => {
      s = placeCoin(s, { row: r as number, col: c as number }, i % 2 === 0 ? "heads" : "tails");
    });
    expect(s.coinsRemaining).toBe(0); // Phase II: no placements

    // searchValue uses the requested depth directly (no adaptive-depth/root logic), so
    // this isolates the alpha-beta pruning: full-width depth-3 must equal plain minimax.
    expect(searchValue(s, 3, NO_BEAM)).toBeCloseTo(refNegamax(s, 3), 9);
  });

  it("root is full-width: one scored entry per legal move", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads");
    s = placeCoin(s, { row: 6, col: 6 }, "tails");
    const scored = searchRoot(s, NO_BEAM);
    expect(scored.length).toBe(allLegalMoves(s).length);
  });
});

describe("exhaustive endgame switch (R7) (T010)", () => {
  it("on a small Phase-II tree, picks the true game-optimal move", () => {
    const s = buildPhaseTwoSmall();
    const scored = [...searchRoot(s, { ...NO_BEAM, exhaustiveLeafLimit: 200 })];
    expect(scored.length).toBe(allLegalMoves(s).length);

    // Reference true value (to terminal) for each root move.
    let bestRef = Number.NEGATIVE_INFINITY;
    for (const sm of scored) {
      bestRef = Math.max(bestRef, -refNegamax(applyMove(s, sm.move), Number.MAX_SAFE_INTEGER));
    }
    scored.sort((a, b) => b.totalScore - a.totalScore);
    const chosenRef = -refNegamax(
      applyMove(s, scored[0]?.move ?? { type: "PASS" }),
      Number.MAX_SAFE_INTEGER,
    );
    expect(chosenRef).toBe(bestRef); // chosen move achieves the optimal terminal value
  });
});

describe("determinism — no injected clock (Q8/R4) (T010)", () => {
  it("identical results on repeat, and same as with a non-binding clock", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 1, col: 1 }, "heads");
    s = placeCoin(s, { row: 5, col: 5 }, "tails");

    const cfg: StrategicBotConfig = {
      depth: 3,
      weights: DEFAULT_WEIGHTS,
      beamWidth: 12,
      exhaustiveLeafLimit: 200,
    };
    const a = searchRoot(s, cfg).map((m) => m.totalScore);
    const b = searchRoot(s, cfg).map((m) => m.totalScore);
    expect(a).toEqual(b);

    // Generous injected clock that never trips the deadline → same evaluated set.
    const generous: StrategicBotConfig = {
      ...cfg,
      now: () => 0,
      deadlineMs: 1_000_000,
    };
    const c = searchRoot(s, generous).map((m) => m.totalScore);
    expect(c).toEqual(a);
  });
});
