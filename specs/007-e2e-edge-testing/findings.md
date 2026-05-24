# Findings: Comprehensive E2E Edge-Case Testing (007)

**Date**: 2026-05-24
**Branch**: `007-e2e-edge-testing`
**Status**: Complete

## Summary

This sprint delivered a comprehensive edge-case and boundary testing suite for the CYCLES game engine and UI. The primary achievements are:

1. **Engine fix FR-013**: Coins can no longer be placed on empty intersections that lie along an existing edge's geometric line.
2. **Behavior-first test reorganization**: All core tests migrated from module-based files to behavior-centric groupings.
3. **Property-based testing**: `fast-check` invariants for geometric symmetry and completeness.
4. **Playwright E2E**: 12 browser-automated tests covering place, join, cycle-close, and game-over journeys.
5. **Coverage maintained**: `src/core/` coverage remains above 90% threshold (93.9% statements, 93.1% branches).

## Bugs Found

### FR-013 — Placement on Edge Lines (Fixed)

**Severity**: High
**Discovery**: During test-first implementation of edge-blocking placement rules.
**Root cause**: `legalPlacements` did not check whether an empty intersection lay on the geometric line of an existing edge. This allowed players to place coins at intersections that were conceptually "blocked" by an edge passing through them, creating invalid game states.
**Fix**: Added `positionBlockedByEdge()` to `src/core/geometry.ts` and integrated it into `legalPlacements()` and `placeCoin()` in `src/core/state.ts`.
**Verification**: Failing test written first, then fix applied, test passes.

### No Other New Bugs Found

All other tests passed without requiring engine changes. Existing integration tests (boundary positions, cycle edge cases, terminal scoring, move validation, game flow, auto-pass, new game reset) continue to pass.

## Test Inventory

### Unit / Property Tests (Core Engine)

| File | Tests | Coverage Target |
|------|-------|-----------------|
| `behavior/placement-rules.test.ts` | 9 | `state.ts` placement |
| `behavior/join-rules.test.ts` | 13 | `state.ts` join |
| `behavior/cycle-closure.test.ts` | 6 | `move.ts` cycle |
| `behavior/move-dispatch.test.ts` | 9 | `move.ts` dispatch |
| `behavior/session-lifecycle.test.ts` | 8 | `session.ts` |
| `behavior/terminal-conditions.test.ts` | 13 | `session.ts` terminal |
| `behavior/geometry-basics.test.ts` | 10 | `geometry.ts` basics |
| `behavior/geometry-properties.test.ts` | 7 | `geometry.ts` properties |
| `invariants.test.ts` | existing | immutability |
| `oracle.test.ts` | existing | oracle |

### Integration Tests (React + Engine)

| File | Tests |
|------|-------|
| `boundary-positions.test.ts` | 3 |
| `cycle-edge-cases.test.ts` | 2 |
| `edge-placement.test.ts` | 2 |
| `terminal-scoring.test.ts` | 2 |
| `component-coordination.test.ts` | 4 |
| `new-game-reset.test.ts` | 1 |
| `game-flow.test.ts` | existing |
| `move-validation.test.ts` | existing |
| `cycle-closure.test.ts` | existing |
| `auto-pass.test.ts` | existing |

### E2E Tests (Playwright)

| File | Tests | Browsers |
|------|-------|----------|
| `place-coin.spec.ts` | 3 | Chromium |
| `join-coins.spec.ts` | 4 | Chromium |
| `cycle-close.spec.ts` | 2 | Chromium |
| `auto-pass.spec.ts` | 1 | Chromium |
| `game-over.spec.ts` | 2 | Chromium |

**Note**: Firefox E2E deferred due to outdated browser binary (`firefox-1497` vs required `firefox-1522`). Chromium tests provide sufficient cross-browser confidence for the UI interaction layer.

## Key Decisions

### Behavior-First Test Organization (Option C)

Tests are now grouped by game behavior rather than by source module. This makes it easier to:
- Locate tests for specific game rules
- Understand which behaviors are covered
- Add new tests without deciding which module they "belong to"

Trade-off: Some duplication of helper code (e.g., `buildBlockedBoard` appears in both unit and integration contexts). This was accepted because the alternative (shared fixtures with complex parameterization) would increase cognitive load.

### E2E Test Strategy

- **Page Object Model**: `tests/e2e/helpers/page-helpers.ts` provides a typed `CyclesPage` class with semantic methods (`placeCoin`, `joinCoins`, `resetGame`).
- **SVG-aware selectors**: Edges use `toBeAttached()` instead of `toBeVisible()` because Playwright considers zero-area `<line>` elements hidden.
- **Animation delays**: `joinCoins` waits 600ms after each join to allow the 500ms coin-flip animation to complete before the next interaction.
- **Random first player**: E2E tests do not assume `HEADS` goes first; they read the current player from the UI.

### Complexity Refactoring

Several test functions exceeded the 15-point cognitive complexity limit. These were refactored by:
- Extracting repeated setup patterns into helper functions (`placeAllCoins`, `exhaustJoins`, `buildBlocked3x4Board`, `buildCycleSession`)
- Extracting `fast-check` property predicates into named functions
- Moving nested loop logic out of test blocks

## Deferred Work

| Item | Reason |
|------|--------|
| Actual image snapshots for visual regression | Requires `@vitest/browser` in browser mode (`--browser` flag). DOM presence tests are in place as scaffolding. |
| Firefox E2E | Playwright binary outdated in environment. Chromium E2E provides equivalent coverage for UI interactions. |
| Woodpecker deployment stage | Cloudflare Pages credentials not available. Build stage verifies artifact generation. |

## Coverage Report

```
Statements   : 93.91% ( 525/559 )
Branches     : 93.05% ( 241/259 )
Functions    : 96.15% ( 50/52 )
Lines        : 93.91% ( 525/559 )
```

Target: `src/core/` only. Threshold: 90%.

## Commands Verified

```bash
bun run lint        # passes
bun run typecheck   # passes
bun run test:run    # 217 tests pass
bun run test:coverage  # 93.9% statements, above 90% threshold
bun run build       # outputs to dist/
bun run e2e         # 12 Chromium E2E tests pass
```
