import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  collinearityCheck,
  edgeIntersects,
  pointInPolygon,
  pointOnSegment,
  positionsEqual,
} from "../../geometry";
import { buildPolygon, positionArb } from "../helpers";

describe("Geometry properties", () => {
  describe("edgeIntersects symmetry", () => {
    it("is symmetric for all random line pairs", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 0, max: 6 }),
          checkEdgeIntersectsSymmetry,
        ),
        { numRuns: 1000 },
      );
    });
  });

  describe("pointOnSegment completeness", () => {
    it("finds all intersections lying on the line", () => {
      fc.assert(fc.property(positionArb, positionArb, checkPointOnSegmentCompleteness), {
        numRuns: 100,
      });
    });
  });

  describe("pointInPolygon", () => {
    it("marks points inside a square as interior", () => {
      const square = buildPolygon([
        { row: 0, col: 0 },
        { row: 0, col: 3 },
        { row: 3, col: 3 },
        { row: 3, col: 0 },
      ]);

      expect(pointInPolygon({ row: 1, col: 1 }, square)).toBe(true);
      expect(pointInPolygon({ row: 2, col: 2 }, square)).toBe(true);
    });

    it("marks boundary points as exterior", () => {
      const square = buildPolygon([
        { row: 0, col: 0 },
        { row: 0, col: 3 },
        { row: 3, col: 3 },
        { row: 3, col: 0 },
      ]);

      expect(pointInPolygon({ row: 0, col: 1 }, square)).toBe(false);
      expect(pointInPolygon({ row: 2, col: 3 }, square)).toBe(false);
    });

    it("marks points outside as exterior", () => {
      const square = buildPolygon([
        { row: 0, col: 0 },
        { row: 0, col: 3 },
        { row: 3, col: 3 },
        { row: 3, col: 0 },
      ]);

      expect(pointInPolygon({ row: 5, col: 5 }, square)).toBe(false);
      expect(pointInPolygon({ row: -1, col: 1 }, square)).toBe(false);
    });
  });

  describe("collinearityCheck", () => {
    it("returns true for three collinear points", () => {
      expect(collinearityCheck({ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 })).toBe(
        true,
      );
      expect(collinearityCheck({ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 })).toBe(
        true,
      );
    });

    it("returns false for non-collinear points", () => {
      expect(collinearityCheck({ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 })).toBe(
        false,
      );
      expect(collinearityCheck({ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 0, col: 1 })).toBe(
        false,
      );
    });
  });

  describe("edgeIntersects edge cases", () => {
    it("returns false for shared endpoint edges", () => {
      expect(
        edgeIntersects(
          { row: 0, col: 0 },
          { row: 0, col: 2 },
          { row: 0, col: 2 },
          { row: 2, col: 2 },
        ),
      ).toBe(false);
    });

    it("returns true for crossing edges", () => {
      expect(
        edgeIntersects(
          { row: 0, col: 0 },
          { row: 2, col: 2 },
          { row: 0, col: 2 },
          { row: 2, col: 0 },
        ),
      ).toBe(true);
    });

    it("returns false for parallel non-overlapping edges", () => {
      expect(
        edgeIntersects(
          { row: 0, col: 0 },
          { row: 0, col: 2 },
          { row: 1, col: 0 },
          { row: 1, col: 2 },
        ),
      ).toBe(false);
    });

    it("returns true for overlapping collinear edges", () => {
      expect(
        edgeIntersects(
          { row: 0, col: 0 },
          { row: 0, col: 3 },
          { row: 0, col: 1 },
          { row: 0, col: 4 },
        ),
      ).toBe(true);
    });
  });
});

function checkEdgeIntersectsSymmetry(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  r3: number,
  c3: number,
  r4: number,
  c4: number,
): boolean {
  const a = { row: r1, col: c1 };
  const b = { row: r2, col: c2 };
  const c = { row: r3, col: c3 };
  const d = { row: r4, col: c4 };
  return edgeIntersects(a, b, c, d) === edgeIntersects(c, d, a, b);
}

function checkPointOnSegmentCompleteness(start: Position, end: Position): boolean {
  if (positionsEqual(start, end)) return true;
  const points: Position[] = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const p = { row, col };
      if (pointOnSegment(p, start, end)) {
        points.push(p);
      }
    }
  }
  for (const p of points) {
    if (!collinearityCheck(start, end, p) || !pointOnSegment(p, start, end)) {
      return false;
    }
  }
  return true;
}

import type { Position } from "../../types";
