# Quickstart: Baseline Bots

**Feature**: Baseline AI Opponents  
**Date**: 2026-05-25

## Running Bot Simulations

### From Tests (Recommended)

The 1000-game regression is a core behavior test:

```bash
bun run test:run -- src/core/__tests__/bots/simulation.test.ts
```

To run a smaller sample during development:

```typescript
import { randomBot, greedyBot, runSimulation } from "@core/bots";

const result = runSimulation({
  botA: greedyBot,
  botB: randomBot,
  games: 100,
  alternateStarts: true,
});

console.log(result);
// { winsA: 67, winsB: 28, draws: 5, crashes: 0, totalGames: 100 }
```

### From the Browser (Future)

A "Bot Arena" page may be added later that runs simulations in a Web Worker and renders a live win-rate chart. No infrastructure changes are needed — `runSimulation` is pure and safe to call from a worker.

## Adding a New Bot Strategy

1. Create a new file in `src/core/bots/` (e.g., `mcts.ts`).
2. Import the `BotFunction` type:
   ```typescript
   import type { BotFunction } from "./index";
   ```
3. Export your bot:
   ```typescript
   export const mctsBot: BotFunction = (state) => {
     // ... search logic ...
     return move;
   };
   ```
4. Re-export from `src/core/bots/index.ts`.
5. Add unit tests in `src/core/__tests__/bots/`.
6. Register the strategy label in the UI's setup screen if it should be player-selectable.

**Constraints**:
- Bot MUST be pure (no side effects, no React imports).
- Bot MUST return within 100ms on standard hardware.
- Bot MUST only use existing engine functions (`legalPlacements`, `legalJoins`, `applyMove`, `scoreForPlayer`, etc.).

## Debugging Bot Decisions

Both bots are deterministic given the same `GameState`, so reproducing a specific decision is trivial:

```typescript
import { greedyBot } from "@core/bots";
import { createInitialState } from "@core";

const state = createInitialState("HEADS");
// ... apply some moves ...

const move = greedyBot(state);
console.log(move);
```

For Random bot, inject a seeded PRNG if you need reproducibility in tests:

```typescript
// Not yet implemented — if needed, extend randomBot to accept an optional rng
```

## Bot Performance Benchmarking

Use the built-in simulation harness to benchmark:

```typescript
import { performance } from "node:perf_hooks"; // or Date.now() in browser

const start = performance.now();
runSimulation({ botA: greedyBot, botB: randomBot, games: 1000, alternateStarts: true });
const elapsed = performance.now() - start;
console.log(`1000 games in ${elapsed.toFixed(0)}ms`);
// Target: < 60,000ms (60s)
```
