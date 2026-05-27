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

function isPlainState(value: unknown): value is PlainState {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.coins)) return false;
  if (!Array.isArray(obj.edges)) return false;
  if (typeof obj.currentPlayer !== "string") return false;
  if (typeof obj.coinsRemaining !== "number") return false;
  if (typeof obj.passCount !== "number") return false;
  if (obj.lastAction !== null && typeof obj.lastAction !== "string") return false;
  return true;
}

function isPlainSession(value: unknown): value is PlainSession {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!isPlainState(obj.state)) return false;
  if (!Array.isArray(obj.history)) return false;
  if (typeof obj.isTerminal !== "boolean") return false;
  if (obj.winner !== null && typeof obj.winner !== "string") return false;
  return true;
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
    edges: plain.edges.map((e) => ({ from: { ...e.from }, to: { ...e.to } })),
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
    const parsed = JSON.parse(json) as unknown;
    if (!isPlainState(parsed)) return null;
    return fromPlainState(parsed);
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
    const parsed = JSON.parse(json) as unknown;
    if (!isPlainSession(parsed)) return null;
    return {
      state: fromPlainState(parsed.state),
      history: parsed.history,
      isTerminal: parsed.isTerminal,
      winner: parsed.winner,
    };
  } catch {
    return null;
  }
}
