import { applyMove } from "../move";
import { scoreForPlayer } from "../score";
import type { BotFunction } from "./index";
import { allLegalMoves } from "./legal-moves";

export const greedyBot: BotFunction = (state) => {
  const moves = allLegalMoves(state);
  if (moves.length === 0) {
    throw new Error("No legal moves available");
  }

  const player = state.currentPlayer;
  const before = scoreForPlayer(state, player);

  let bestMove = moves[0];
  let bestDelta = Number.NEGATIVE_INFINITY;

  if (!bestMove) {
    throw new Error("No legal moves available");
  }

  for (const move of moves) {
    try {
      const nextState = applyMove(state, move);
      const after = scoreForPlayer(nextState, player);
      const delta = after - before;

      if (delta > bestDelta) {
        bestDelta = delta;
        bestMove = move;
      }
    } catch {
      // Skip illegal moves (shouldn't happen with allLegalMoves)
    }
  }

  return bestMove;
};
