import { applyMove } from "../move";
import { type GameSession, computeFinalScore, createSession, hasLegalMoves } from "../session";
import type { PassMove } from "../types";
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
  const newState = applyMove(session.state, move);

  if (newState.passCount >= 2) {
    const score = computeFinalScore({ ...session, state: newState });
    return {
      ...session,
      state: newState,
      history: [...session.history, move],
      isTerminal: true,
      winner: score.winner,
    };
  }

  return { ...session, state: newState, history: [...session.history, move] };
}

function handlePass(session: GameSession): GameSession {
  const passMove: PassMove = { type: "PASS" };
  const passState = applyMove(session.state, passMove);
  const newSession = {
    ...session,
    state: passState,
    history: [...session.history, passMove],
  };

  if (passState.passCount >= 2) {
    const score = computeFinalScore(newSession);
    return { ...newSession, isTerminal: true, winner: score.winner };
  }

  return newSession;
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
