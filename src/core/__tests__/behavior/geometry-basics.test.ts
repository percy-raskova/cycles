import { describe, expect, it } from "vitest";
import {
  getIntersectionPoints,
  isValidPosition,
  positionsEqual,
  squaredDistance,
} from "../../geometry";

describe("Geometry basics", () => {
  describe("squaredDistance", () => {
    it("returns 0 for identical points", () => {
      expect(squaredDistance(1, 2, 1, 2)).toBe(0);
    });

    it("calculates correct squared distance", () => {
      expect(squaredDistance(0, 0, 3, 4)).toBe(25);
    });
  });

  describe("positionsEqual", () => {
    it("returns true for identical positions", () => {
      expect(positionsEqual({ row: 0, col: 0 }, { row: 0, col: 0 })).toBe(true);
    });

    it("returns false for different positions", () => {
      expect(positionsEqual({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(false);
      expect(positionsEqual({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(false);
    });
  });

  describe("isValidPosition", () => {
    it("returns true for valid board positions", () => {
      expect(isValidPosition(0, 0)).toBe(true);
      expect(isValidPosition(6, 6)).toBe(true);
    });

    it("returns false for out of bounds positions", () => {
      expect(isValidPosition(-1, 0)).toBe(false);
      expect(isValidPosition(0, -1)).toBe(false);
      expect(isValidPosition(7, 0)).toBe(false);
      expect(isValidPosition(0, 7)).toBe(false);
    });
  });

  describe("getIntersectionPoints", () => {
    it("finds all board intersections that a line passes through", () => {
      const horizontal = getIntersectionPoints(0, 0, 0, 3);
      expect(horizontal).toHaveLength(4);
      expect(horizontal.map((p) => `${p.row},${p.col}`).sort()).toEqual([
        "0,0",
        "0,1",
        "0,2",
        "0,3",
      ]);
    });

    it("finds diagonal intersections", () => {
      const diagonal = getIntersectionPoints(0, 0, 2, 2);
      expect(diagonal).toHaveLength(3);
      expect(diagonal.map((p) => `${p.row},${p.col}`).sort()).toEqual(["0,0", "1,1", "2,2"]);
    });

    it("returns empty array for non-queen-line", () => {
      const knight = getIntersectionPoints(0, 0, 1, 2);
      expect(knight).toHaveLength(0);
    });

    it("returns single point for zero-length", () => {
      const zero = getIntersectionPoints(3, 3, 3, 3);
      expect(zero).toHaveLength(1);
      expect(zero[0]).toEqual({ row: 3, col: 3 });
    });
  });
});
