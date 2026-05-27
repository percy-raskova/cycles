import { areEdgesEqual, edgeIntersects, isQueenLine, positionBlockedByEdge } from "./geometry";
import type { Coin, CoinFace, Edge, GameState, Player, Position } from "./types";

export const GRID_SIZE = 7;
export const TOTAL_COINS = 12;

export function createInitialState(firstPlayer: Player = "HEADS"): GameState {
  return {
    coins: new Map(),
    edges: [],
    currentPlayer: firstPlayer,
    coinsRemaining: TOTAL_COINS,
    passCount: 0,
    lastAction: null,
  };
}

export function positionKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < GRID_SIZE && pos.col >= 0 && pos.col < GRID_SIZE;
}

export function placeCoin(state: GameState, position: Position, face: CoinFace): GameState {
  if (!Number.isInteger(position.row) || !Number.isInteger(position.col)) {
    throw new Error(`Position must have integer coordinates: (${position.row}, ${position.col})`);
  }

  if (!isValidPosition(position)) {
    throw new Error(`Invalid position: (${position.row}, ${position.col})`);
  }

  const key = positionKey(position);
  if (state.coins.has(key)) {
    throw new Error(`Occupied: ${key}`);
  }

  if (state.coinsRemaining <= 0) {
    throw new Error("No coins remaining");
  }

  if (positionBlockedByEdge(position, state.edges)) {
    throw new Error("Blocked by existing edge");
  }

  const newCoins = new Map(state.coins);
  newCoins.set(key, { position: { ...position }, face });

  return {
    coins: newCoins,
    edges: [...state.edges],
    currentPlayer: state.currentPlayer === "HEADS" ? "TAILS" : "HEADS",
    coinsRemaining: state.coinsRemaining - 1,
    passCount: 0,
    lastAction: "PLACE",
  };
}

export function legalPlacements(state: GameState): readonly Position[] {
  if (state.coinsRemaining <= 0) {
    return [];
  }

  const placements: Position[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row},${col}`;
      if (!state.coins.has(key)) {
        const pos = { row, col };
        if (!positionBlockedByEdge(pos, state.edges)) {
          placements.push(pos);
        }
      }
    }
  }
  return placements;
}

export function legalJoins(state: GameState): readonly [Position, Position][] {
  const coins = Array.from(state.coins.values()).sort((a, b) =>
    positionKey(a.position).localeCompare(positionKey(b.position)),
  );
  const joins: [Position, Position][] = [];

  for (let i = 0; i < coins.length; i++) {
    const coinA = coins[i];
    if (!coinA) continue;
    for (let j = i + 1; j < coins.length; j++) {
      const coinB = coins[j];
      if (!coinB) continue;
      const a = coinA.position;
      const b = coinB.position;
      if (isLegalJoin(state, a, b)) {
        joins.push([a, b]);
      }
    }
  }

  return joins;
}

export function isLegalJoin(state: GameState, a: Position, b: Position): boolean {
  if (a.row === b.row && a.col === b.col) return false;
  if (!isQueenLine(a, b)) return false;

  const aKey = positionKey(a);
  const bKey = positionKey(b);
  if (!state.coins.has(aKey) || !state.coins.has(bKey)) return false;

  if (state.edges.some((e) => areEdgesEqual({ from: a, to: b }, e))) return false;

  if (state.edges.some((e) => edgeIntersects(a, b, e.from, e.to))) return false;

  if (passesThroughCoin(a, b, state.coins)) return false;

  return true;
}

export function canJoin(state: GameState, a: Position, b: Position): boolean {
  return isLegalJoin(state, a, b);
}

export function passesThroughCoin(
  from: Position,
  to: Position,
  coins: ReadonlyMap<string, Coin>,
): boolean {
  const dRow = to.row - from.row;
  const dCol = to.col - from.col;
  const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
  if (steps === 0) return false;

  const stepRow = dRow / steps;
  const stepCol = dCol / steps;

  for (let i = 1; i < steps; i++) {
    const r = from.row + stepRow * i;
    const c = from.col + stepCol * i;
    if (coins.has(`${r},${c}`)) return true;
  }

  return false;
}

export function joinCoins(state: GameState, from: Position, to: Position): GameState {
  if (!isLegalJoin(state, from, to)) {
    throw new Error("Illegal join");
  }

  const newEdge: Edge = { from, to };
  const newEdges = [...state.edges, newEdge];

  const fromKey = positionKey(from);
  const toKey = positionKey(to);
  const newCoins = new Map(state.coins);

  const fromCoin = newCoins.get(fromKey);
  const toCoin = newCoins.get(toKey);

  if (fromCoin) {
    newCoins.set(fromKey, { ...fromCoin, face: flipFace(fromCoin.face) });
  }
  if (toCoin) {
    newCoins.set(toKey, { ...toCoin, face: flipFace(toCoin.face) });
  }

  return {
    coins: newCoins,
    edges: newEdges,
    currentPlayer: state.currentPlayer === "HEADS" ? "TAILS" : "HEADS",
    coinsRemaining: state.coinsRemaining,
    passCount: 0,
    lastAction: "JOIN",
  };
}

function flipFace(face: CoinFace): CoinFace {
  return face === "heads" ? "tails" : "heads";
}
