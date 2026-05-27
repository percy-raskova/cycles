import { passesThroughCoin } from "../../state";
import type { CoinFace, GameState, Player, Position } from "../../types";
import { signedSigma } from "./sigma";
import type { MoveContext } from "./types";

// ─── helpers ────────────────────────────────────────────────────────────────

function faceOf(player: Player): CoinFace {
  return player === "HEADS" ? "heads" : "tails";
}

/** Flip-resistance of a position: corner = 2, edge = 1, interior = 0 (§9a). */
export function positionSafety(pos: Position): number {
  const onRowEdge = pos.row === 0 || pos.row === 6;
  const onColEdge = pos.col === 0 || pos.col === 6;
  if (onRowEdge && onColEdge) {
    return 2; // corner
  }
  return onRowEdge || onColEdge ? 1 : 0;
}

/** The enclosable center cluster: rows AND cols in 2..4 (§9a). */
export function inCenterCluster(pos: Position): boolean {
  return pos.row >= 2 && pos.row <= 4 && pos.col >= 2 && pos.col <= 4;
}

/**
 * Cheap test for whether two coins of `face` sit on a clear queen line — i.e. a "+2"
 * non-cycle JOIN exists for the player whose opponent shows `face` (flipping both
 * yields a +σ swing). Used only by the tempo heuristic, which is evaluated at every
 * leaf, so this avoids `legalJoins`/`findCycle`: it ignores edge-blocking (an
 * acceptable approximation for a low-weight positional hint) and is O(k²) over the
 * ≤6 coins of that face.
 */
function existsClearPair(state: GameState, face: CoinFace): boolean {
  const positions: Position[] = [];
  for (const coin of state.coins.values()) {
    if (coin.face === face) {
      positions.push(coin.position);
    }
  }
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      if (a && b && isClearQueenLine(a, b, state.coins)) {
        return true;
      }
    }
  }
  return false;
}

function isClearQueenLine(a: Position, b: Position, coins: GameState["coins"]): boolean {
  const dRow = a.row - b.row;
  const dCol = a.col - b.col;
  const onLine = dRow === 0 || dCol === 0 || Math.abs(dRow) === Math.abs(dCol);
  return onLine && !passesThroughCoin(a, b, coins);
}

// ─── leaf (state) evaluators ─────────────────────────────────────────────────

/** Base term: exact signed margin σ (cycles-game-theory.md §2, §6). */
export function sigmaTerm(state: GameState, player: Player): number {
  return signedSigma(state, player);
}

/**
 * Boundary safety (§9a): reward own coins on flip-resistant corners/edges and penalize
 * the opponent's, from `player`'s perspective.
 */
export function boundarySafety(state: GameState, player: Player): number {
  const own = faceOf(player);
  let score = 0;
  for (const coin of state.coins.values()) {
    const safety = positionSafety(coin.position);
    score += coin.face === own ? safety : -safety;
  }
  return score;
}

/**
 * Center exposure (§9a): penalize own coins in the enclosable center cluster and reward
 * the opponent's being there (we can flip them), from `player`'s perspective.
 */
export function centerExposure(state: GameState, player: Player): number {
  const own = faceOf(player);
  let score = 0;
  for (const coin of state.coins.values()) {
    if (!inCenterCluster(coin.position)) {
      continue;
    }
    score += coin.face === own ? -1 : 1;
  }
  return score;
}

/**
 * Tempo (§9b/§9d, FR-006): prefer deferring JOINs — i.e. PLACE — when placements remain
 * (proxied O(1) by `coinsRemaining`) and NEITHER side has a +2 non-cycle JOIN.
 *
 * This is a MOVE-level (ordering/root) term, NOT a leaf term. The underlying property
 * ("no good join, placements remain") is player-symmetric, so adding it inside the
 * minimax leaf would break the antisymmetry `v(s,P) = −v(s,¬P)` that negamax requires
 * and bias the search via the per-ply negations. Applied once at the root instead, it
 * cleanly nudges PLACE over JOIN in the FR-006 situation (research R-tempo / Q7).
 */
export function tempo(ctx: MoveContext): number {
  const state = ctx.state;
  if (ctx.move.type !== "PLACE" || state.coinsRemaining <= 0) {
    return 0;
  }
  // A +2 for Heads needs two tails on a clear line; a +2 for Tails needs two heads.
  if (existsClearPair(state, "tails") || existsClearPair(state, "heads")) {
    return 0;
  }
  return 1;
}

// ─── ordering (move) evaluators ──────────────────────────────────────────────

/**
 * Non-cycle JOIN swing (§3, §4, FR-004), side-to-move perspective. Returns 0 for cycle
 * closes (handled by cycleClose) and for PLACEs (handled by leaf terms). Used for move
 * ordering / beam / static fallback only — never added to the leaf value (Q7).
 */
export function deltaSigma(ctx: MoveContext): number {
  return ctx.move.type === "JOIN" && !ctx.isCycleClose ? ctx.deltaSigma : 0;
}

/**
 * Cycle-close region swing 2(t−h) (§3, §9b, FR-005), side-to-move perspective. Returns
 * 0 for non-cycle JOINs and PLACEs. Ordering only — never added to the leaf value (Q7).
 */
export function cycleClose(ctx: MoveContext): number {
  return ctx.move.type === "JOIN" && ctx.isCycleClose ? ctx.deltaSigma : 0;
}
