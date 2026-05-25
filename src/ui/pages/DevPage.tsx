import { createInitialState, deserializeState, joinCoins, placeCoin, serializeState } from "@core";
import type { GameState } from "@core/types";
import { BoardView } from "@ui/components/BoardView";
import { useState } from "react";

/** Pretty-print canonical state JSON for the editable debug textarea. */
function formatState(state: GameState): string {
  return JSON.stringify(JSON.parse(serializeState(state)), null, 2);
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
  const [input, setInput] = useState(formatState(emptyState));
  const [state, setState] = useState<GameState>(emptyState);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (value: string) => {
    setInput(value);
    const parsed = deserializeState(value);
    if (parsed) {
      setState(parsed);
      setError(null);
    } else {
      setError("Invalid JSON format");
    }
  };

  const applyPreset = (preset: GameState) => {
    const json = formatState(preset);
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
          illegalMoveCoin={null}
          highlightedCoins={new Set()}
        />
      </div>
    </div>
  );
}
