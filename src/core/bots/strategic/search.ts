// Negamax = minimax specialized for the zero-sum score σ: every node returns the value
// from its own side-to-move's perspective and the parent negates it (D1).
import { applyMove } from "../../move";
import type { GameState, Move } from "../../types";
import { allLegalMoves } from "../legal-moves";
import { buildMoveContext } from "./context";
import { leafValue, staticBreakdown } from "./evaluate";
import { orderKey } from "./move-order";
import { signedSigma } from "./sigma";
import type { HeuristicWeights, ScoredMove, SearchResult, StrategicBotConfig } from "./types";
import { DEFAULT_DEADLINE_MS } from "./weights";

/** Depth used for exhaustive endgame search; ample for any ≤200-leaf subtree (R7). */
const EXHAUSTIVE_DEPTH = 64;
/** Hard cap on probe work when estimating endgame size; bounds the gate's cost. */
const PROBE_VISIT_CAP = 4000;
/**
 * Only run the (relatively costly) endgame-size probe when the branching factor is
 * small enough that a ≤EXHAUSTIVE_LEAF_LIMIT tree is even possible. A position with
 * more than this many legal moves cannot have ≤200 leaves at depth ≥ 2, so probing it
 * would always fail — skipping the probe saves ~PROBE_VISIT_CAP applyMoves per move in
 * the opening/midgame.
 */
const EXHAUSTIVE_BRANCH_GATE = 14;
/**
 * Full 3-ply search is only run when the branching factor is small enough that
 * alpha-beta keeps it affordable (~b² leaves). In high-branching placement states a
 * 3-ply search would need an (unsound) beam to be fast, so we instead run a SOUND
 * full-width 2-ply search there — more reliable than a 3-ply beam and still well within
 * budget. Low-branching mid/endgame states get the full 3 ply; tiny endgames go
 * exhaustive (see EXHAUSTIVE_BRANCH_GATE).
 */
const DEPTH3_BRANCH_MAX = 16;
const PASS_MOVE: Move = { type: "PASS" };

function effectiveDepth(branching: number, configDepth: number): number {
  return branching <= DEPTH3_BRANCH_MAX ? configDepth : Math.min(2, configDepth);
}

interface SearchEnv {
  readonly weights: HeuristicWeights;
  readonly beamWidth: number;
  readonly now?: () => number;
  readonly deadlineAt?: number;
}

function deadlineHit(env: SearchEnv): boolean {
  return env.deadlineAt !== undefined && env.now !== undefined && env.now() >= env.deadlineAt;
}

function makeEnv(config: StrategicBotConfig, beamWidth: number): SearchEnv {
  if (config.now) {
    return {
      weights: config.weights,
      beamWidth,
      now: config.now,
      deadlineAt: config.now() + (config.deadlineMs ?? DEFAULT_DEADLINE_MS),
    };
  }
  return { weights: config.weights, beamWidth };
}

// ─── move ordering (accurate 1-ply value; successors cached for reuse) ────────

interface OrderedMove {
  readonly move: Move;
  readonly successor: GameState;
  readonly score: number;
}

/**
 * Order moves by their true 1-ply value to the side to move, `−v(successor)`, and cache
 * each successor so the recursion never re-applies the move. Accurate ordering is what
 * makes the interior beam SOUND enough to keep the opponent's genuinely-best replies —
 * a crude proxy here caused the search to overvalue material-sacrificing lines. The
 * `applyMove` done for ordering is the same clone the recursion would do, so there is no
 * extra engine cost. Ties broken by `orderKey` for determinism.
 */
function orderForSearch(
  state: GameState,
  moves: readonly Move[],
  weights: HeuristicWeights,
): OrderedMove[] {
  const scored: OrderedMove[] = moves.map((move) => {
    const successor = applyMove(state, move);
    return { move, successor, score: -leafValue(successor, successor.currentPlayer, weights) };
  });
  scored.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    const k1 = orderKey(a.move);
    const k2 = orderKey(b.move);
    return k1 < k2 ? -1 : k1 > k2 ? 1 : 0;
  });
  return scored;
}

// ─── negamax with alpha-beta + interior beam ─────────────────────────────────

function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  env: SearchEnv,
): SearchResult {
  if (state.passCount >= 2) {
    return { value: signedSigma(state, state.currentPlayer), bestMove: null, completed: true };
  }
  if (depth <= 0) {
    return {
      value: leafValue(state, state.currentPlayer, env.weights),
      bestMove: null,
      completed: true,
    };
  }
  const moves = allLegalMoves(state);
  if (moves.length === 0) {
    // Forced pass: not a real ply choice, so depth is NOT decremented (R5).
    const child = negamax(applyMove(state, PASS_MOVE), depth, -beta, -alpha, env);
    return { value: -child.value, bestMove: null, completed: child.completed };
  }
  if (deadlineHit(env)) {
    return {
      value: leafValue(state, state.currentPlayer, env.weights),
      bestMove: null,
      completed: false,
    };
  }
  return expand(state, moves, depth, alpha, beta, env);
}

