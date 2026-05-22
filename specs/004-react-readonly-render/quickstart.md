# Quickstart: React Read-Only SVG Renderer

**Feature**: React Read-Only SVG Renderer (Sprint 4)

## Run the Dev Page

```bash
bun run dev
```

Navigate to `http://localhost:5173` (or whatever port Vite reports). The dev page loads by default, showing an empty board.

## Paste a GameState

1. Open any existing test file (e.g., `src/core/__tests__/state.test.ts`) and copy a `GameState` object.
2. Paste the JSON into the textarea on the left side of the dev page.
3. The board on the right updates immediately to match the pasted state.

### Expected JSON Format

```json
{
  "coins": [
    ["0,0", { "position": { "row": 0, "col": 0 }, "face": "heads" }],
    ["1,1", { "position": { "row": 1, "col": 1 }, "face": "tails" }]
  ],
  "edges": [
    { "from": { "row": 0, "col": 0 }, "to": { "row": 1, "col": 1 } }
  ],
  "currentPlayer": "HEADS",
  "coinsRemaining": 47,
  "passCount": 0,
  "lastAction": null
}
```

Note: The `coins` field uses a serialized Map format (array of `[key, value]` pairs) because `Map` does not JSON.stringify natively.

## Use the Renderer in Your Own Component

```tsx
import { BoardView } from "@/ui/components/BoardView";
import type { GameState } from "@core/types";

function MyComponent({ state }: { state: GameState }) {
  return <BoardView state={state} />;
}
```

No additional setup, providers, or context required. The renderer is pure and stateless.

## Verify Rendering Correctness

1. **Structural**: Run `bun run test` — component tests verify coin count, edge count, label accuracy, and reactive updates.
2. **Visual**: Use the dev page to paste states from `src/core/__tests__/` and confirm the output matches expectations.
3. **Performance**: The dev page includes a "max density" button that fills the board with 49 coins and all edges; render time is logged to the console.
