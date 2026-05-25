import { describe, expect, it } from "vitest";
import { deriveLog } from "../deriveLog";

describe("deriveLog", () => {
  it("returns empty array for empty history", () => {
    expect(deriveLog([])).toEqual([]);
  });

  it("formats a PLACE move for HEADS", () => {
    const history = [
      { type: "PLACE" as const, position: { row: 3, col: 4 }, face: "heads" as const },
    ];
    const result = deriveLog(history);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: "PLACE",
      text: "HEADS placed Heads @ (4,5)",
    });
  });

  it("formats a PLACE move for TAILS", () => {
    const history = [
      { type: "PLACE" as const, position: { row: 0, col: 0 }, face: "heads" as const },
      { type: "PLACE" as const, position: { row: 1, col: 2 }, face: "tails" as const },
    ];
    const result = deriveLog(history);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      action: "PLACE",
      text: "TAILS placed Tails @ (2,3)",
    });
  });

  it("formats a JOIN move", () => {
    const history = [
      { type: "PLACE" as const, position: { row: 0, col: 0 }, face: "heads" as const },
      { type: "JOIN" as const, a: { row: 0, col: 0 }, b: { row: 0, col: 2 } },
    ];
    const result = deriveLog(history);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      action: "JOIN",
      text: "TAILS joined (1,1)↔(1,3)",
    });
  });

  it("formats a PASS move", () => {
    const history = [
      { type: "PLACE" as const, position: { row: 0, col: 0 }, face: "heads" as const },
      { type: "PASS" as const },
    ];
    const result = deriveLog(history);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      action: "PASS",
      text: "TAILS passed",
    });
  });

  it("formats a mixed sequence", () => {
    const history = [
      { type: "PLACE" as const, position: { row: 0, col: 0 }, face: "heads" as const },
      { type: "PLACE" as const, position: { row: 1, col: 1 }, face: "tails" as const },
      { type: "JOIN" as const, a: { row: 0, col: 0 }, b: { row: 1, col: 1 } },
      { type: "PASS" as const },
    ];
    const result = deriveLog(history);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ action: "PLACE", text: "HEADS placed Heads @ (1,1)" });
    expect(result[1]).toEqual({ action: "PLACE", text: "TAILS placed Tails @ (2,2)" });
    expect(result[2]).toEqual({ action: "JOIN", text: "HEADS joined (1,1)↔(2,2)" });
    expect(result[3]).toEqual({ action: "PASS", text: "TAILS passed" });
  });
});
