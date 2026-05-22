import { describe, expect, it } from "vitest";
import { runGame } from "../main";

async function* mockInput(lines: string[]): AsyncIterable<string> {
  for (const line of lines) {
    yield line;
  }
}

describe("runGame", () => {
  it("plays a short game until input is exhausted", async () => {
    const outputs: string[] = [];
    const input = mockInput([
      "P A1 H",
      "P B1 T",
      "P C1 H",
      "P D1 T",
      "P E1 H",
      "P F1 T",
      "P G1 H",
      "P A2 T",
      "P B2 H",
      "P C2 T",
      "P D2 H",
      "P E2 T",
    ]);
    await runGame(input, (s) => outputs.push(s));

    expect(outputs[0]).toContain("CYCLES");
    expect(outputs.some((s) => s.includes("HEADS to move"))).toBe(true);
    expect(outputs.some((s) => s.includes("TAILS to move"))).toBe(true);
    expect(outputs.some((s) => s.includes("H"))).toBe(true);
    expect(outputs.some((s) => s.includes("T"))).toBe(true);
    // Input exhausted before terminal; exits with Goodbye
    expect(outputs[outputs.length - 1]).toContain("Goodbye!");
  });

  it("rejects invalid moves and re-prompts", async () => {
    const outputs: string[] = [];
    const input = mockInput(["INVALID", "P A1 H", "P B1 T"]);
    await runGame(input, (s) => outputs.push(s));

    expect(outputs.some((s) => s.includes("Error:"))).toBe(true);
    expect(outputs.some((s) => s.includes("P A1 H"))).toBe(false); // board not raw input
  });

  it("exits gracefully on EOF", async () => {
    const outputs: string[] = [];
    const input = mockInput([]);
    await runGame(input, (s) => outputs.push(s));

    expect(outputs[outputs.length - 1]).toContain("Goodbye!");
  });
});
