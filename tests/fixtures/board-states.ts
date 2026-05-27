import { createInitialState, placeCoin } from "@core";
import { joinCoins } from "@core/state";
import type { CoinFace, GameState, Player } from "@core/types";

export function makeInitialState(firstPlayer?: Player): GameState {
  return createInitialState(firstPlayer);
}

export function makeCycleBoardState(): GameState {
  let state = createInitialState("HEADS");
  state = placeCoin(state, { row: 2, col: 2 }, "heads");
  state = placeCoin(state, { row: 2, col: 4 }, "tails");
  state = placeCoin(state, { row: 4, col: 4 }, "heads");
  state = placeCoin(state, { row: 4, col: 2 }, "tails");
  state = placeCoin(state, { row: 3, col: 3 }, "heads");
  state = joinCoins(state, { row: 2, col: 2 }, { row: 2, col: 4 });
  state = joinCoins(state, { row: 2, col: 4 }, { row: 4, col: 4 });
  state = joinCoins(state, { row: 4, col: 4 }, { row: 4, col: 2 });
  return state;
}

export function makeBlockedBoardState(): GameState {
  let state = createInitialState("HEADS");
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const face: CoinFace = (row + col) % 2 === 0 ? "heads" : "tails";
      state = placeCoin(state, { row, col }, face);
    }
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      state = joinCoins(state, { row, col }, { row, col: col + 1 });
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      state = joinCoins(state, { row, col }, { row: row + 1, col });
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      state = joinCoins(state, { row, col }, { row: row + 1, col: col + 1 });
    }
  }
  return state;
}

export function makeOneLegalMoveState(): GameState {
  const blocked = makeBlockedBoardState();
  const edges = blocked.edges.filter(
    (e) => !(e.from.row === 0 && e.from.col === 0 && e.to.row === 0 && e.to.col === 1),
  );
  return { ...blocked, edges };
}

export function makeFullBoardNoEdgesState(): GameState {
  let state = createInitialState("HEADS");
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (state.coinsRemaining <= 0) break;
      const face: CoinFace = (row + col) % 2 === 0 ? "heads" : "tails";
      state = placeCoin(state, { row, col }, face);
    }
  }
  return state;
}

export function makeJoinablePairState(): GameState {
  let state = createInitialState("HEADS");
  state = placeCoin(state, { row: 0, col: 0 }, "heads");
  state = placeCoin(state, { row: 0, col: 2 }, "tails");
  return state;
}
