import { type Agent, type DriverUpdate, driveGame } from "../core/driver/index";
import {
  createSession,
  type FinalScore,
  type GameSession,
  getTurnPrompt,
  step,
} from "../core/session";
import type { Move, Player } from "../core/types";
import { parseMove } from "./parser";
import { render } from "./renderer";

/** Defensive per-turn read ceiling; the input stream (EOF) ends a turn long before this. */
const MAX_TURN_READS = 1000;

function printGameOver(score: FinalScore, output: (s: string) => void): void {
  if (score.winner === "draw") {
    output("Game over! It's a draw.");
  } else {
    output(`Game over! ${score.winner} wins!`);
  }
  output(`Heads: ${score.heads}, Tails: ${score.tails}`);
}

/**
 * Build the hot-seat stdin reader shared by both slots. The CLI is an interactive
 * embedder: it prints the board + prompt, then pre-validates each parsed line with
 * the engine, re-reading (and printing `Error: …`) on parse OR illegal moves so it
 * only ever hands the driver a legal move. Input EOF aborts the run → "Goodbye!".
 */
function makeStdinSelect(
  iterator: AsyncIterator<string>,
  controller: AbortController,
  output: (s: string) => void,
): (session: GameSession) => Promise<Move> {
  return async (session) => {
    for (let read = 0; read < MAX_TURN_READS; read += 1) {
      output("");
      output(render(session));
      output(getTurnPrompt(session));
      const next = await iterator.next();
      if (next.done === true) {
        controller.abort();
        throw controller.signal.reason;
      }
      const parsed = parseMove(next.value);
      if (parsed.kind === "error") {
        output(`Error: ${parsed.error}`);
        continue;
      }
      const validated = step(session, parsed.move);
      if (validated.kind === "error") {
        output(`Error: ${validated.error}`);
        continue;
      }
      return parsed.move;
    }
    /* v8 ignore next 2 -- EOF ends a turn long before this defensive per-turn cap */
    throw new Error(`exceeded ${MAX_TURN_READS} input attempts in a single turn`);
  };
}

export async function runGame(
  inputSource: AsyncIterable<string>,
  output: (s: string) => void,
): Promise<void> {
  const iterator = inputSource[Symbol.asyncIterator]();
  const controller = new AbortController();
  const initial = createSession();
  let latest: GameSession = initial;

  const selectMove = makeStdinSelect(iterator, controller, output);
  const agent = (slot: Player): Agent => ({ slot, selectMove });

  const onUpdate = (update: DriverUpdate): void => {
    if (update.kind === "start") {
      latest = update.session;
      output("=== CYCLES ===");
      output(`${update.session.state.currentPlayer} goes first!`);
    } else if (update.kind === "applied") {
      latest = update.session;
    } else if (update.kind === "end") {
      output("");
      output(render(update.session));
      printGameOver(update.result, output);
    }
  };

  try {
    await driveGame({
      initialSession: initial,
      agents: { HEADS: agent("HEADS"), TAILS: agent("TAILS") },
      onUpdate,
      signal: controller.signal,
      hooks: {
        // beforeForcedPass has no session, so render the tracked `latest` (the
        // pre-pass board) to reproduce the legacy forced-pass output exactly.
        beforeForcedPass: () => {
          output("");
          output(render(latest));
          output(getTurnPrompt(latest));
          output("No legal moves. Forced pass.");
        },
      },
    });
  } catch (error) {
    if (controller.signal.aborted) {
      output("Goodbye!");
      return;
    }
    throw error;
  }
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
