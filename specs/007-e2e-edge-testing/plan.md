# Implementation Plan: Comprehensive E2E Edge-Case Testing

**Branch**: `007-e2e-edge-testing` | **Date**: 2026-05-22 | **Spec**: [specs/007-e2e-edge-testing/spec.md](specs/007-e2e-edge-testing/spec.md)
**Input**: Feature specification from `/specs/007-e2e-edge-testing/spec.md`

## Summary

Implement rigorous edge-case and boundary testing for the CYCLES game, including:
1. **Engine fix**: Reject coin placement on empty intersections that lie along an existing edge's geometric line.
2. **Comprehensive tests**: Unit, property-based (fast-check), and integration tests targeting edge cases, boundary conditions, and geometric invariants.
3. **Browser E2E tests**: Playwright-based end-to-end tests covering critical user journeys (place, join, cycle close, auto-pass, game over).
4. **Coverage targets**: 100% branch coverage for `src/core/geometry.ts`, `src/core/state.ts` (join/placement), and `src/core/move.ts` (cycle/flipping).
5. **Infrastructure**: Install and configure Playwright; add E2E test scripts to `package.json`.

## Technical Context

**Language/Version**: TypeScript 5.6+  
**Primary Dependencies**: React 18, Vite 5, Vitest 2, fast-check, @testing-library/react, Playwright (new)  
**Storage**: N/A — in-memory game state, no persistence  
**Testing**: Vitest (unit + integration), fast-check (property-based), @testing-library/react (component), Playwright (browser E2E)  
**Target Platform**: Browser (web app), Cloudflare Pages deployment  
**Project Type**: Web application (single-page game)  
**Performance Goals**: Full test suite completes in < 30s; `bun run build` in < 30s  
**Constraints**: 90% coverage threshold for `src/core/`; cognitive complexity ≤ 15; zero React imports in `src/core/`; pre-commit hooks run lint + typecheck + full test suite  
**Scale/Scope**: Single 7×7 grid game, 2 players, 12 coins. Tests focus on correctness, not load/performance.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is currently unfilled (contains `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`, etc. placeholders). No active gates are defined.

**Gate Status**: ✅ PASS — No constitution violations. The feature aligns with existing project conventions (TypeScript strict, test-first, pure engine, thin UI).

## Project Structure

### Documentation (this feature)

```text
specs/007-e2e-edge-testing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (test contracts)
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── core/                # Pure game engine (no React)
│   ├── types.ts
│   ├── geometry.ts
│   ├── state.ts
│   ├── move.ts
│   ├── session.ts
│   ├── index.ts
│   └── __tests__/       # Unit tests
│       ├── geometry.test.ts
│       ├── state.test.ts
│       ├── move.test.ts
│       ├── session.test.ts
│       ├── game.test.ts
│       ├── board.test.ts
│       ├── oracle.test.ts
│       └── invariants.test.ts
├── ui/                  # React rendering layer
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── pages/
│   │   ├── GamePage.tsx
│   │   ├── DevPage.tsx
│   │   └── __tests__/
│   │       └── GamePage.test.tsx
│   ├── components/
│   │   ├── BoardView.tsx
│   │   ├── GridView.tsx
│   │   ├── CoinView.tsx
│   │   ├── EdgeView.tsx
│   │   ├── FaceSelector.tsx
│   │   ├── TurnIndicator.tsx
│   │   ├── GameOverPanel.tsx
│   │   └── __tests__/
│   └── lib/
│       ├── coordinates.ts
│       └── constants.ts
├── cli/                 # CLI renderer (optional, not in scope)
│   ├── main.ts
│   ├── parser.ts
│   ├── renderer.ts
│   └── __tests__/
└── ui/                  # (already covered above)

tests/
├── integration/         # React Testing Library integration tests
│   ├── helpers/
│   │   ├── fixtures.ts
│   │   ├── selectors.ts
│   │   ├── render-game.tsx
│   │   └── __tests__/
│   │       └── fixtures.test.ts
│   ├── game-flow.test.ts
│   ├── move-validation.test.ts
│   ├── cycle-closure.test.ts
│   ├── auto-pass.test.ts
│   ├── component-coordination.test.ts
│   └── new-game-reset.test.ts
└── e2e/                 # NEW: Playwright E2E tests
    ├── fixtures/
    │   └── board-states.ts
    ├── helpers/
    │   └── page-helpers.ts
    └── specs/
        ├── place-coin.spec.ts
        ├── join-coins.spec.ts
        ├── cycle-close.spec.ts
        ├── auto-pass.spec.ts
        └── game-over.spec.ts
```

**Structure Decision**: The existing structure is a single-project web app. The new E2E tests go under `tests/e2e/` (peer to `tests/integration/`), using Playwright. No changes to `src/` structure except the engine fix in `src/core/state.ts`.

