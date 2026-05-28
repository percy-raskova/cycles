import { describe, expect, it } from "vitest";
import { allLegalMoves } from "../../core/bots/index";
import { computeFinalScore, createSession, hasLegalMoves, step } from "../../core/session";
import type { Move, Player, Position } from "../../core/types";
import { runGame } from "../main";

async function* mockInput(lines: string[]): AsyncIterable<string> {
  for (const line of lines) {
    yield line;
  }
}

function coord(p: Position): string {
  return `${String.fromCharCode(65 + p.col)}${p.row + 1}`;
}

function moveToCli(move: Move): string {
  switch (move.type) {
    case "PLACE":
      return `P ${coord(move.position)} ${move.face === "heads" ? "H" : "T"}`;
    case "JOIN":
      return `J ${coord(move.a)} ${coord(move.b)}`;
    case "PASS":
      return "PASS";
  }
}

/** Play a complete game via the engine; return the voluntary moves as CLI input lines. */
function fullGameTranscript(firstPlayer: Player): {
  input: string[];
  heads: number;
  tails: number;
} {
  let session = createSession({ firstPlayer });
  const input: string[] = [];
  for (let i = 0; i < 500 && !session.isTerminal; i += 1) {
    let move: Move = { type: "PASS" };
    if (hasLegalMoves(session)) {
      const legal = allLegalMoves(session.state)[0];
      if (legal === undefined) {
        throw new Error("expected a legal move");
      }
      move = legal;
      input.push(moveToCli(legal));
    }
    const result = step(session, move);
    if (result.kind === "error") {
      throw new Error(`transcript step failed: ${result.error}`);
    }
    session = result.session;
  }
  const score = computeFinalScore(session);
  return { input, heads: score.heads, tails: score.tails };
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

  it("plays a full game to terminal with forced-pass notices and a game-over summary", async () => {
    const transcript = fullGameTranscript("TAILS"); // CLI uses createSession() default = TAILS
    const outputs: string[] = [];
    await runGame(mockInput(transcript.input), (s) => outputs.push(s));

    const text = outputs.join("\n");
    expect(text).toContain("No legal moves. Forced pass.");
    expect(text).toContain("Game over!");
    expect(outputs[outputs.length - 1]).toBe(
      `Heads: ${transcript.heads}, Tails: ${transcript.tails}`,
    );
  });

  it("re-prompts on an illegal but parseable move without crashing", async () => {
    const outputs: string[] = [];
    // TAILS places A1; HEADS tries the now-occupied A1 (parseable but illegal), then a legal cell.
    await runGame(mockInput(["P A1 H", "P A1 T", "P B1 H"]), (s) => outputs.push(s));

    expect(outputs.some((s) => s.startsWith("Error:"))).toBe(true);
    expect(outputs[outputs.length - 1]).toContain("Goodbye!"); // input exhausts ⇒ EOF
  });
});
