import type { GameState, Move, Player } from "../../types";

/**
 * Tunable, immutable configuration for the Strategic bot.
 *
 * Timeout is dependency-injected (Clarification Q8 / research R4): the core search
 * NEVER references `performance`/`Date`. When `now` is omitted (the default, used by
 * tests, tournaments, and the CLI) the bot is pure and deterministic. The UI supplies
 * `now: () => performance.now()` and a `deadlineMs` to enable the production safety
 * valve without leaking ambient time into `src/core/`.
 */
export interface StrategicBotConfig {
  readonly depth: number;
  readonly weights: HeuristicWeights;
  readonly beamWidth: number;
  readonly exhaustiveLeafLimit: number;
  readonly now?: () => number;
  readonly deadlineMs?: number;
}

/**
 * Fixed, empirically-tuned weights (FR-007). Leaf terms compose the state-based leaf
 * evaluation `v(state)` (Q7); ordering terms score MOVES for alpha-beta ordering, the
 * interior beam, and the static fallback ranking — they are never re-added to `v(state)`.
 */
export interface HeuristicWeights {
  // Leaf (state) terms.
  readonly sigma: number;
  readonly boundary: number;
  readonly centerAvoid: number;
  readonly tempo: number;
  // Ordering (move) terms.
  readonly deltaSigma: number;
  readonly cycleClose: number;
}

/**
 * Everything an evaluator/ordering function needs about one candidate move, computed
 * once so the successor (an `applyMove` clone) and cycle detection are not repeated.
 * `deltaSigma` is the signed σ swing of the move from the side-to-move's perspective.
 */
export interface MoveContext {
  readonly state: GameState;
  readonly move: Move;
  readonly player: Player;
  readonly successor: GameState;
  readonly isCycleClose: boolean;
  readonly deltaSigma: number;
}

/** Per-heuristic contribution: raw (pre-weight) score and its weighted value. */
export interface HeuristicContribution {
  readonly raw: number;
  readonly weighted: number;
}

/**
 * A move paired with its evaluated score and the deterministic tie-break keys
 * (FR-002): `moveTypeRank` (0 = cycle JOIN, 1 = non-cycle JOIN, 2 = PLACE) then
 * `orderKey` (lexicographic position key).
 */
export interface ScoredMove {
  readonly move: Move;
  readonly totalScore: number;
  readonly breakdown: Readonly<Record<string, HeuristicContribution>>;
  readonly moveTypeRank: 0 | 1 | 2;
  readonly orderKey: string;
}

/** Result of a negamax node: value from the side-to-move's perspective. */
export interface SearchResult {
  readonly value: number;
  readonly bestMove: Move | null;
  readonly completed: boolean;
}

/** One entry returned by `inspectTopMoves` (FR-011). */
export interface InspectedMove {
  readonly move: Move;
  readonly totalScore: number;
  readonly breakdown: Readonly<Record<string, HeuristicContribution>>;
}
