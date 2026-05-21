import type { Coin, CoinFace, GameState, Player, Position } from "./types";

export const GRID_SIZE = 7;
export const TOTAL_COINS = 12;

export function createInitialState(firstPlayer: Player = "HEADS"): GameState {
  return {
    coins: new Map(),
    edges: [],
    currentPlayer: firstPlayer,
    coinsRemaining: TOTAL_COINS,
    lastAction: null,
  };
}

function positionKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < GRID_SIZE && pos.col >= 0 && pos.col < GRID_SIZE;
}

export function placeCoin(state: GameState, position: Position, face: CoinFace): GameState {
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

  const newCoins = new Map(state.coins);
  newCoins.set(key, { position, face });

  return {
    coins: newCoins,
    edges: state.edges,
    currentPlayer: state.currentPlayer === "HEADS" ? "TAILS" : "HEADS",
    coinsRemaining: state.coinsRemaining - 1,
    lastAction: "PLACE",
  };
}
