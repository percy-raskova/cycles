# Data Model: Integration Test Layer

**Feature**: Integration Tests (Sprint 6)
**Date**: 2026-05-22

## Overview

The integration test layer adds test-specific utilities that construct game states and mount the React UI. These utilities are pure functions that leverage the existing engine (`src/core/`) and UI (`src/ui/`) — no new runtime entities are introduced.

## Test Entities

### GameRenderResult

```typescript
interface GameRenderResult {
  readonly user: UserEvent;
  readonly rerender: (session: GameSession) => void;
  // Exposes RTL's render result methods (findByTestId, etc.)
}
```

- Returned by the `renderGame` helper.
- Wraps React Testing Library's `render()` output with game-specific conveniences.
- `user` is a `user-event` instance configured for the rendered component.

### FixtureBuilder

A set of pure functions (not a class) that build `GameState` or `GameSession` instances for common test scenarios:

```typescript
// Returns a GameState with coins arranged in a square cycle (3 edges present)
function makeCycleBoardState(): GameState;

// Returns a GameState where the current player has no legal moves
function makeBlockedBoardState(): GameState;

// Returns a GameState with all 12 coins placed but no edges
function makeFullBoardNoEdgesState(): GameState;

// Returns a GameState with two coins on the same row, ready to join
function makeJoinablePairState(): GameState;
```

- Each function uses `createInitialState`, `placeCoin`, and `joinCoins` from `@core`.
- Returns `GameState` (not `GameSession`) so the test can wrap it in `createSession` if needed, or pass it to `renderGame` which handles the wrapping.

### PositionSelectorMap

A mapping from logical `Position` to DOM query strategies:

```typescript
interface PositionSelectorMap {
  readonly dot: (row: number, col: number) => HTMLElement;
  readonly coin: (row: number, col: number) => HTMLElement;
  readonly edge: (from: Position, to: Position) => HTMLElement;
}
```

- Encapsulates the `data-testid` conventions used by BoardView, CoinView, GridView, and EdgeView.
- Allows tests to reference UI elements by game-logical coordinates rather than DOM implementation details.

## State Transitions (Test Setup Flow)

```
FixtureBuilder function
  → GameState (via engine placeCoin/joinCoins)
  → createSession({ initialState: GameState })
  → renderGame(session)
  → GameRenderResult (mounted GamePage in jsdom)
  → user.click(...) / user.hover(...)
  → DOM assertions
```

## Validation Rules

- Fixtures must use only public engine exports (`placeCoin`, `joinCoins`, `createInitialState`). No internal engine functions.
- `renderGame` must clean up after each test (RTL's `cleanup()` is automatic in Vitest when `globals: true`).
- Selector helpers must fail with a clear message if the expected element is not found.

(End of file - total 66 lines)
