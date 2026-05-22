# Research: React Interactivity — Browser Gameplay

**Date**: 2026-05-22
**Feature**: React Interactivity — Browser Gameplay (Sprint 5)

## Unknowns Resolved

### 1. Move Construction State Machine

**Decision**: Local `useState` enum in `GamePage` (IDLE | SELECTING_FACE | SELECTING_SECOND_COIN)

**Rationale**:
- The state machine has only 3 states and lives entirely within one page component. A global store (Redux, Zustand, Jotai) or context provider is massive overkill.
- `useState` is sufficient because the state is ephemeral (does not survive re-renders of the parent, which is fine — it's UI chrome, not game state).
- No external library needed.

**Alternatives considered**:
- XState: Excellent for complex state machines, but 3 states do not justify the dependency.
- useReducer: Possible, but a single `useState<MovePhase>` with switch-case handlers is simpler and clearer.

### 2. Animation Strategy for Coin Flips

**Decision**: CSS `transition` on SVG `fill` and `stroke` attributes

**Rationale**:
- The spec mandates CSS transitions only (no animation libraries).
- SVG attributes `fill` and `stroke` are animatable via CSS when the element is targeted by a class change.
- A 500ms `transition: fill 500ms ease, stroke 500ms ease` on coin circles provides clear visual feedback without complex keyframe choreography.
- The `isFlipping` prop on `CoinView` adds/removes a CSS class that triggers the transition.

**Alternatives considered**:
- CSS `@keyframes` flip animation: More dramatic but harder to coordinate with React state. Transitions are simpler for a single-attribute change.
- SVG `<animate>`: Native SVG animation, but less flexible with React's render cycle.

### 3. How to Detect Coins That Flipped

**Decision**: Compare `previousSession.state.coins` with `currentSession.state.coins` after `step`

**Rationale**:
- `applyMove` (the engine) returns a new `GameState`. Coins that flipped will have a different `face` value at the same `position`.
- The UI can diff the two `ReadonlyMap<string, Coin>` instances to find positions where `face` changed.
- This diff is computed once per move, not per render, so performance is trivial.
- No engine changes needed — the UI derives the information from state comparison.

**Alternatives considered**:
- Engine returning flip list: Would require modifying `applyMove` return type. Rejected to keep engine pure and unchanged.
- `GameSession` tracking flips: Would add UI concern to core. Rejected.

### 4. How to Handle Auto-Pass in the Browser

**Decision**: `useEffect` on `GamePage` watches `session`; when `!hasLegalMoves(session) && !session.isTerminal`, it calls `step(session, PASS)` after a brief delay (e.g., 1s) with a visible notice.

**Rationale**:
- The engine's `step` already auto-converts any move to a forced pass when no legal moves exist (Sprint 3 behavior).
- A `useEffect` hook is the idiomatic React way to react to state changes and trigger side effects.
- The 1s delay gives the player time to read the "no legal moves" notice before the pass is applied.
- No polling or intervals needed — React's render cycle drives the check.

**Alternatives considered**:
- setTimeout inside click handler: Brittle — if the player makes the last legal move, the auto-pass should happen on the next render, not inside a click handler.
- Manual "Pass" button: Rejected in clarification phase; auto-pass aligns with CLI behavior.

### 5. How to Highlight Legal Placements on Hover

**Decision**: `GamePage` pre-computes `legalPlacements(session.state)` on each render and passes a `Set<string>` of position keys to `GridView`.

**Rationale**:
- `legalPlacements` (from `src/core/state.ts`) returns an array of `Position` objects. Converting to a `Set<string>` (using `positionKey`) makes O(1) lookup in `GridView`.
- Pre-computing in `GamePage` keeps `GridView` presentational — it just receives a set of highlighted positions.
- The computation is cheap (max 49 positions).

**Alternatives considered**:
- `GridView` calling `legalPlacements` directly: Would couple the presentational component to engine logic. Rejected.
- Memoization with `useMemo`: Possible optimization, but `legalPlacements` is fast enough that premature optimization is unnecessary.
