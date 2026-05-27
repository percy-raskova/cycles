import {
  allLegalMoves,
  applyMove,
  createSession,
  greedyBot,
  hasLegalMoves,
  randomBot,
  scoreForPlayer,
} from "@core";
import type { GameSession, Move, Player } from "@core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameSetupOptions } from "../types/setup";
import { useGameSession } from "./useGameSession";

export interface UseBotGameOptions extends GameSetupOptions {
  readonly botDelayMs?: number;
}

export interface UseBotGameReturn {
  readonly session: GameSession;
  readonly applyMove: (move: Move) => ReturnType<ReturnType<typeof useGameSession>["applyMove"]>;
  readonly reset: () => void;
  readonly undo: () => void;
  readonly canUndo: boolean;
  readonly finalScore: ReturnType<typeof useGameSession>["finalScore"];
  readonly botThinking: boolean;
}

function oppositePlayer(player: Player): Player {
  return player === "HEADS" ? "TAILS" : "HEADS";
}

function createBotSession(options: UseBotGameOptions): GameSession {
  const firstPlayer = options.humanFirst ? options.playerRole : oppositePlayer(options.playerRole);
  return createSession({ firstPlayer });
}

function getBotFunction(opponent: GameSetupOptions["opponent"]) {
  switch (opponent) {
    case "random":
      return randomBot;
    case "greedy":
      return greedyBot;
    default:
      return null;
  }
}

/**
 * A yielding version of greedyBot that spreads evaluation across
 * microtasks so the UI thread can paint between move simulations.
 * This prevents frame drops on complex board states.
 */
async function yieldingGreedyBot(
  state: Parameters<typeof greedyBot>[0],
): Promise<ReturnType<typeof greedyBot>> {
  const moves = allLegalMoves(state);
  if (moves.length === 0) {
    throw new Error("No legal moves available");
  }

  const player = state.currentPlayer;
  const before = scoreForPlayer(state, player);

  let bestMove = moves[0];
  let bestDelta = Number.NEGATIVE_INFINITY;

  if (!bestMove) {
    throw new Error("No legal moves available");
  }

  // Evaluate moves in chunks of 8, yielding between chunks
  const CHUNK_SIZE = 8;
  for (let i = 0; i < moves.length; i += CHUNK_SIZE) {
    const chunk = moves.slice(i, i + CHUNK_SIZE);
    for (const move of chunk) {
      try {
        const nextState = applyMove(state, move);
        const after = scoreForPlayer(nextState, player);
        const delta = after - before;

        if (delta > bestDelta) {
          bestDelta = delta;
          bestMove = move;
        }
      } catch {
        // Skip illegal moves
      }
    }
    // Yield to browser — allow paint/frame between chunks
    if (i + CHUNK_SIZE < moves.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return bestMove;
}

export function useBotGame(options: UseBotGameOptions): UseBotGameReturn {
  const initialSession = createBotSession(options);
  const gameSession = useGameSession({ initialSession });

  const [botThinking, setBotThinking] = useState(false);

  // Refs to avoid stale closures and unnecessary effect re-runs
  const sessionRef = useRef(gameSession.session);
  const applyMoveRef = useRef(gameSession.applyMove);
  const playerRoleRef = useRef(options.playerRole);
  const opponentRef = useRef(options.opponent);
  const delayMsRef = useRef(options.botDelayMs ?? 2000);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunningRef = useRef(false);

  // Keep refs in sync without triggering effects
  sessionRef.current = gameSession.session;
  applyMoveRef.current = gameSession.applyMove;
  playerRoleRef.current = options.playerRole;
  opponentRef.current = options.opponent;
  delayMsRef.current = options.botDelayMs ?? 2000;

  const currentPlayer = gameSession.session.state.currentPlayer;
  const isTerminal = gameSession.session.isTerminal;
  const isBotOpponent = opponentRef.current !== "human";
  const isBotTurn = isBotOpponent && currentPlayer !== playerRoleRef.current && !isTerminal;

  // Schedule bot move only when it's the bot's turn and not already running.
  // The effect dependency is `isBotTurn` (a boolean), so:
  //   - Re-renders during hover do NOT cancel the pending timer
  //   - The timer only cancels when the bot turn actually ends
  useEffect(() => {
    if (!isBotTurn || isRunningRef.current) return;

    const delay = delayMsRef.current;
    isRunningRef.current = true;
    setBotThinking(true);

    botTimerRef.current = setTimeout(() => {
      const session = sessionRef.current;
      if (!hasLegalMoves(session)) {
        isRunningRef.current = false;
        setBotThinking(false);
        return;
      }

      const botFn = getBotFunction(opponentRef.current);
      if (!botFn) {
        isRunningRef.current = false;
        setBotThinking(false);
        return;
      }

      const botPromise =
        opponentRef.current === "greedy"
          ? yieldingGreedyBot(session.state)
          : Promise.resolve(botFn(session.state));

      botPromise
        .then((move) => {
          applyMoveRef.current(move);
        })
        .catch((err) => {
          console.error("Bot move failed:", err);
        })
        .finally(() => {
          isRunningRef.current = false;
          setBotThinking(false);
        });
    }, delay);

    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
    };
  }, [isBotTurn]);

  const handleReset = useCallback(() => {
    isRunningRef.current = false;
    setBotThinking(false);
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
    gameSession.reset();
  }, [gameSession]);

  return {
    session: gameSession.session,
    applyMove: gameSession.applyMove,
    reset: handleReset,
    undo: gameSession.undo,
    canUndo: gameSession.canUndo,
    finalScore: gameSession.finalScore,
    botThinking,
  };
}
