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

  return hasCollinearIntersection(a1, a2, b1, b2, d1, d2, d3, d4);
}

function hasCollinearIntersection(
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

export function pointOnSegment(p: Position, a: Position, b: Position): boolean {
  const cross = (p.row - a.row) * (b.col - a.col) - (p.col - a.col) * (b.row - a.row);
  if (cross !== 0) return false;
  return (
    Math.min(a.row, b.row) <= p.row &&
    p.row <= Math.max(a.row, b.row) &&
    Math.min(a.col, b.col) <= p.col &&
    p.col <= Math.max(a.col, b.col)
  );
}

/**
 * Check if a position lies strictly between the endpoints of any existing edge.
 * If the position IS an endpoint of an edge, it is NOT blocked (coins already exist there).
 */
export function positionBlockedByEdge(
  pos: Position,
  edges: readonly { from: Position; to: Position }[],
): boolean {
  for (const edge of edges) {
    const isEndpoint =
      (pos.row === edge.from.row && pos.col === edge.from.col) ||
      (pos.row === edge.to.row && pos.col === edge.to.col);
    if (isEndpoint) continue;

    if (pointOnSegment(pos, edge.from, edge.to)) {
      return true;
    }
  }
  return false;
}

export function pointInPolygon(point: Position, polygon: readonly Position[]): boolean {
  // Check if point lies exactly on any edge — strict interior means boundary is outside
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (!pi || !pj) continue;
    if (pointOnSegment(point, pi, pj)) return false;
  }

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (!pi || !pj) continue;

    const intersects =
      pi.col > point.col !== pj.col > point.col &&
      point.row < ((pj.row - pi.row) * (point.col - pi.col)) / (pj.col - pi.col) + pi.row;

    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

export function squaredDistance(r1: number, c1: number, r2: number, c2: number): number {
  const dRow = r2 - r1;
  const dCol = c2 - c1;
  return dRow * dRow + dCol * dCol;
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 7 && col >= 0 && col < 7;
}

export function getIntersectionPoints(r1: number, c1: number, r2: number, c2: number): Position[] {
  if (!isValidPosition(r1, c1) || !isValidPosition(r2, c2)) return [];

  const dRow = r2 - r1;
  const dCol = c2 - c1;

  if (dRow === 0 && dCol === 0) {
    return [{ row: r1, col: c1 }];
  }

  if (dRow === 0) {
    return collectHorizontal(r1, c1, c2);
  }
  if (dCol === 0) {
    return collectVertical(r1, r2, c1);
  }
  if (Math.abs(dRow) === Math.abs(dCol)) {
    return collectDiagonal(r1, c1, dRow, dCol);
  }
  return [];
}

function collectHorizontal(row: number, c1: number, c2: number): Position[] {
  const points: Position[] = [];
  const minCol = Math.min(c1, c2);
  const maxCol = Math.max(c1, c2);
  for (let col = minCol; col <= maxCol; col++) {
    points.push({ row, col });
  }
  return points;
}

function collectVertical(r1: number, r2: number, col: number): Position[] {
  const points: Position[] = [];
  const minRow = Math.min(r1, r2);
  const maxRow = Math.max(r1, r2);
  for (let row = minRow; row <= maxRow; row++) {
    points.push({ row, col });
  }
  return points;
}

function collectDiagonal(r1: number, c1: number, dRow: number, dCol: number): Position[] {
  const points: Position[] = [];
  const steps = Math.abs(dRow);
  const rowStep = dRow > 0 ? 1 : -1;
  const colStep = dCol > 0 ? 1 : -1;
  for (let i = 0; i <= steps; i++) {
    points.push({ row: r1 + i * rowStep, col: c1 + i * colStep });
  }
  return points;
}

export function collinearityCheck(a: Position, b: Position, c: Position): boolean {
  return (b.row - a.row) * (c.col - a.col) === (b.col - a.col) * (c.row - a.row);
}
