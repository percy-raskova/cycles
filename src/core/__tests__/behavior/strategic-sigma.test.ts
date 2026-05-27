import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { allLegalMoves } from "../../bots/legal-moves";
import {
  joinDeltaSigmaAnalytic,
  moveDeltaSigma,
  sigma,
  signedDeltaSigma,
  signedSigma,
} from "../../bots/strategic/sigma";
import { applyMove } from "../../move";
import { scoreForPlayer } from "../../score";
import { createInitialState, placeCoin } from "../../state";
import type { GameState, Player } from "../../types";

/** Build a reachable placement-only state with up to `n` coins (deterministic-ish). */
function buildPlacedState(n: number, first: Player = "HEADS"): GameState {
  let state = createInitialState(first);
  for (let i = 0; i < n; i++) {
    const placements = allLegalMoves(state).filter((m) => m.type === "PLACE");
    if (placements.length === 0) break;
    const move = placements[i % placements.length];
    if (!move) break;
    state = applyMove(state, move);
  }
  return state;
}

describe("sigma / signedSigma (T004)", () => {
  it("sigma === scoreForPlayer(HEADS) − scoreForPlayer(TAILS) over many states", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 12 }), (n) => {
        const state = buildPlacedState(n);
        expect(sigma(state)).toBe(scoreForPlayer(state, "HEADS") - scoreForPlayer(state, "TAILS"));
      }),
      { numRuns: 50 },
    );
  });

  it("signedSigma flips sign for TAILS", () => {
    const state = buildPlacedState(5);
    expect(signedSigma(state, "HEADS")).toBe(sigma(state));
    expect(signedSigma(state, "TAILS")).toBe(-sigma(state));
  });
});

describe("moveDeltaSigma — engine-exact swing (T004)", () => {
  it("moveDeltaSigma === sigma(applyMove) − sigma for every legal move", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 12 }), (n) => {
        const state = buildPlacedState(n);
        for (const move of allLegalMoves(state)) {
          const expected = sigma(applyMove(state, move)) - sigma(state);
          expect(moveDeltaSigma(state, move)).toBe(expected);
        }
      }),
      { numRuns: 40 },
    );
  });

  it("analytic JOIN Δσ matches the engine for every legal JOIN (incl. cycle closes)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 12 }), (n) => {
        const state = buildPlacedState(n);
        for (const move of allLegalMoves(state)) {
          if (move.type !== "JOIN") continue;
          const engine = sigma(applyMove(state, move)) - sigma(state);
          expect(joinDeltaSigmaAnalytic(state, move.a, move.b)).toBe(engine);
        }
      }),
      { numRuns: 40 },
    );
  });

  // NOTE: cycles-game-theory.md §3 reports non-cycle JOIN Δσ as ±2 — that is actually
  // Δ(#heads), not Δσ. The real σ = #H − #T swing is ±4 (each flipped endpoint moves σ
  // by 2). The engine is the source of truth (Constitution VII); we use real σ so the
  // minimax leaf value is the true win margin. Ordering preference is unchanged.
  it("non-cycle JOIN: both-tails = +4, both-heads = −4, mixed = 0 (HEADS perspective)", () => {
    // both tails (HEADS to move after 2 placements)
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "tails");
    s = placeCoin(s, { row: 0, col: 2 }, "tails");
    const bothTails = { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 2 } } as const;
    expect(moveDeltaSigma(s, bothTails)).toBe(4);
    expect(joinDeltaSigmaAnalytic(s, bothTails.a, bothTails.b)).toBe(4);

    let h = createInitialState("HEADS");
    h = placeCoin(h, { row: 0, col: 0 }, "heads");
    h = placeCoin(h, { row: 0, col: 2 }, "heads");
    expect(moveDeltaSigma(h, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 2 } })).toBe(
      -4,
    );

    let m = createInitialState("HEADS");
    m = placeCoin(m, { row: 0, col: 0 }, "heads");
    m = placeCoin(m, { row: 0, col: 2 }, "tails");
    expect(moveDeltaSigma(m, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 2 } })).toBe(
      0,
    );
  });

  it("analytic cycle-close swing 2(t−h) matches the engine", () => {
    // Build a square with an interior coin, join three sides, then the closing JOIN
    // encloses the region — exercising the analytic cycle path against the engine.
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads");
    s = placeCoin(s, { row: 0, col: 2 }, "heads");
    s = placeCoin(s, { row: 2, col: 2 }, "heads");
    s = placeCoin(s, { row: 2, col: 0 }, "tails");
    s = placeCoin(s, { row: 1, col: 1 }, "tails"); // interior
    s = applyMove(s, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 2 } });
    s = applyMove(s, { type: "JOIN", a: { row: 0, col: 2 }, b: { row: 2, col: 2 } });
    s = applyMove(s, { type: "JOIN", a: { row: 2, col: 2 }, b: { row: 2, col: 0 } });
    const close = { type: "JOIN", a: { row: 2, col: 0 }, b: { row: 0, col: 0 } } as const;
    const engine = sigma(applyMove(s, close)) - sigma(s);
    expect(joinDeltaSigmaAnalytic(s, close.a, close.b)).toBe(engine);
    expect(engine).not.toBe(0); // a real flip occurred (region not balanced)
  });

  it("signedDeltaSigma flips for the side to move", () => {
    // TAILS to move after 2 placements from a TAILS-first game.
    let s = createInitialState("TAILS");
    s = placeCoin(s, { row: 0, col: 0 }, "tails");
    s = placeCoin(s, { row: 0, col: 2 }, "tails");
    expect(s.currentPlayer).toBe("TAILS");
    const join = { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 2 } } as const;
    // Raw (HEADS perspective) is +4; signed for TAILS is −4.
    expect(moveDeltaSigma(s, join)).toBe(4);
    expect(signedDeltaSigma(s, join)).toBe(-4);
  });
});
