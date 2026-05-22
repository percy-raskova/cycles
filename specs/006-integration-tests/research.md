# Research: Integration Tests

**Date**: 2026-05-22
**Feature**: Integration Tests (Sprint 6)

## Unknowns Resolved

### 1. Timer Testing Strategy

**Decision**: Fake timers (`vi.useFakeTimers()`) for all timer-dependent tests

**Rationale**:
- The spec targets <30s total execution. Real 500ms + 1000ms delays would add ~1.5s per timer test. With 6+ timer tests, we'd exceed the budget.
- Vitest's `vi.useFakeTimers()` works seamlessly with React Testing Library's `act()` and `waitFor()` when timers are advanced with `vi.runAllTimers()`.
- Fake timers are deterministic — no flakiness from system load or CI runner speed.
- The actual CSS transition duration (500ms) is a visual concern, not a functional one. Functional correctness (input blocked during animation, flip state cleared after delay) is what we test.

**Alternatives considered**:
- Real timers: Rejected — too slow, introduces flakiness.
- Hybrid (one smoke test with real timers): Rejected — adds complexity for marginal value. E2E (future) will cover real timing.

### 2. How to Mount GamePage with a Pre-Built Session

**Decision**: Create a `renderGame` helper that accepts an optional `initialSession` and renders `<GamePage initialSession={...} />` via a thin wrapper

**Rationale**:
- GamePage currently calls `useState(() => createSession())`. To inject a pre-built session, we need either:
  - (a) Add an `initialSession` prop to GamePage (minor change, test-only concern)
  - (b) Re-export GamePage internals and mount them directly (leaks internals)
  - (c) Use React context or a factory prop (overkill for this)
- Option (a) is the cleanest: add an optional `initialSession?: GameSession` prop to GamePage. In production, it's always undefined. In tests, fixtures pass pre-built states.
- This is a **testability refactor**, not a feature change. It does not affect production behavior.

**Alternatives considered**:
- Mount GamePage and click through UI to reach desired state: Rejected — too slow, tests the setup rather than the feature.
- Export GamePage's internal state setter: Rejected — violates encapsulation.

### 3. Test Fixture Design

**Decision**: Pure fixture functions that use engine `placeCoin`/`joinCoins` directly, returning a `GameState` or `GameSession`

**Rationale**:
- Fixtures are just sequences of engine function calls. They're fast, deterministic, and reuse the same code paths as the game itself.
- Example: `makeCycleBoard()` calls `placeCoin` 4 times + `joinCoins` 3 times, returning a `GameState`. The test then calls `createSession()` and replaces its state, or mounts GamePage with the fixture state.
- Fixtures live in `tests/integration/helpers/fixtures.ts` and are co-located with integration tests.

**Alternatives considered**:
- Hardcoded JSON state objects: Rejected — brittle, don't validate engine behavior during setup.
- Fixture classes with builder pattern: Rejected — overkill; functions are simpler.

### 4. DOM Query Helper Strategy

**Decision**: Shared selector helpers in `tests/integration/helpers/selectors.ts` that wrap `screen` queries with position-based lookups

**Rationale**:
- Integration tests need to find coins, dots, and edges by position (e.g., "the coin at row=2, col=3"). Writing `screen.getByTestId('coin-2-3')` everywhere is repetitive and error-prone.
- Helpers like `getCoinAt(row, col)`, `getDotAt(row, col)`, `getEdgeBetween(a, b)` encapsulate the `data-testid` conventions and make tests readable.
- These helpers are integration-test-specific; they depend on the component `data-testid` attributes established in Sprint 4-5.

### 5. Handling `GamePage` Internal State in Tests

**Decision**: Tests observe GamePage only through rendered DOM, never through internal state inspection

**Rationale**:
- Integration tests treat GamePage as a black box. Assertions are on DOM elements (coin labels, edge presence, TurnIndicator text, CSS classes), not React state.
- This ensures tests don't break when internal implementation details change (e.g., refactored state machine).
- The only exception: `renderGame` helper may need to pass `initialSession` as a prop, which is a setup concern, not an assertion concern.

(End of file - total 66 lines)
