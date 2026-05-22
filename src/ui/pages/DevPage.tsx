import { createInitialState, joinCoins, placeCoin } from "@core";
import type { Coin, Edge, GameState } from "@core/types";
import { BoardView } from "@ui/components/BoardView";
import { useState } from "react";

export function gameStateToJson(state: GameState): string {
  const coinsArray: Array<[string, Coin]> = Array.from(state.coins.entries());
  const plain = {
    coins: coinsArray,
    edges: state.edges as readonly Edge[],
    currentPlayer: state.currentPlayer,
    coinsRemaining: state.coinsRemaining,
    passCount: state.passCount,
    lastAction: state.lastAction,
  };
  return JSON.stringify(plain, null, 2);
}

export function jsonToGameState(json: string): GameState | null {
  try {
    const parsed = JSON.parse(json) as {
      readonly coins: Array<[string, Coin]>;
      readonly edges: readonly Edge[];
      readonly currentPlayer: "HEADS" | "TAILS";
      readonly coinsRemaining: number;
      readonly passCount: number;
      readonly lastAction: "PLACE" | "JOIN" | "PASS" | null;
    };
    return {
      coins: new Map(parsed.coins),
      edges: parsed.edges,
      currentPlayer: parsed.currentPlayer,
      coinsRemaining: parsed.coinsRemaining,
      passCount: parsed.passCount,
      lastAction: parsed.lastAction,
    };
  } catch {
    return null;
  }
}

function makePresetEmpty(): GameState {
  return createInitialState();
}

function makePresetFewCoins(): GameState {
  let state = createInitialState();
  state = placeCoin(state, { row: 0, col: 0 }, "heads");
  state = placeCoin(state, { row: 1, col: 1 }, "tails");
  state = placeCoin(state, { row: 2, col: 2 }, "heads");
  state = placeCoin(state, { row: 3, col: 3 }, "tails");
  return state;
}

function makePresetSmallCycle(): GameState {
  let state = createInitialState();
  state = placeCoin(state, { row: 2, col: 2 }, "heads");
  state = placeCoin(state, { row: 2, col: 4 }, "tails");
  state = placeCoin(state, { row: 4, col: 4 }, "heads");
  state = placeCoin(state, { row: 4, col: 2 }, "tails");
  state = joinCoins(state, { row: 2, col: 2 }, { row: 2, col: 4 });
  state = joinCoins(state, { row: 2, col: 4 }, { row: 4, col: 4 });
  state = joinCoins(state, { row: 4, col: 4 }, { row: 4, col: 2 });
  state = joinCoins(state, { row: 4, col: 2 }, { row: 2, col: 2 });
  return state;
}

function makePresetMaxDensity(): GameState {
  let state = createInitialState();
  let face: "heads" | "tails" = "heads";
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      state = placeCoin(state, { row, col }, face);
      face = face === "heads" ? "tails" : "heads";
    }
  }
  return state;
}

export function DevPage() {
  const emptyState = createInitialState();
  const [input, setInput] = useState(gameStateToJson(emptyState));
  const [state, setState] = useState<GameState>(emptyState);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (value: string) => {
    setInput(value);
    const parsed = jsonToGameState(value);
    if (parsed) {
      setState(parsed);
      setError(null);
    } else {
      setError("Invalid JSON format");
    }
  };

  const applyPreset = (preset: GameState) => {
    const json = gameStateToJson(preset);
    setInput(json);
    setState(preset);
    setError(null);
  };

  return (
    <div className="dev-page">
      <div className="dev-sidebar">
        <h2>GameState JSON</h2>
        <textarea
          className="dev-textarea"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          spellCheck={false}
        />
        {error && <p className="dev-error">{error}</p>}
        <div className="dev-presets">
          <button type="button" onClick={() => applyPreset(makePresetEmpty())}>
            Empty Board
          </button>
          <button type="button" onClick={() => applyPreset(makePresetFewCoins())}>
            Few Coins
          </button>
          <button type="button" onClick={() => applyPreset(makePresetSmallCycle())}>
            Small Cycle
          </button>
          <button type="button" onClick={() => applyPreset(makePresetMaxDensity())}>
            Max Density
          </button>
        </div>
      </div>
      <div className="dev-board">
        <BoardView
          state={state}
          selectedCoin={null}
          hoveredPosition={null}
          previewEdge={null}
          legalPlacements={new Set()}
          flippingCoins={new Set()}
        />
      </div>
    </div>
  );
}
