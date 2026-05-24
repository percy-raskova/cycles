import { canUndo as canUndoFn, computeFinalScore, createSession, reset, step, undo } from "@core";
import type { GameSession, Move } from "@core";
import { useCallback, useState } from "react";

function findFlippedCoins(previous: GameSession, current: GameSession): ReadonlySet<string> {
  const flipped = new Set<string>();
  for (const [key, prevCoin] of previous.state.coins) {
    const newCoin = current.state.coins.get(key);
    if (newCoin && newCoin.face !== prevCoin.face) {
      flipped.add(key);
    }
  }
  return flipped;
}

export interface ApplyMoveResult {
  readonly success: boolean;
  readonly flipped: ReadonlySet<string>;
}

export interface UseGameSessionOptions {
  readonly initialSession?: GameSession;
}

export function useGameSession(options?: UseGameSessionOptions) {
  const [session, setSession] = useState<GameSession>(
    () => options?.initialSession ?? createSession(),
  );

  const applyMove = useCallback(
    (move: Move): ApplyMoveResult => {
      const result = step(session, move);
      if (result.kind === "ok") {
        const flipped = findFlippedCoins(session, result.session);
        setSession(result.session);
        return { success: true, flipped };
      }
      return { success: false, flipped: new Set<string>() as ReadonlySet<string> };
    },
    [session],
  );

  const handleReset = useCallback(() => {
    setSession(reset());
  }, []);

  const handleUndo = useCallback(() => {
    if (canUndoFn(session)) {
      setSession(undo(session));
    }
  }, [session]);

  return {
    session,
    applyMove,
    reset: handleReset,
    undo: handleUndo,
    canUndo: canUndoFn(session),
    finalScore: session.isTerminal ? computeFinalScore(session) : null,
  };
}
