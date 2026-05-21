import { pointInPolygon } from "./geometry";
import {
  GRID_SIZE,
  createInitialState,
  isLegalJoin,
  joinCoins,
  placeCoin,
  positionKey,
} from "./state";
import type { Coin, CoinFace, Edge, GameState, Move, Position } from "./types";

export { createInitialState };

function buildAdjacencyList(edges: readonly Edge[]): Map<string, Position[]> {
  const adj = new Map<string, Position[]>();

  for (const edge of edges) {
    const fromKey = positionKey(edge.from);
    const toKey = positionKey(edge.to);

    if (!adj.has(fromKey)) adj.set(fromKey, []);
    if (!adj.has(toKey)) adj.set(toKey, []);

    adj.get(fromKey)?.push(edge.to);
    adj.get(toKey)?.push(edge.from);
  }

  return adj;
}

export function findCycle(state: GameState, a: Position, b: Position): Position[] | null {
  const adj = buildAdjacencyList(state.edges);
  const aKey = positionKey(a);
  const bKey = positionKey(b);

  // BFS to find shortest path from b to a in the existing graph
  const queue: { position: Position; path: Position[] }[] = [{ position: b, path: [b] }];
  const visited = new Set<string>();
  visited.add(bKey);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const currentKey = positionKey(current.position);
    if (currentKey === aKey) {
      return [a, ...current.path];
    }

    const neighbors = adj.get(currentKey) || [];
    for (const neighbor of neighbors) {
      const neighborKey = positionKey(neighbor);
      if (!visited.has(neighborKey)) {
        visited.add(neighborKey);
        queue.push({ position: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  return null;
}

export function coinsInsideCycle(
  state: GameState,
  cyclePath: readonly Position[],
): readonly Position[] {
  const boundarySet = new Set(cyclePath.map((p) => `${p.row},${p.col}`));
  const interior: Position[] = [];

  for (const coin of state.coins.values()) {
    const key = `${coin.position.row},${coin.position.col}`;
    if (boundarySet.has(key)) continue;
    if (pointInPolygon(coin.position, cyclePath)) {
      interior.push(coin.position);
    }
  }

  return interior;
}

function flipFace(face: CoinFace): CoinFace {
  return face === "heads" ? "tails" : "heads";
}

function applyJoin(state: GameState, move: Move & { type: "JOIN" }): GameState {
  if (!isLegalJoin(state, move.a, move.b)) {
    throw new Error("Illegal join");
  }

  const newEdge: Edge = { from: move.a, to: move.b };
  const newEdges = [...state.edges, newEdge];

  const aKey = positionKey(move.a);
  const bKey = positionKey(move.b);
  const newCoins = new Map(state.coins);

  const cycle = findCycle(state, move.a, move.b);

  flipCoin(newCoins, aKey);
  flipCoin(newCoins, bKey);

  if (cycle) {
    flipInteriorCoins(newCoins, { ...state, edges: newEdges, coins: newCoins }, cycle);
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

function flipCoin(coins: Map<string, Coin>, key: string): void {
  const coin = coins.get(key);
  if (coin) {
    coins.set(key, { ...coin, face: flipFace(coin.face) });
  }
}

function flipInteriorCoins(
  coins: Map<string, Coin>,
  state: GameState,
  cycle: readonly Position[],
): void {
  const interior = coinsInsideCycle(state, cycle);
  for (const pos of interior) {
    flipCoin(coins, positionKey(pos));
  }
}

function applyPass(state: GameState): GameState {
  return {
    ...state,
    currentPlayer: state.currentPlayer === "HEADS" ? "TAILS" : "HEADS",
    passCount: state.passCount + 1,
    lastAction: "PASS",
  };
}

export function applyMove(state: GameState, move: Move): GameState {
  switch (move.type) {
    case "PLACE":
      return placeCoin(state, move.position, move.face);
    case "JOIN":
      return applyJoin(state, move);
    case "PASS":
      return applyPass(state);
  }
}

export function isValidState(state: GameState): boolean {
  // Coin count invariant
  if (state.coins.size + state.coinsRemaining !== 12) return false;

  // All coin positions within bounds
  for (const coin of state.coins.values()) {
    if (coin.position.row < 0 || coin.position.row >= GRID_SIZE) return false;
    if (coin.position.col < 0 || coin.position.col >= GRID_SIZE) return false;
  }

  // All edges reference existing coins
  for (const edge of state.edges) {
    if (!state.coins.has(positionKey(edge.from))) return false;
    if (!state.coins.has(positionKey(edge.to))) return false;
  }

  // passCount within expected range
  if (state.passCount < 0 || state.passCount > 2) return false;

  return true;
}
