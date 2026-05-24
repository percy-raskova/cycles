/**
 * E2E fixtures for CYCLES Playwright tests.
 *
 * These helpers construct move sequences that can be replayed through the UI
 * to reach specific game states for end-to-end testing.
 */

export interface MoveAction {
  readonly kind: "PLACE" | "JOIN";
  readonly row: number;
  readonly col: number;
  readonly face?: "heads" | "tails";
  readonly toRow?: number;
  readonly toCol?: number;
}

/** A sequence that places coins along the top row. */
export function topRowPlacementMoves(): MoveAction[] {
  return [
    { kind: "PLACE", row: 0, col: 0, face: "heads" },
    { kind: "PLACE", row: 0, col: 2, face: "tails" },
    { kind: "PLACE", row: 0, col: 4, face: "heads" },
    { kind: "PLACE", row: 0, col: 6, face: "tails" },
  ];
}

/** A sequence that creates a 2×2 square cycle at the top-left. */
export function squareCycleMoves(): MoveAction[] {
  return [
    // Place four corners
    { kind: "PLACE", row: 0, col: 0, face: "heads" },
    { kind: "PLACE", row: 0, col: 2, face: "tails" },
    { kind: "PLACE", row: 2, col: 2, face: "heads" },
    { kind: "PLACE", row: 2, col: 0, face: "tails" },
    // Join three sides
    { kind: "JOIN", row: 0, col: 0, toRow: 0, toCol: 2 },
    { kind: "JOIN", row: 0, col: 2, toRow: 2, toCol: 2 },
    { kind: "JOIN", row: 2, col: 2, toRow: 2, toCol: 0 },
    // Close the cycle
    { kind: "JOIN", row: 2, col: 0, toRow: 0, toCol: 0 },
  ];
}

/** Exhaust the coin supply without creating any joins. */
export function exhaustSupplyMoves(): MoveAction[] {
  const moves: MoveAction[] = [];
  let faceToggle = true;
  for (let i = 0; i < 12; i++) {
    moves.push({
      kind: "PLACE",
      row: i % 7,
      col: Math.floor(i / 7),
      face: faceToggle ? "heads" : "tails",
    });
    faceToggle = !faceToggle;
  }
  return moves;
}