## Complexity Tracking

> **No constitution violations to justify.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase 0: Research

### Unknowns Resolved

1. **Playwright integration with Vite + bun**: Playwright supports any dev server via `webServer` config. We will run `bun run dev` or `bun run preview` in the background and point Playwright at `http://localhost:5173`. Playwright has first-class TypeScript support via `@playwright/test`.
2. **Property-based test strategy for game invariants**: `fast-check` will generate random board states (smaller grids for efficiency, e.g., 4×4), random moves, and verify invariants like: `isValidState` always holds after a legal move; `edgeIntersects` is symmetric; `pointInPolygon` is deterministic; `legalJoins` never returns illegal pairs.
3. **Engine fix for edge-blocking placement**: Add a `isBlockedByEdge` check in `legalPlacements` (or `placeCoin`) that tests whether the target position lies on the geometric line of any existing edge (using `pointOnSegment` logic from `geometry.ts`).

### Research Artifacts

See [research.md](research.md) for detailed findings.

## Phase 1: Design

### Data Model

No new entities. The existing data model (Board State, Edge, Cycle, Game Session) is sufficient. See [data-model.md](data-model.md) for the canonical model and validation rules.

### Contracts

Since this is an internal web app (not a library or public API), external API contracts are not applicable. However, **test contracts** are documented in `contracts/test-contracts.md`:
- Engine invariant contracts (what must always be true after any legal move)
- UI interaction contracts (what the user can and cannot do in each phase)
- Playwright page object contracts (how E2E tests interact with the DOM)

### Quickstart

See [quickstart.md](quickstart.md) for developer onboarding: running unit tests, integration tests, Playwright E2E tests, and the dev server.

## Implementation Strategy

### High-Level Approach

1. **Engine fix first** (FR-013): Modify `legalPlacements` in `src/core/state.ts` to filter out positions that lie on any existing edge's line. Re-export helper from `geometry.ts` if needed. Write a unit test confirming the fix.
2. **Unit + property tests** (FR-001–FR-012): Expand existing core test suites with edge-case scenarios: crossing edges, collinear overlaps, boundary positions, coin supply exhaustion, zero-degree coins, figure-eight cycles.
3. **Integration tests** (already have 26; add more for edge cases): Add tests for the new placement-blocking rule, boundary joins, and supply exhaustion.
4. **Playwright setup** (FR-014, FR-015): Install `@playwright/test`, create `playwright.config.ts`, add `e2e` scripts to `package.json`, write page helpers, write 5 E2E specs.
5. **Quality gate**: Run `bun run lint`, `bun run typecheck`, `bun run test:run`, and `bun run e2e` (Playwright) to verify everything passes.
6. **Coverage verification**: Check `src/core/` branch coverage report; ensure 100% for target files.

### Key Files to Modify

| File | Change |
|------|--------|
| `src/core/state.ts` | Add `isBlockedByEdge` check to `legalPlacements`; possibly add helper to `geometry.ts` |
| `src/core/geometry.ts` | Add `pointOnSegment` export (currently private) if needed for placement blocking |
| `src/core/__tests__/state.test.ts` | Add tests for edge-blocking placement rule |
| `src/core/__tests__/geometry.test.ts` | Add property-based tests for `edgeIntersects` symmetry, `pointInPolygon` completeness |
| `src/core/__tests__/move.test.ts` | Add tests for cycle closure edge cases: nested cycles, boundary coins, figure-eight |
| `tests/integration/` | Add new integration tests for boundary behaviors and supply exhaustion |
| `package.json` | Add `@playwright/test` devDependency; add `e2e` and `e2e:ui` scripts |
| `playwright.config.ts` | NEW: Playwright configuration with webServer pointing to Vite |
| `tests/e2e/` | NEW: Playwright page helpers and 5 E2E spec files |
| `vitest.config.ts` | Ensure `tests/e2e/` is excluded from Vitest runs |
| `.gitignore` | Add Playwright artifacts (`test-results/`, `playwright-report/`) |

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Playwright install bloats dev environment | Use `bun add -d @playwright/test` only; skip browser downloads if possible, or document `npx playwright install` as a one-time setup step |
| Engine fix breaks existing integration tests | Run full suite after every change; existing fixtures may need adjustment if they relied on old placement rule |
| Playwright tests are flaky | Use `data-testid` attributes; avoid timing-dependent assertions; use `webServer` config for deterministic startup |
| Coverage targets not met | Use `@vitest/coverage-v8` HTML report to identify uncovered branches; add targeted tests |
| Property-based tests are too slow | Use smaller grid (4×4) and fewer runs (1,000) for property tests; keep unit tests fast |

## Next Steps

Run **`/speckit.tasks`** to generate the detailed task list for implementation.
