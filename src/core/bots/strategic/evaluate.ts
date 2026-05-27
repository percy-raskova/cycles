import type { GameState, Player } from "../../types";
import {
  boundarySafety,
  centerExposure,
  cycleClose,
  deltaSigma,
  sigmaTerm,
  tempo,
} from "./heuristics";
import type { HeuristicContribution, HeuristicWeights, MoveContext } from "./types";

/**
 * State-based minimax leaf value `v(state)` from `player`'s perspective (Q7 / FR-005,
 * FR-007). Sums ONLY the antisymmetric leaf positional terms (σ, boundary, center) so
 * that `v(s,P) = −v(s,¬P)` holds and negamax is sound. The σ swing of any move is
 * captured by the successor's σ via the search backup, so Δσ/cycle-close are NOT
 * re-added here — no double counting; a cycle close's value emerges as
 * `Δσ_close + v(successor)`. Tempo (FR-006) is a player-symmetric MOVE preference and
 * is therefore applied at the root, not here (see heuristics.ts `tempo`).
 */
export function leafValue(state: GameState, player: Player, weights: HeuristicWeights): number {
  return (
    weights.sigma * sigmaTerm(state, player) +
    weights.boundary * boundarySafety(state, player) +
    weights.centerAvoid * centerExposure(state, player)
  );
}

/**
 * Per-heuristic breakdown of a move's one-ply static evaluation (mover's perspective on
 * the successor), used for `inspectTopMoves` and the FR-008 all-zero fallback check.
 * Leaf terms are evaluated on the successor; ordering terms (Δσ/cycle) come from the
 * move context.
 */
export function staticBreakdown(
  ctx: MoveContext,
  weights: HeuristicWeights,
): Record<string, HeuristicContribution> {
  const p = ctx.player;
  const s = ctx.successor;
  return {
    sigmaTerm: contribution(sigmaTerm(s, p), weights.sigma),
    boundary: contribution(boundarySafety(s, p), weights.boundary),
    centerAvoid: contribution(centerExposure(s, p), weights.centerAvoid),
    tempo: contribution(tempo(ctx), weights.tempo),
    deltaSigma: contribution(deltaSigma(ctx), weights.deltaSigma),
    cycleClose: contribution(cycleClose(ctx), weights.cycleClose),
  };
}

function contribution(raw: number, weight: number): HeuristicContribution {
  return { raw, weighted: raw * weight };
}

/** FR-008 trigger: every heuristic raw score is zero across a move's breakdown. */
export function isAllZeroBreakdown(breakdown: Record<string, HeuristicContribution>): boolean {
  return Object.values(breakdown).every((c) => c.raw === 0);
}
