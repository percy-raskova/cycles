import { findCycle } from "../../move";
import { positionKey } from "../../state";
import type { GameState, Move } from "../../types";
import type { ScoredMove } from "./types";

/**
 * Move-type rank for FR-002 tie-breaking: cycle-closing JOIN (0) ≺ non-cycle JOIN (1)
 * ≺ PLACE (2). PASS (engine-forced only) ranks last.
 */
export function moveTypeRank(state: GameState, move: Move): 0 | 1 | 2 {
  if (move.type === "JOIN") {
    return findCycle(state, move.a, move.b) !== null ? 0 : 1;
  }
  return 2;
}

/**
 * Lexicographic tie-break key (FR-002 "smallest position key").
 * - PLACE: `"row,col|face"` (heads < tails).
 * - JOIN: the sorted endpoint-key pair `"min|max"` (endpoint order-independent).
 */
export function orderKey(move: Move): string {
  if (move.type === "PLACE") {
    return `${positionKey(move.position)}|${move.face}`;
  }
  if (move.type === "JOIN") {
    const ka = positionKey(move.a);
    const kb = positionKey(move.b);
    return ka <= kb ? `${ka}|${kb}` : `${kb}|${ka}`;
  }
  return "~"; // PASS sorts after any coordinate key
}

/**
 * Deterministic comparator (FR-002): highest `totalScore` first, then move-type rank
 * (cycle JOIN ≺ non-cycle JOIN ≺ PLACE), then smallest `orderKey`. A stable sort with
 * this total order yields identical output across runs and platforms.
 */
export function compareScoredMoves(a: ScoredMove, b: ScoredMove): number {
  if (a.totalScore !== b.totalScore) {
    return b.totalScore - a.totalScore;
  }
  if (a.moveTypeRank !== b.moveTypeRank) {
    return a.moveTypeRank - b.moveTypeRank;
  }
  return a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0;
}
