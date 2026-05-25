import type { GameSession } from "./session";
import type { Action, Coin, Edge, GameState, Move, Player } from "./types";

/**
 * JSON (de)serialization for engine state.
 *
 * `GameState.coins` is a Map, which JSON cannot represent directly, so it is
 * encoded as an array of `[key, Coin]` entries and rebuilt with `new Map(...)`.
 * This is the boundary a persistence layer (e.g. a Durable Object backed by D1)
 * plugs into. Deserializers return `null` on malformed JSON rather than throwing.
 */

interface PlainState {
  readonly coins: ReadonlyArray<readonly [string, Coin]>;
  readonly edges: readonly Edge[];
  readonly currentPlayer: Player;
  readonly coinsRemaining: number;
  readonly passCount: number;
  readonly lastAction: Action | null;
}

interface PlainSession {
  readonly state: PlainState;
  readonly history: readonly Move[];
  readonly isTerminal: boolean;
  readonly winner: Player | "draw" | null;
}

function toPlainState(state: GameState): PlainState {
  return {
    coins: Array.from(state.coins.entries()),
    edges: state.edges,
    currentPlayer: state.currentPlayer,
    coinsRemaining: state.coinsRemaining,
    passCount: state.passCount,
    lastAction: state.lastAction,
  };
}

function fromPlainState(plain: PlainState): GameState {
  return {
    coins: new Map<string, Coin>(plain.coins.map(([key, coin]) => [key, { ...coin }])),
    edges: plain.edges,
    currentPlayer: plain.currentPlayer,
    coinsRemaining: plain.coinsRemaining,
    passCount: plain.passCount,
    lastAction: plain.lastAction,
  };
}

export function serializeState(state: GameState): string {
  return JSON.stringify(toPlainState(state));
}

export function deserializeState(json: string): GameState | null {
  try {
    return fromPlainState(JSON.parse(json) as PlainState);
  } catch {
    return null;
  }
}

export function serializeSession(session: GameSession): string {
  const plain: PlainSession = {
    state: toPlainState(session.state),
    history: session.history,
    isTerminal: session.isTerminal,
    winner: session.winner,
  };
  return JSON.stringify(plain);
}

export function deserializeSession(json: string): GameSession | null {
  try {
    const plain = JSON.parse(json) as PlainSession;
    return {
      state: fromPlainState(plain.state),
      history: plain.history,
      isTerminal: plain.isTerminal,
      winner: plain.winner,
    };
  } catch {
    return null;
  }
}
