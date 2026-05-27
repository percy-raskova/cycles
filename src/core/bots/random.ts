import type { BotFunction } from "./index";
import { allLegalMoves } from "./legal-moves";

export const randomBot: BotFunction = (state) => {
  const moves = allLegalMoves(state);
  if (moves.length === 0) {
    throw new Error("No legal moves available");
  }
  const idx = Math.floor(Math.random() * moves.length);
  const move = moves[idx];
  if (!move) {
    throw new Error("No legal moves available");
  }
  return move;
};
