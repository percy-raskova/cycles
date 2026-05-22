import {
  computeFinalScore,
  createSession,
  getTurnPrompt,
  hasLegalMoves,
  step,
} from "../core/session";
import { parseMove } from "./parser";
import { render } from "./renderer";

export async function runGame(
  inputSource: AsyncIterable<string>,
  output: (s: string) => void,
): Promise<void> {
  const session = createSession();

  output("=== CYCLES ===");
  output(`${session.state.currentPlayer} goes first!`);

  const iterator = inputSource[Symbol.asyncIterator]();
  let currentSession = session;

  while (!currentSession.isTerminal) {
    output("");
    output(render(currentSession));
    output(getTurnPrompt(currentSession));

    if (!hasLegalMoves(currentSession)) {
      output("No legal moves. Forced pass.");
      const result = step(currentSession, { type: "PASS" });
      if (result.kind === "ok") {
        currentSession = result.session;
      }
      continue;
    }

    const next = await iterator.next();
    if (next.done) {
      output("Goodbye!");
      return;
    }

    const input = next.value;
    const parseResult = parseMove(input);
    if (parseResult.kind === "error") {
      output(`Error: ${parseResult.error}`);
      continue;
    }

    const stepResult = step(currentSession, parseResult.move);
    if (stepResult.kind === "error") {
      output(`Error: ${stepResult.error}`);
      continue;
    }

    currentSession = stepResult.session;
  }

  // Game over
  output("");
  output(render(currentSession));
  const score = computeFinalScore(currentSession);
  if (score.winner === "draw") {
    output("Game over! It's a draw.");
  } else {
    output(`Game over! ${score.winner} wins!`);
  }
  output(`Heads: ${score.heads}, Tails: ${score.tails}`);
}

export async function main(): Promise<void> {
  const inputSource = createStdinSource();
  await runGame(inputSource, console.log);
}

function createStdinSource(): AsyncIterable<string> {
  return {
    async *[Symbol.asyncIterator]() {
      const { createInterface } = await import("node:readline");
      const rl = createInterface({ input: process.stdin });
      for await (const line of rl) {
        yield line;
      }
      rl.close();
    },
  };
}
