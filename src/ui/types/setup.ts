import type { Player } from "@core";

export type BotStrategyUI = "random" | "greedy";
export type OpponentType = "human" | BotStrategyUI;

export interface GameSetupOptions {
  readonly opponent: OpponentType;
  readonly playerRole: Player;
  readonly humanFirst: boolean;
}
