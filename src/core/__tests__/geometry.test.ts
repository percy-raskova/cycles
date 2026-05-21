import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { areEdgesEqual, edgeIntersects, isQueenLine } from "../geometry";
import type { Position } from "../types";

function referenceSegmentsIntersect(
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

function shareEndpoint(a1: Position, a2: Position, b1: Position, b2: Position): boolean {
  return (
    (a1.row === b1.row && a1.col === b1.col) ||
    (a1.row === b2.row && a1.col === b2.col) ||
    (a2.row === b1.row && a2.col === b1.col) ||
    (a2.row === b2.row && a2.col === b2.col)
  );
}

const positionArb = fc.record({
  row: fc.integer({ min: 0, max: 6 }),
  col: fc.integer({ min: 0, max: 6 }),
});

describe("geometry", () => {
  describe("isQueenLine", () => {
    it("identifies horizontal lines", () => {
      expect(isQueenLine({ row: 3, col: 1 }, { row: 3, col: 5 })).toBe(true);
    });

    it("identifies vertical lines", () => {
      expect(isQueenLine({ row: 1, col: 3 }, { row: 5, col: 3 })).toBe(true);
    });

    it("identifies positive diagonal lines", () => {
      expect(isQueenLine({ row: 1, col: 1 }, { row: 5, col: 5 })).toBe(true);
    });

    it("identifies negative diagonal lines", () => {
      expect(isQueenLine({ row: 1, col: 5 }, { row: 5, col: 1 })).toBe(true);
    });

    it("rejects identical points", () => {
      expect(isQueenLine({ row: 3, col: 3 }, { row: 3, col: 3 })).toBe(false);
    });

    it("rejects non-queen-lines", () => {
      expect(isQueenLine({ row: 1, col: 1 }, { row: 2, col: 3 })).toBe(false);
      expect(isQueenLine({ row: 0, col: 0 }, { row: 2, col: 1 })).toBe(false);
    });
  });

  describe("areEdgesEqual", () => {
    it("identifies identical edges", () => {
      const e1 = { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } };
      const e2 = { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } };
      expect(areEdgesEqual(e1, e2)).toBe(true);
    });

    it("identifies reversed edges", () => {
      const e1 = { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } };
      const e2 = { from: { row: 1, col: 1 }, to: { row: 0, col: 0 } };
      expect(areEdgesEqual(e1, e2)).toBe(true);
    });

    it("rejects different edges", () => {
      const e1 = { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } };
      const e2 = { from: { row: 0, col: 0 }, to: { row: 2, col: 2 } };
      expect(areEdgesEqual(e1, e2)).toBe(false);
    });
  });

  describe("edgeIntersects", () => {
    it("returns false for identical edges", () => {
      const a = { row: 0, col: 0 };
      const b = { row: 2, col: 2 };
      expect(edgeIntersects(a, b, a, b)).toBe(false);
    });

    it("returns false for edges sharing an endpoint", () => {
      const a = { row: 0, col: 0 };
      const b = { row: 2, col: 2 };
      const c = { row: 2, col: 0 };
      expect(edgeIntersects(a, b, a, c)).toBe(false);
      expect(edgeIntersects(a, b, c, a)).toBe(false);
    });

    it("detects crossing diagonals", () => {
      const a1 = { row: 0, col: 0 };
      const a2 = { row: 2, col: 2 };
      const b1 = { row: 0, col: 2 };
      const b2 = { row: 2, col: 0 };
      expect(edgeIntersects(a1, a2, b1, b2)).toBe(true);
    });

    it("detects crossing horizontal and vertical", () => {
      const a1 = { row: 1, col: 0 };
      const a2 = { row: 1, col: 3 };
      const b1 = { row: 0, col: 2 };
      const b2 = { row: 3, col: 2 };
      expect(edgeIntersects(a1, a2, b1, b2)).toBe(true);
    });

    it("returns false for parallel non-intersecting segments", () => {
      const a1 = { row: 0, col: 0 };
      const a2 = { row: 0, col: 2 };
      const b1 = { row: 1, col: 0 };
      const b2 = { row: 1, col: 2 };
      expect(edgeIntersects(a1, a2, b1, b2)).toBe(false);
    });

    it("returns false for collinear non-overlapping segments", () => {
      const a1 = { row: 0, col: 0 };
      const a2 = { row: 0, col: 1 };
      const b1 = { row: 0, col: 2 };
      const b2 = { row: 0, col: 3 };
      expect(edgeIntersects(a1, a2, b1, b2)).toBe(false);
    });

    it("returns true for collinear overlapping segments", () => {
      const a1 = { row: 0, col: 0 };
      const a2 = { row: 0, col: 3 };
      const b1 = { row: 0, col: 2 };
      const b2 = { row: 0, col: 4 };
      expect(edgeIntersects(a1, a2, b1, b2)).toBe(true);
    });
  });

  describe("property-based edgeIntersects", () => {
    it("matches mathematical ground truth for all random segment pairs", () => {
      fc.assert(
        fc.property(positionArb, positionArb, positionArb, positionArb, (a1, a2, b1, b2) => {
          const trulyIntersect = referenceSegmentsIntersect(a1, a2, b1, b2);
          const shareEnd = shareEndpoint(a1, a2, b1, b2);
          const identical = areEdgesEqual({ from: a1, to: a2 }, { from: b1, to: b2 });

          const expected = trulyIntersect && !shareEnd && !identical;
          const actual = edgeIntersects(a1, a2, b1, b2);

          return expected === actual;
        }),
        { numRuns: 1000 },
      );
    });
  });
});
