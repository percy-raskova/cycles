import { applyMove, findCycle } from "../../move";
import type { GameState, Move } from "../../types";
import { signedSigma } from "./sigma";
import type { MoveContext } from "./types";

/**
 * Build the per-candidate context once: the successor (a single immutable `applyMove`
 * clone), whether the move closes a cycle, and the signed σ swing from the
 * side-to-move's perspective. Δσ is derived from the already-computed successor so we
 * never clone state twice. Pure — never mutates `state`.
 */
export function buildMoveContext(state: GameState, move: Move): MoveContext {
  const successor = applyMove(state, move);
  const isCycleClose = move.type === "JOIN" && findCycle(state, move.a, move.b) !== null;
  const player = state.currentPlayer;
  return {
    state,
    move,
    player,
    successor,
    isCycleClose,
    deltaSigma: signedSigma(successor, player) - signedSigma(state, player),
  };
}
