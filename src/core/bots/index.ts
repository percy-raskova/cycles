import type { GameState, Move } from "../types";

export type BotFunction = (state: GameState) => Move;

export type BotStrategy = "random" | "greedy";

export * from "./legal-moves";
export { greedyBot } from "./greedy";
export { randomBot } from "./random";
export { runSimulation } from "./simulate";
export type { SimulationConfig, SimulationResult } from "./simulate";
