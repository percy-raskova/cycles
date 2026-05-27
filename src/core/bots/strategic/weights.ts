import type { HeuristicWeights, StrategicBotConfig } from "./types";

/**
 * Heuristic weights and search knobs (Q3 hand-tuned; research R8 documents provenance).
 *
 * Leaf terms (compose `v(state)`):
 *   W_SIGMA       — exact signed margin σ = heads − tails. Dominant base term.   (§2, §6, exact)
 *   W_BOUNDARY    — own coins on corners/edges are flip-resistant.               (§9a, 90% conf)
 *   W_CENTER_AVOID— own coins in the center cluster are enclosable.              (§9a, 80% conf)
 *   W_TEMPO       — retain placement flexibility when no +2 JOIN exists.         (§9b/§9d, 70% conf)
 *
 * Ordering terms (score MOVES for ordering / beam / static fallback only — NOT leaf):
 *   W_DELTA_SIGMA — non-cycle JOIN swing (+2/0/−2).                              (§3, §4, 95% conf)
 *   W_CYCLE_CLOSE — cycle-close swing 2(t−h).                                    (§3, §9b, 90% conf)
 */
export const W_SIGMA = 1.0;
export const W_BOUNDARY = 0.6;
export const W_CENTER_AVOID = 0.4;
export const W_TEMPO = 0.3;
export const W_DELTA_SIGMA = 1.0;
export const W_CYCLE_CLOSE = 1.0;

export const DEFAULT_WEIGHTS: HeuristicWeights = {
  sigma: W_SIGMA,
  boundary: W_BOUNDARY,
  centerAvoid: W_CENTER_AVOID,
  tempo: W_TEMPO,
  deltaSigma: W_DELTA_SIGMA,
  cycleClose: W_CYCLE_CLOSE,
};

/** Fixed search depth (Q2: 3-ply). */
export const SEARCH_DEPTH = 3;
/** Interior beam width (Q6 / R3); Number.POSITIVE_INFINITY disables the beam.
 * NOTE: a finite beam pruning the opponent's RESPONSE layer proved unsound in the
 * placement phase (many moves tie at 1-ply, so the beam dropped the opponent's deep-best
 * reply and the search overvalued material sacrifices). The bot relies on adaptive
 * full-width depth instead (see search.ts), so the default disables the beam. */
export const K_BEAM = Number.POSITIVE_INFINITY;
/** Switch to exhaustive search when the remaining tree has ≤ this many leaves (R7). */
export const EXHAUSTIVE_LEAF_LIMIT = 200;
/** Default move deadline in ms, applied ONLY when a clock is injected (Q8). */
export const DEFAULT_DEADLINE_MS = 2000;

export const DEFAULT_CONFIG: StrategicBotConfig = {
  depth: SEARCH_DEPTH,
  weights: DEFAULT_WEIGHTS,
  beamWidth: K_BEAM,
  exhaustiveLeafLimit: EXHAUSTIVE_LEAF_LIMIT,
};
