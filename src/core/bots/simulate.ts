import {
  computeFinalScore,
  createSession,
  type GameSession,
  hasLegalMoves,
  step,
} from "../session";
import type { BotFunction } from "./index";

export interface SimulationConfig {
  readonly botA: BotFunction;
  readonly botB: BotFunction;
  readonly games: number;
  readonly alternateStarts: boolean;
}

export interface SimulationResult {
  readonly winsA: number;
  readonly winsB: number;
  readonly draws: number;
  readonly crashes: number;
  readonly totalGames: number;
}

function runSingleGame(
  botA: BotFunction,
  botB: BotFunction,
  firstPlayer: "HEADS" | "TAILS",
): "HEADS" | "TAILS" | "draw" {
  let session = createSession({ firstPlayer });

  while (!session.isTerminal) {
    session = advanceGame(session, botA, botB);
  }

  return computeFinalScore(session).winner;
}

function advanceGame(session: GameSession, botA: BotFunction, botB: BotFunction): GameSession {
  if (!hasLegalMoves(session)) {
    return handlePass(session);
  }

  const bot = session.state.currentPlayer === "HEADS" ? botA : botB;
  const move = bot(session.state);
  const result = step(session, move);

  if (result.kind === "error") {
    throw new Error(result.error);
  }

  return result.session;
}

function handlePass(session: GameSession): GameSession {
  const result = step(session, { type: "PASS" });

  if (result.kind === "error") {
    throw new Error(result.error);
  }

  return result.session;
}

export function runSimulation(config: SimulationConfig): SimulationResult {
  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  let crashes = 0;

  for (let i = 0; i < config.games; i++) {
    const firstPlayer = config.alternateStarts ? (i % 2 === 0 ? "HEADS" : "TAILS") : "HEADS";

    try {
      const winner = runSingleGame(config.botA, config.botB, firstPlayer);
      if (winner === "draw") {
        draws++;
      } else if (winner === "HEADS") {
        winsA++;
      } else {
        winsB++;
      }
    } catch {
      crashes++;
    }
  }

  return {
    winsA,
    winsB,
    draws,
    crashes,
    totalGames: config.games,
  };
}
