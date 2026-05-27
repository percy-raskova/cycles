export type * from "./types";
export { positionBlockedByEdge } from "./geometry";
export {
  GRID_SIZE,
  TOTAL_COINS,
  canJoin,
  createInitialState,
  isLegalJoin,
  joinCoins,
  legalJoins,
  legalPlacements,
  placeCoin,
  positionKey,
  passesThroughCoin,
} from "./state";
export { applyMove, coinsInsideCycle, findCycle, isValidState } from "./move";
export { scoreForPlayer } from "./score";
export type { BotFunction, BotStrategy } from "./bots/index";
export * from "./bots/index";
export {
  canUndo,
  computeFinalScore,
  createSession,
  getTurnPrompt,
  hasLegalMoves,
  reset,
  step,
  undo,
} from "./session";
export type { FinalScore, GameSession, StepResult } from "./session";
export {
  deserializeSession,
  deserializeState,
  serializeSession,
  serializeState,
} from "./serialization";
