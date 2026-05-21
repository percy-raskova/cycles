# Quickstart: Core Engine

## Running Tests

```bash
# Example-based tests (fast feedback)
bun run test

# Property-based tests (part of the same suite)
bun run test:run

# Coverage report (90% threshold enforced on src/core/)
bun run test:run -- --coverage
```

## Using the API

```typescript
import { createInitialState, legalPlacements, legalJoins } from "@core";

const state = createInitialState(); // HEADS goes first

// Where can I place a coin?
const placements = legalPlacements(state);
// → 49 positions on an empty board

// Place two coins
const s1 = placeCoin(state, { row: 0, col: 0 }, "heads");
const s2 = placeCoin(s1, { row: 0, col: 3 }, "tails");

// What joins are legal?
const joins = legalJoins(s2);
// → [[{row:0,col:0}, {row:0,col:3}]]  (same row, no blocking coin)
```

## Property Test Example

```typescript
import fc from "fast-check";
import { createInitialState, legalPlacements, placeCoin } from "@core";

// Every placement returned by legalPlacements is actually empty
fc.assert(
  fc.property(
    fc.array(fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 })), { maxLength: 12 }),
    (positions) => {
      let game = createInitialState();
      for (const [row, col] of positions) {
        if (game.coinsRemaining <= 0) break;
        const key = `${row},${col}`;
        if (game.coins.has(key)) continue;
        game = placeCoin(game, { row, col }, "heads");
      }
      const placements = legalPlacements(game);
      return placements.every((p) => !game.coins.has(`${p.row},${p.col}`));
    },
  ),
);
```

## Key Constraints Reminder

- `src/core/` must have **zero React imports**.
- All functions are **pure** — given the same `GameState`, they always return the same result.
- `GameState` is **immutable** — mutation requires creating a new state object.
