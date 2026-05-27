import { applyMove, coinsInsideCycle, findCycle } from "../../move";
import { positionKey } from "../../state";
import type { GameState, Move, Player, Position } from "../../types";

/**
 * The score functional σ(S) = #heads − #tails (cycles-game-theory.md §2).
 * Heads maximizes, Tails minimizes; σ ∈ [−12, +12].
 */
export function sigma(state: GameState): number {
  let heads = 0;
  let tails = 0;
  for (const coin of state.coins.values()) {
    if (coin.face === "heads") {
      heads++;
    } else {
      tails++;
    }
  }
  return heads - tails;
}

/** σ from `player`'s perspective: +σ for Heads, −σ for Tails. */
export function signedSigma(state: GameState, player: Player): number {
  const s = sigma(state);
  return player === "HEADS" ? s : -s;
}

/**
 * Exact σ swing of a move (Heads perspective), computed via the engine so it always
 * matches `applyMove`. For a non-cycle JOIN this is ±4/0; for a cycle close it is the
 * 2(t−h) region swing; for a PLACE it is ±1.
 */
export function moveDeltaSigma(state: GameState, move: Move): number {
  return sigma(applyMove(state, move)) - sigma(state);
}

/** Move σ swing from the side-to-move's perspective (sign-flips for Tails). */
export function signedDeltaSigma(state: GameState, move: Move): number {
  const raw = moveDeltaSigma(state, move);
  return state.currentPlayer === "HEADS" ? raw : -raw;
}

/**
 * Analytic σ swing (Heads perspective) of a JOIN without cloning state via `applyMove`
 * — used for cheap move ordering. Validated against the engine in strategic-sigma.test.
 *
 * - Cycle close: flips the whole enclosed region (boundary + interior) → Δσ = 2(t−h)
 *   where t/h are the tails/heads counts in the region (§3).
 * - Non-cycle: flips both endpoints → each endpoint contributes +2 (T→H) or −2 (H→T).
 *   (§3 labels these ±2, but that is Δ#heads; the real σ swing is double, hence ±2 here
 *   per endpoint summing to ±4/0 — see strategic-sigma.test for the cross-check.)
 */
export function joinDeltaSigmaAnalytic(state: GameState, a: Position, b: Position): number {
  return analyzeJoin(state, a, b).delta;
}

/**
 * Analytic JOIN result in a single `findCycle`: the Heads-perspective σ swing and
 * whether the move closes a cycle. Used by move ordering to avoid an extra BFS.
 */
export function analyzeJoin(
  state: GameState,
  a: Position,
  b: Position,
): { readonly delta: number; readonly isCycle: boolean } {
  const cycle = findCycle(state, a, b);
  if (cycle) {
    return { delta: cycleSwing(state, cycle), isCycle: true };
  }
  return { delta: endpointFlip(state, a) + endpointFlip(state, b), isCycle: false };
}

function endpointFlip(state: GameState, pos: Position): number {
  const coin = state.coins.get(positionKey(pos));
  if (!coin) {
    return 0;
  }
  // Flipping a tails coin to heads raises σ by 2; a heads coin lowers it by 2.
  return coin.face === "tails" ? 2 : -2;
}

function cycleSwing(state: GameState, cyclePath: readonly Position[]): number {
  let heads = 0;
  let tails = 0;
  for (const pos of coinsInsideCycle(state, cyclePath)) {
    const coin = state.coins.get(positionKey(pos));
    if (!coin) {
      continue;
    }
    if (coin.face === "heads") {
      heads++;
    } else {
      tails++;
    }
  }
  return 2 * (tails - heads);
}
