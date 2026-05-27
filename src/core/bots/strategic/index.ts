import type { GameState, Move } from "../../types";
import { greedyBot } from "../greedy";
import type { BotFunction } from "../index";
import { allLegalMoves } from "../legal-moves";
import { isAllZeroBreakdown } from "./evaluate";
import { compareScoredMoves } from "./move-order";
import { searchRoot } from "./search";
import type { InspectedMove, StrategicBotConfig } from "./types";
import { DEFAULT_CONFIG } from "./weights";

/**
 * Choose a move via 3-ply alpha–beta minimax over the weighted-sum leaf heuristics,
 * with deterministic FR-002 selection. Fallbacks to Greedy: (a) when an injected
 * deadline elapses before any root move completes (R4), and (b) when every root
 * candidate's heuristic score is zero (FR-008). Pure: never mutates `state`.
 */
function chooseMove(state: GameState, config: StrategicBotConfig): Move {
  const moves = allLegalMoves(state);
  if (moves.length === 0) {
    throw new Error("No legal moves available");
  }

  const scored = searchRoot(state, config);
  if (scored.length === 0) {
    return greedyBot(state); // deadline hit before any root move (R4)
  }
  if (scored.every((s) => isAllZeroBreakdown(s.breakdown))) {
    return greedyBot(state); // FR-008: no heuristic produced a non-neutral signal
  }

  const sorted = [...scored].sort(compareScoredMoves);
  return sorted[0]?.move ?? greedyBot(state);
}

/**
 * Build a Strategic bot bound to a config (partial overrides merge over the defaults).
 * The UI uses this to inject a clock (`now`) + `deadlineMs` for the production timeout
 * (Q8); tests/tournaments use the pure default (no clock ⇒ deterministic).
 */
export function createStrategicBot(overrides: Partial<StrategicBotConfig> = {}): BotFunction {
  const config: StrategicBotConfig = { ...DEFAULT_CONFIG, ...overrides };
  return (state) => chooseMove(state, config);
}

/** The default, pure, deterministic Strategic bot (FR-002). */
export const strategicBot: BotFunction = (state) => chooseMove(state, DEFAULT_CONFIG);

/**
 * Developer inspection API (FR-011): the top-N candidate moves ranked by the same
 * criterion the bot selects by (so `inspectTopMoves(state, 1)[0].move` === the bot's
 * move), each with a per-heuristic score breakdown. Never mutates `state`.
 */
export function inspectTopMoves(
  state: GameState,
  n: number,
  config: StrategicBotConfig = DEFAULT_CONFIG,
): readonly InspectedMove[] {
  if (n <= 0) {
    return [];
  }
  const sorted = [...searchRoot(state, config)].sort(compareScoredMoves);
  return sorted.slice(0, n).map((s) => ({
    move: s.move,
    totalScore: s.totalScore,
    breakdown: s.breakdown,
  }));
}
