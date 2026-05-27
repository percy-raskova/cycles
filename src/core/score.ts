import type { GameState, Player } from "./types";

export function scoreForPlayer(state: GameState, player: Player): number {
  const targetFace = player === "HEADS" ? "heads" : "tails";
  let count = 0;
  for (const coin of state.coins.values()) {
    if (coin.face === targetFace) {
      count++;
    }
  }
  return count;
}
