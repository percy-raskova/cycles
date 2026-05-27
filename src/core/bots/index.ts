import type { GameState, Move } from "../types";

export type BotFunction = (state: GameState) => Move;

export type BotStrategy = "random" | "greedy" | "strategic";

export { greedyBot } from "./greedy";
export * from "./legal-moves";
export { randomBot } from "./random";
export type { SimulationConfig, SimulationResult } from "./simulate";
export { runSimulation } from "./simulate";
export { createStrategicBot, inspectTopMoves, strategicBot } from "./strategic";
export type { InspectedMove, StrategicBotConfig } from "./strategic/types";
