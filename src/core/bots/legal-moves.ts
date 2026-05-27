import { legalJoins, legalPlacements } from "../state";
import type { GameState, Move } from "../types";

export function allLegalMoves(state: GameState): readonly Move[] {
  const moves: Move[] = [];

  for (const pos of legalPlacements(state)) {
    moves.push({ type: "PLACE", position: pos, face: "heads" });
    moves.push({ type: "PLACE", position: pos, face: "tails" });
  }

  for (const [a, b] of legalJoins(state)) {
    moves.push({ type: "JOIN", a, b });
  }

  return moves;
}
