import { applyMove } from "./move";
import { createInitialState, legalJoins, legalPlacements } from "./state";
import type { GameState, Move, PassMove, Player } from "./types";

export interface GameSession {
  readonly state: GameState;
  readonly history: readonly Move[];
  readonly isTerminal: boolean;
  readonly winner: Player | "draw" | null;
}

export interface FinalScore {
  readonly heads: number;
  readonly tails: number;
  readonly winner: Player | "draw";
}

export type StepResult =
  | { readonly kind: "ok"; readonly session: GameSession }
  | { readonly kind: "error"; readonly error: string };

export interface CreateSessionOptions {
  readonly firstPlayer?: Player;
  readonly rng?: () => number;
}

export function createSession(options?: CreateSessionOptions): GameSession {
  const rng = options?.rng ?? Math.random;
  const firstPlayer = options?.firstPlayer ?? (rng() < 0.5 ? "HEADS" : "TAILS");

  return {
    state: createInitialState(firstPlayer),
    history: [],
    isTerminal: false,
    winner: null,
  };
}

export function hasLegalMoves(session: GameSession): boolean {
  return legalPlacements(session.state).length > 0 || legalJoins(session.state).length > 0;
}

export function computeFinalScore(session: GameSession): FinalScore {
  let heads = 0;
  let tails = 0;

  for (const coin of session.state.coins.values()) {
    if (coin.face === "heads") {
      heads++;
    } else {
      tails++;
    }
  }

  const winner: Player | "draw" = heads > tails ? "HEADS" : tails > heads ? "TAILS" : "draw";

  return { heads, tails, winner };
}

export function step(session: GameSession, move: Move): StepResult {
  if (session.isTerminal) {
    return { kind: "error", error: "Game is already over" };
  }

  // Forced pass: no legal moves available
  if (!hasLegalMoves(session)) {
    return applyPass(session);
  }

  // Voluntary pass when legal moves exist is illegal
  if (move.type === "PASS") {
    return { kind: "error", error: "Cannot pass when legal moves exist" };
  }

  try {
    const newState = applyMove(session.state, move);
    const newSession = buildSession(session, move, newState);
    return checkTerminal(newSession);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: "error", error: message };
  }
}

export function getTurnPrompt(session: GameSession): string {
  return `${session.state.currentPlayer} to move — ${session.state.coinsRemaining} coins remain`;
}

function applyPass(session: GameSession): StepResult {
  const passMove: PassMove = { type: "PASS" };

  try {
    const newState = applyMove(session.state, passMove);
    const newSession = buildSession(session, passMove, newState);
    return checkTerminal(newSession);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: "error", error: message };
  }
}

function buildSession(previous: GameSession, move: Move, newState: GameState): GameSession {
  return {
    state: newState,
    history: [...previous.history, move],
    isTerminal: false,
    winner: null,
  };
}

function checkTerminal(session: GameSession): StepResult {
  if (session.state.passCount >= 2) {
    const score = computeFinalScore(session);
    return {
      kind: "ok",
      session: {
        ...session,
        isTerminal: true,
        winner: score.winner,
      },
    };
  }

  return { kind: "ok", session };
}
