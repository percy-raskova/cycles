import { pointInPolygon, pointOnSegment } from "./geometry";
import {
  createInitialState,
  GRID_SIZE,
  isLegalJoin,
  placeCoin,
  positionKey,
  TOTAL_COINS,
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
  const region: Position[] = [];

  for (const coin of state.coins.values()) {
    const pos = coin.position;
    if (pointInPolygon(pos, cyclePath) || pointOnCycleBoundary(pos, cyclePath)) {
      region.push(pos);
    }
  }

  return region;
}

function pointOnCycleBoundary(point: Position, cyclePath: readonly Position[]): boolean {
  for (let i = 0, j = cyclePath.length - 1; i < cyclePath.length; j = i++) {
    const pi = cyclePath[i];
    const pj = cyclePath[j];
    if (!pi || !pj) continue;
    if (pointOnSegment(point, pi, pj)) return true;
  }
  return false;
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

  if (cycle) {
    // Cycle closure: flip every coin in the enclosed region (boundary + interior)
    flipInteriorCoins(newCoins, { ...state, edges: newEdges, coins: newCoins }, cycle);
  } else {
    // No cycle: flip only the two endpoints
    flipCoin(newCoins, aKey);
    flipCoin(newCoins, bKey);
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
    coins: new Map(state.coins),
    edges: [...state.edges],
    currentPlayer: state.currentPlayer === "HEADS" ? "TAILS" : "HEADS",
    coinsRemaining: state.coinsRemaining,
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
  if (state.coins.size + state.coinsRemaining !== TOTAL_COINS) return false;

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
