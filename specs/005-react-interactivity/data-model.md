# Data Model: Interactive Game Layer

**Feature**: React Interactivity — Browser Gameplay (Sprint 5)
**Date**: 2026-05-22

## Overview

The interactive layer adds UI-specific state on top of the existing `GameSession` from Sprint 3. The game state (coins, edges, player, etc.) remains canonical in `GameSession`. The UI layer tracks ephemeral interaction state (move construction phase, hovered position, selected coin, flipping coins).

## UI State Entities

### MovePhase

```typescript
type MovePhase =
  | { readonly kind: "IDLE" }
  | { readonly kind: "SELECTING_FACE"; readonly position: Position }
  | { readonly kind: "SELECTING_SECOND_COIN"; readonly first: Position };
```

- **IDLE**: No move in progress. Player can click an empty intersection to start PLACE, or a coin to start JOIN.
- **SELECTING_FACE**: Player clicked an empty intersection. A face selector is shown. Selecting a face constructs a `PlaceMove`.
- **SELECTING_SECOND_COIN**: Player clicked a coin as the start of a JOIN. Clicking a second coin constructs a `JoinMove`.

### HoverState

```typescript
interface HoverState {
  readonly position: Position | null;
  readonly isLegalPlacement: boolean;
  readonly isLegalJoinTarget: boolean;
}
```

- Tracks the currently hovered grid intersection and whether it is a legal target for the current move phase.

### FlipState

```typescript
interface FlipState {
  readonly positions: ReadonlySet<string>; // position keys of coins currently animating
  readonly isAnimating: boolean;
}
```

- Derived by diffing `previousSession.state.coins` with `currentSession.state.coins` after a successful `step`.
- Coins whose `face` changed are added to `positions`.
- `isAnimating` is true while any flip is in progress; it blocks new move input.

## State Transitions

```
IDLE
├── click empty intersection → SELECTING_FACE(position)
│   └── select face → PlaceMove → step → IDLE (or terminal)
│   └── click elsewhere / Escape → IDLE
└── click coin → SELECTING_SECOND_COIN(coin)
    ├── click second coin → JoinMove → step → IDLE (or terminal)
    ├── click same coin / Escape → IDLE
    └── click empty intersection → IDLE (cancel)

Auto-pass (useEffect side effect):
  !hasLegalMoves(session) && !session.isTerminal
  → show notice → delay 1s → step(session, PASS) → new session

Terminal:
  session.isTerminal === true
  → disable all input → show GameOverPanel
```

## Validation Rules

- `GameSession` is immutable. Every `step` produces a new session.
- The UI never modifies `GameSession.state` directly.
- Illegal moves are caught by `step`'s error result and shown as visual feedback without mutating session.
- `FlipState` is derived, not stored in `GameSession`.
