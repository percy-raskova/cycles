import { createInitialState, placeCoin } from "./board";
import { areEdgesEqual, edgeIntersects, isQueenLine } from "./geometry";
import type { CoinFace, Edge, GameState, Position } from "./types";

export { createInitialState, placeCoin };

export function canJoin(state: GameState, from: Position, to: Position): boolean {
  if (from.row === to.row && from.col === to.col) return false;
  if (!isQueenLine(from, to)) return false;

  const fromKey = `${from.row},${from.col}`;
  const toKey = `${to.row},${to.col}`;
  if (!state.coins.has(fromKey) || !state.coins.has(toKey)) return false;

  if (state.edges.some((e) => areEdgesEqual({ from, to }, e))) return false;

  if (state.edges.some((e) => edgeIntersects(from, to, e.from, e.to))) return false;

  if (passesThroughCoin(from, to, state.coins)) return false;

  return true;
}

function passesThroughCoin(
  from: Position,
  to: Position,
  coins: ReadonlyMap<string, unknown>,
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
  if (!canJoin(state, from, to)) {
    throw new Error("Illegal join");
  }

  const newEdge: Edge = { from, to };
  const newEdges = [...state.edges, newEdge];

  // TODO: detect cycles and flip enclosed region coins
  // For now, flip only the two endpoint coins
  const fromKey = `${from.row},${from.col}`;
  const toKey = `${to.row},${to.col}`;
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
    lastAction: "JOIN",
  };
}

function flipFace(face: CoinFace): CoinFace {
  return face === "heads" ? "tails" : "heads";
}
