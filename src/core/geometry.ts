import type { Position } from "./types";

export function isQueenLine(a: Position, b: Position): boolean {
  if (a.row === b.row && a.col === b.col) return false;

  const dRow = b.row - a.row;
  const dCol = b.col - a.col;

  return (
    a.row === b.row || // horizontal
    a.col === b.col || // vertical
    Math.abs(dRow) === Math.abs(dCol) // diagonal
  );
}

export function areEdgesEqual(
  e1: { from: Position; to: Position },
  e2: { from: Position; to: Position },
): boolean {
  return (
    (e1.from.row === e2.from.row &&
      e1.from.col === e2.from.col &&
      e1.to.row === e2.to.row &&
      e1.to.col === e2.to.col) ||
    (e1.from.row === e2.to.row &&
      e1.from.col === e2.to.col &&
      e1.to.row === e2.from.row &&
      e1.to.col === e2.from.col)
  );
}

export function edgeIntersects(a1: Position, a2: Position, b1: Position, b2: Position): boolean {
  if (areEdgesEqual({ from: a1, to: a2 }, { from: b1, to: b2 })) {
    return false;
  }

  const hasSharedEndpoint =
    (a1.row === b1.row && a1.col === b1.col) ||
    (a1.row === b2.row && a1.col === b2.col) ||
    (a2.row === b1.row && a2.col === b1.col) ||
    (a2.row === b2.row && a2.col === b2.col);

  if (hasSharedEndpoint) {
    return false;
  }

  return segmentsIntersect(a1, a2, b1, b2);
}

function segmentsIntersect(a1: Position, a2: Position, b1: Position, b2: Position): boolean {
  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return false;
}

function direction(a: Position, b: Position, c: Position): number {
  return (c.row - a.row) * (b.col - a.col) - (b.row - a.row) * (c.col - a.col);
}
