import { describe, expect, it } from "vitest";
import { parseMove } from "../parser";

describe("parseMove", () => {
  it("parses PLACE command", () => {
    const result = parseMove("P A1 H");
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.move).toEqual({ type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
  });

  it("parses PLACE with lowercase face", () => {
    const result = parseMove("P G7 t");
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.move).toEqual({ type: "PLACE", position: { row: 6, col: 6 }, face: "tails" });
  });

  it("parses JOIN command", () => {
    const result = parseMove("J A1 B2");
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.move).toEqual({
      type: "JOIN",
      a: { row: 0, col: 0 },
      b: { row: 1, col: 1 },
    });
  });

  it("parses PASS command", () => {
    const result = parseMove("PASS");
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.move).toEqual({ type: "PASS" });
  });

  it("rejects invalid command", () => {
    const result = parseMove("X foo bar");
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.error).toContain("Invalid command format");
  });

  it("rejects PLACE with missing args", () => {
    const result = parseMove("P A1");
    expect(result.kind).toBe("error");
  });

  it("rejects invalid coordinate", () => {
    const result = parseMove("P Z1 H");
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.error).toContain("Invalid coordinate");
  });

  it("rejects out-of-bounds row", () => {
    const result = parseMove("P A9 H");
    expect(result.kind).toBe("error");
  });

  it("rejects invalid face", () => {
    const result = parseMove("P A1 X");
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.error).toContain("Invalid face");
  });

  it("trims whitespace", () => {
    const result = parseMove("  P A1 H  ");
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.move).toEqual({ type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
  });
});
