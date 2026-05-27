import { createSession, createStrategicBot, hasLegalMoves, randomBot } from "@core";
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
    case "strategic":
      // Inject the clock at the UI boundary (Q8) so the engine stays time-free.
      return createStrategicBot({ now: () => performance.now(), deadlineMs: 2000 });
    default:
      return null;
  }
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

      const botPromise = Promise.resolve(botFn(session.state));

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
