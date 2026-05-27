import type { GameState, Move } from "../types";

export type BotFunction = (state: GameState) => Move;

export type BotStrategy = "random" | "greedy" | "strategic";

export * from "./legal-moves";
export { greedyBot } from "./greedy";
export { randomBot } from "./random";
export { createStrategicBot, inspectTopMoves, strategicBot } from "./strategic";
export { runSimulation } from "./simulate";
export type { SimulationConfig, SimulationResult } from "./simulate";
export type { InspectedMove, StrategicBotConfig } from "./strategic/types";
