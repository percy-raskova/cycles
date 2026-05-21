# Quickstart: Move Application

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
import { applyMove, createInitialState, legalJoins, legalPlacements } from "@core";

const state = createInitialState(); // HEADS goes first

// Apply a PLACE move
const placeMove = { type: "PLACE" as const, position: { row: 0, col: 0 }, face: "heads" as const };
const s1 = applyMove(state, placeMove);

// Apply another PLACE
const s2 = applyMove(s1, { type: "PLACE", position: { row: 0, col: 3 }, face: "tails" });

// Apply a JOIN move (simple, no cycle)
const joinMove = { type: "JOIN" as const, a: { row: 0, col: 0 }, b: { row: 0, col: 3 } };
const s3 = applyMove(s2, joinMove);
// → s3 has the new edge; both endpoint coins flipped

// Apply a PASS move
const passMove = { type: "PASS" as const };
const s4 = applyMove(s3, passMove);
// → s4.passCount === 1, player switched
```

## Cyclic Join Example

```typescript
import { applyMove, createInitialState } from "@core";

let s = createInitialState();
// Place 5 coins: 4 corners of a rectangle + 1 inside
s = applyMove(s, { type: "PLACE", position: { row: 1, col: 1 }, face: "heads" });
s = applyMove(s, { type: "PLACE", position: { row: 1, col: 4 }, face: "tails" });
s = applyMove(s, { type: "PLACE", position: { row: 4, col: 1 }, face: "heads" });
s = applyMove(s, { type: "PLACE", position: { row: 4, col: 4 }, face: "tails" });
s = applyMove(s, { type: "PLACE", position: { row: 2, col: 2 }, face: "heads" });

// Connect three edges of the rectangle
s = applyMove(s, { type: "JOIN", a: { row: 1, col: 1 }, b: { row: 1, col: 4 } });
s = applyMove(s, { type: "JOIN", a: { row: 1, col: 4 }, b: { row: 4, col: 4 } });
s = applyMove(s, { type: "JOIN", a: { row: 4, col: 4 }, b: { row: 4, col: 1 } });

// Close the rectangle — this creates a cycle
s = applyMove(s, { type: "JOIN", a: { row: 4, col: 1 }, b: { row: 1, col: 1 } });
// → The interior coin at (2,2) has flipped to "tails"
```

## Key Constraints Reminder

- `src/core/` must have **zero React imports**.
- All functions are **pure** — given the same `GameState` and `Move`, they always return the same result.
- `GameState` is **immutable** — mutation requires creating a new state object.
- `applyMove` validates move legality and throws descriptive errors for illegal moves.
- Cyclic JOINs flip all interior coins in addition to the two endpoints.
