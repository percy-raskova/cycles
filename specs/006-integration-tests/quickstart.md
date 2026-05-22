# Quickstart: Integration Tests

**Feature**: Integration Tests (Sprint 6)

## Run the Tests

```bash
# Run all tests (unit + integration)
bun run test:run

# Run only integration tests
bun run test:run tests/integration

# Run a specific integration test file
bun run test:run tests/integration/cycle-closure.test.ts

# Watch mode for integration tests
bun run test tests/integration
```

## Write a New Integration Test

1. **Create the test file** in `tests/integration/<concern>.test.ts`.
2. **Import the helper utilities**:

```typescript
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { makeCycleBoardState } from "./helpers/fixtures";
import { getCoinAt, getEdgeBetween } from "./helpers/selectors";
import { renderGame } from "./helpers/render-game";
```

3. **Build state with a fixture, mount, interact, assert**:

```typescript
describe("Cycle Closure", () => {
  it("flips interior coins when a cycle is closed", async () => {
    // Arrange: build a board with an open cycle
    const state = makeCycleBoardState();
    const { user } = renderGame({ initialSession: createSession({ initialState: state }) });

    // Act: close the cycle by joining the final edge
    const coin42 = getCoinAt(4, 2);
    const coin22 = getCoinAt(2, 2);
    await user.click(coin42); // select first coin
    await user.click(coin22); // select second coin to close cycle

    // Assert: edge appears
    expect(getEdgeBetween({ row: 4, col: 2 }, { row: 2, col: 2 })).toBeDefined();

    // Assert: interior coin flipped
    const interiorCoin = getCoinAt(3, 3);
    expect(interiorCoin.querySelector("text")?.textContent).toBe("T"); // was heads, now tails
  });
});
```

4. **Use fake timers for timer-dependent behavior**:

```typescript
import { vi } from "vitest";

it("auto-passes after notice delay", async () => {
  vi.useFakeTimers();
  const state = makeBlockedBoardState();
  const { user } = renderGame({ initialSession: createSession({ initialState: state }) });

  // Notice should be visible
  expect(screen.getByTestId("turn-indicator-notice")).toBeDefined();

  // Advance timers
  vi.runAllTimers();

  // Turn should have switched
  expect(screen.getByTestId("turn-indicator-player").textContent).toBe("TAILS");
  vi.useRealTimers();
});
```

## Debug a Failing Test

```bash
# Run with verbose output
bun run test:run tests/integration/auto-pass.test.ts --reporter=verbose

# Run a single test by name
bun run test:run tests/integration/auto-pass.test.ts -t "displays notice"

# Inspect the rendered DOM
# Add `screen.debug()` in your test to print the DOM tree
```

## Directory Structure

```
tests/integration/
├── helpers/
│   ├── fixtures.ts       # State builders (makeCycleBoardState, etc.)
│   ├── render-game.tsx   # Wrapper to mount GamePage with initial session
│   └── selectors.ts      # Position-based DOM queries
├── game-flow.test.ts
├── move-validation.test.ts
├── cycle-closure.test.ts
├── auto-pass.test.ts
├── component-coordination.test.ts
└── new-game-reset.test.ts
```

## Test Philosophy

- **Black box**: Assert on DOM, never inspect React internal state.
- **Real engine**: Use `placeCoin`/`joinCoins` in fixtures; never mock `@core`.
- **One concern per file**: Each `.test.ts` maps to one user story from the spec.
- **Fast**: Fake timers, engine fixtures, no browser — target <2s per file.
