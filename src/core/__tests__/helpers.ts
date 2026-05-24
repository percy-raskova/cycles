import fc from "fast-check";
import type { Position } from "../types";

/**
 * fast-check arbitrary for grid positions on the 7x7 board.
 */
export const positionArb = fc.record({
  row: fc.integer({ min: 0, max: 6 }),
  col: fc.integer({ min: 0, max: 6 }),
});

/**
 * Build a simple polygon from unordered vertices by sorting around centroid.
 * Used for property-based pointInPolygon tests.
 */
export function buildPolygon(vertices: readonly Position[]): Position[] {
  const centroid = vertices.reduce(
    (acc, p) => ({
      row: acc.row + p.row / vertices.length,
      col: acc.col + p.col / vertices.length,
    }),
    { row: 0, col: 0 },
  );

  const sorted = [...vertices].sort((a, b) => {
    const angleA = Math.atan2(a.row - centroid.row, a.col - centroid.col);
    const angleB = Math.atan2(b.row - centroid.row, b.col - centroid.col);
    return angleA - angleB;
  });

  return [...sorted, sorted[0] || { row: 0, col: 0 }];
}
