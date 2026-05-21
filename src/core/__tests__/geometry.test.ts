import { describe, expect, it } from "vitest";
import { isQueenLine } from "../geometry";

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
});
