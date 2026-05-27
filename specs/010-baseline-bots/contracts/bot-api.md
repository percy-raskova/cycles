# Bot API Contract

**Feature**: Baseline AI Opponents  
**Date**: 2026-05-25

## Contract: BotFunction

### Signature

```typescript
import type { GameState, Move } from "@core";

export type BotFunction = (state: GameState) => Move;
```

### Preconditions (Caller Guarantees)

1. `state` is a valid `GameState` (passes `isValidState(state)`).
2. At least one legal move exists for `state.currentPlayer` (i.e., `hasLegalMoves({ state, ... })` is `true`).
3. The bot is only called when it is the bot's turn (i.e., `state.currentPlayer` matches the bot's assigned player).

### Postconditions (Bot Guarantees)

1. The returned `Move` is a valid, legal move for `state`.
2. `applyMove(state, move)` completes without throwing.
3. The bot completes synchronously and returns within 100ms.
4. The bot does not mutate `state` or any of its nested fields.

### Error Handling

- If preconditions are violated (e.g., no legal moves), the bot MAY throw an `Error`. The caller (simulation harness or UI hook) MUST catch and treat this as a crash for accounting purposes.
- The bot MUST NOT produce an illegal move silently. An illegal move is treated as a contract violation.

### Known Implementations

| Name | Export | Strategy |
|------|--------|----------|
| Random Bot | `randomBot` | Uniform random selection from all legal moves. |
| Greedy Bot | `greedyBot` | Evaluates every legal move via `applyMove` + `scoreForPlayer`, selects move with maximum score delta for `state.currentPlayer`. Tie-breaking is deterministic (first in top-left-to-bottom-right evaluation order). |

### Extension Point

New bot strategies conform to `BotFunction` without any other ceremony:

```typescript
import type { BotFunction } from "@core/bots";

export const myBot: BotFunction = (state) => {
  // ... decision logic ...
  return { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" };
};
```

The simulation harness and UI hook accept any `BotFunction`, so adding a new strategy (e.g., MCTS) requires zero changes to the harness or UI.
