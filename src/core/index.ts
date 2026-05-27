export type { BotFunction, BotStrategy } from "./bots/index";
export * from "./bots/index";
export { positionBlockedByEdge } from "./geometry";
export { applyMove, coinsInsideCycle, findCycle, isValidState } from "./move";
export { scoreForPlayer } from "./score";
export {
  deserializeSession,
  deserializeState,
  serializeSession,
  serializeState,
} from "./serialization";
export type { FinalScore, GameSession, StepResult } from "./session";
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
export {
  canJoin,
  createInitialState,
  GRID_SIZE,
  isLegalJoin,
  legalJoins,
  legalPlacements,
  passesThroughCoin,
  placeCoin,
  positionKey,
  TOTAL_COINS,
} from "./state";
export type * from "./types";