function expand(
  state: GameState,
  moves: readonly Move[],
  depth: number,
  alpha: number,
  beta: number,
  env: SearchEnv,
): SearchResult {
  const ordered = orderForSearch(state, moves, env.weights);
  const candidates = env.beamWidth >= ordered.length ? ordered : ordered.slice(0, env.beamWidth);
  let best = Number.NEGATIVE_INFINITY;
  let bestMove: Move | null = null;
  let completed = true;
  let a = alpha;
  for (const entry of candidates) {
    if (deadlineHit(env)) {
      completed = false;
      break;
    }
    const child = negamax(entry.successor, depth - 1, -beta, -a, env);
    const value = -child.value;
    completed = completed && child.completed;
    if (value > best) {
      best = value;
      bestMove = entry.move;
    }
    if (value > a) {
      a = value;
    }
    if (a >= beta) {
      break; // alpha-beta cutoff (sound; does not change the returned value)
    }
  }
  return { value: best, bestMove, completed };
}

// ─── exhaustive endgame estimator (R7) ───────────────────────────────────────

interface ProbeCounter {
  visits: number;
  over: boolean;
}

function countLeaves(state: GameState, limit: number, c: ProbeCounter): number {
  if (c.over) {
    return limit + 1;
  }
  c.visits += 1;
  if (c.visits > PROBE_VISIT_CAP) {
    c.over = true;
    return limit + 1;
  }
  if (state.passCount >= 2) {
    return 1;
  }
  const moves = allLegalMoves(state);
  if (moves.length === 0) {
    return countLeaves(applyMove(state, PASS_MOVE), limit, c);
  }
  let total = 0;
  for (const move of moves) {
    total += countLeaves(applyMove(state, move), limit, c);
    if (total > limit) {
      return total;
    }
  }
  return total;
}

function estimateSmall(state: GameState, limit: number): boolean {
  return countLeaves(state, limit, { visits: 0, over: false }) <= limit;
}

// ─── root evaluation (shared by strategicBot and inspectTopMoves) ─────────────

function scoredFromCtx(
  ctx: ReturnType<typeof buildMoveContext>,
  searchValue: number,
  weights: HeuristicWeights,
): ScoredMove {
  const rank: 0 | 1 | 2 = ctx.move.type === "JOIN" ? (ctx.isCycleClose ? 0 : 1) : 2;
  const breakdown = staticBreakdown(ctx, weights);
  // FR-006 tempo is a root move bias applied outside negamax (it is not antisymmetric,
  // so it must not enter the leaf). totalScore = backed-up search value + tempo bias.
  const tempoBonus = breakdown.tempo?.weighted ?? 0;
  return {
    move: ctx.move,
    totalScore: searchValue + tempoBonus,
    breakdown,
    moveTypeRank: rank,
    orderKey: orderKey(ctx.move),
  };
}

/**
 * Evaluate every root candidate (FR-005: root is full-width). Each root move gets a
 * full-window negamax so its value is exact and the result list is reusable by
 * `inspectTopMoves`. Switches to exhaustive search on small endgames (R7). Under an
 * injected deadline, returns only the moves evaluated before the cutoff (R4); the
 * caller treats the best of those as the timeout fallback.
 */
export function searchRoot(state: GameState, config: StrategicBotConfig): ScoredMove[] {
  const moves = allLegalMoves(state);
  const exhaustive =
    moves.length <= EXHAUSTIVE_BRANCH_GATE && estimateSmall(state, config.exhaustiveLeafLimit);
  const depth = exhaustive ? EXHAUSTIVE_DEPTH : effectiveDepth(moves.length, config.depth);
  const beamWidth = exhaustive ? Number.POSITIVE_INFINITY : config.beamWidth;
  const env = makeEnv(config, beamWidth);
  const results: ScoredMove[] = [];
  // Evaluate promising moves first so a timeout keeps the best-found move.
  for (const entry of orderForSearch(state, moves, config.weights)) {
    if (deadlineHit(env)) {
      break;
    }
    const ctx = buildMoveContext(state, entry.move);
    const child = negamax(
      entry.successor,
      depth - 1,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      env,
    );
    results.push(scoredFromCtx(ctx, -child.value, config.weights));
  }
  return results;
}

/** Direct negamax value from a node — for tests (terminal, forced pass, soundness). */
export function searchValue(state: GameState, depth: number, config: StrategicBotConfig): number {
  return negamax(
    state,
    depth,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    makeEnv(config, config.beamWidth),
  ).value;
}
