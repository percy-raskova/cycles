# Test Contracts: CYCLES Edge-Case Testing

**Date**: 2026-05-22  
**Feature**: Comprehensive E2E Edge-Case Testing  
**Plan**: [plan.md](plan.md)

## Engine Invariant Contracts

These contracts must hold after every legal move in every game state.

### C-001: Coin Count Invariant
```
Given: Any GameState
Assert: state.coins.size + state.coinsRemaining === 12
```

### C-002: Bounds Invariant
```
Given: Any GameState
Assert: For every coin in state.coins, 0 ≤ coin.position.row < 7 and 0 ≤ coin.position.col < 7
```

### C-003: Edge Coin Existence
```
Given: Any GameState
Assert: For every edge in state.edges, state.coins has a coin at edge.from AND at edge.to
```

### C-004: No Duplicate Edges
```
Given: Any GameState
Assert: For every pair of distinct edges e1, e2, e1 is not equal to e2 (undirected)
```

### C-005: No Crossing Edges
```
Given: Any GameState
Assert: For every pair of distinct edges e1, e2 that do not share an endpoint, edgeIntersects(e1.from, e1.to, e2.from, e2.to) === false
```

### C-006: No Through-Coin Edges
```
Given: Any GameState
Assert: For every edge e, passesThroughCoin(e.from, e.to, state.coins) === false
```

### C-007: No Placement Along Edge (FR-013)
```
Given: Any GameState and any empty position p
Assert: If p lies on the line segment of any existing edge, then p is NOT in legalPlacements(state)
```

### C-008: Legal Joins are Actually Legal
```
Given: Any GameState
Assert: For every [a, b] in legalJoins(state), isLegalJoin(state, a, b) === true
```

### C-009: Valid State After Move
```
Given: Any GameState and any legal Move
Assert: isValidState(applyMove(state, move)) === true
```

## UI Interaction Contracts

These contracts define what the user can and cannot do in each UI phase.

### UI-001: IDLE Phase
```
Given: GamePage in IDLE phase, game is not terminal, not animating
Allowed:
  - Click empty intersection → opens FaceSelector
  - Click coin → enters SELECTING_SECOND_COIN phase
Forbidden:
  - Click occupied intersection (no effect)
```

### UI-002: SELECTING_FACE Phase
```
Given: GamePage in SELECTING_FACE phase
Allowed:
  - Click H or T → places coin, returns to IDLE
  - Press Escape → cancels, returns to IDLE
Forbidden:
  - Click board (ignored while selector is open)
```

### UI-003: SELECTING_SECOND_COIN Phase
```
Given: GamePage in SELECTING_SECOND_COIN phase
Allowed:
  - Click highlighted coin → attempts JOIN, returns to IDLE on success
  - Click selected coin again → cancels, returns to IDLE
  - Press Escape → cancels, returns to IDLE
Forbidden:
  - Click non-highlighted coin → ignored (or illegal feedback)
  - Click empty intersection → ignored
```

### UI-004: Animation Blocking
```
Given: GamePage during 500ms flip animation
Assert: All clicks are ignored; no phase transitions occur
```

### UI-005: Terminal State
```
Given: GamePage when session.isTerminal === true
Assert: Board is non-interactive; GameOverPanel is visible; New Game button resets state
```

### UI-006: Auto-Pass Notice
```
Given: GamePage when current player has no legal moves
Assert: TurnIndicator displays notice; after 1s delay, PASS is applied automatically
```

## Playwright Page Object Contracts

These contracts define how E2E tests interact with the DOM.

### E2E-001: Place a Coin
```
Action:
  1. Navigate to game URL
  2. Click an empty intersection dot (role="button")
  3. Click H or T in the FaceSelector
Expected:
  - A coin appears at the clicked position with the chosen face label
  - TurnIndicator updates to show next player
  - Coins remaining count decreases by 1
```

### E2E-002: Join Two Coins
```
Action:
  1. Place two coins on a queen-line
  2. Click first coin
  3. Click second coin (highlighted)
Expected:
  - A line (edge) appears between the two coins
  - Both coins flip faces
  - TurnIndicator updates to show next player
```

### E2E-003: Close a Cycle
```
Action:
  1. Create a partial cycle (3 edges of a square)
  2. Click the coin that completes the cycle
  3. Click the connecting coin
Expected:
  - 4th edge appears
  - All boundary coins and interior coins flip
  - Flip animation class is applied for 500ms
```

### E2E-004: Auto-Pass
```
Action:
  1. Reach a state with no legal moves for current player
  2. Wait for notice
Expected:
  - Notice text appears in TurnIndicator
  - After ~1s, turn switches automatically
  - No user action required
```

### E2E-005: Game Over
```
Action:
  1. Reach a terminal state (both players pass)
  2. Observe GameOverPanel
  3. Click "New Game"
Expected:
  - GameOverPanel shows correct scores and winner
  - Board resets to empty
  - TurnIndicator shows HEADS to move
```
