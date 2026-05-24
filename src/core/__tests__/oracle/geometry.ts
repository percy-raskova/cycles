import type { Position } from "../../types";

/**
 * Independent mathematical oracle for segment intersection.
 * These functions deliberately duplicate the algorithm in geometry.ts
 * to serve as a ground-truth reference for property-based tests.
 */

export function referenceSegmentsIntersect(
  a1: Position,
  a2: Position,
  b1: Position,
  b2: Position,
): boolean {
  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return checkCollinear(a1, a2, b1, b2, d1, d2, d3, d4);
}

function checkCollinear(
  a1: Position,
  a2: Position,
  b1: Position,
  b2: Position,
  d1: number,
  d2: number,
  d3: number,
  d4: number,
): boolean {
  if (d1 === 0 && onSegment(b1, b2, a1)) return true;
  if (d2 === 0 && onSegment(b1, b2, a2)) return true;
  if (d3 === 0 && onSegment(a1, a2, b1)) return true;
  if (d4 === 0 && onSegment(a1, a2, b2)) return true;
  return false;
}

function onSegment(a: Position, b: Position, c: Position): boolean {
  return (
    Math.min(a.row, b.row) <= c.row &&
    c.row <= Math.max(a.row, b.row) &&
    Math.min(a.col, b.col) <= c.col &&
    c.col <= Math.max(a.col, b.col)
  );
}

function direction(a: Position, b: Position, c: Position): number {
  return (c.row - a.row) * (b.col - a.col) - (b.row - a.row) * (c.col - a.col);
}

export function shareEndpoint(a1: Position, a2: Position, b1: Position, b2: Position): boolean {
  return (
    (a1.row === b1.row && a1.col === b1.col) ||
    (a1.row === b2.row && a1.col === b2.col) ||
    (a2.row === b1.row && a2.col === b1.col) ||
    (a2.row === b2.row && a2.col === b2.col)
  );
}
