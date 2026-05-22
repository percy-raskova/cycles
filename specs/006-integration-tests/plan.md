# Implementation Plan: Integration Tests

**Branch**: `006-integration-tests` | **Date**: 2026-05-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-integration-tests/spec.md`

## Summary

Add a comprehensive integration test suite under `tests/integration/` that mounts the interactive `GamePage` with the real game engine and exercises complete user journeys: full game flow, move validation, cycle closure, auto-pass, component coordination, and new-game reset. Tests use React Testing Library in jsdom with fake timers for deterministic execution. Engine fixtures (direct `placeCoin`/`joinCoins` calls) construct complex board states quickly. The goal is to catch regressions across the UI-engine boundary before deployment.

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 18.3.1  
**Primary Dependencies**: Vitest 2.1.9, @testing-library/react 16.3.2, jsdom 29.1.1, @testing-library/user-event 14.6.1  
**Storage**: N/A (client-side, no persistence)  
**Testing**: Vitest (already configured with jsdom for UI component tests)  
**Target Platform**: Browser (tests run in jsdom environment)  
**Project Type**: Web application (React frontend + pure TypeScript engine)  
**Performance Goals**: Full integration suite completes in <30 seconds  
**Constraints**: No browser automation (Playwright out of scope); fake timers only; no engine modifications  
**Scale/Scope**: ~8-10 integration test files, each testing a specific user story concern or edge case

## Constitution Check

*The project constitution (`.specify/memory/constitution.md`) is currently unfilled — placeholders only. No ratified gates exist. Proceeding under `AGENTS.md` constraints:*

- ✅ `src/core/` remains pure — integration tests import `@core` but do not modify it
- ✅ UI layer tested through `GamePage` — no new abstractions, thin test layer
- ✅ Immutable state — `GameSession` never mutated; fixtures return new states
- ✅ Test-first — TDD approach: tests written first, then verified they exercise real engine
- ✅ 90% coverage threshold on `src/core/` maintained (integration tests don't affect core coverage)

## Project Structure

### Documentation (this feature)

```text
specs/006-integration-tests/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (test fixture API contracts)
└── tasks.md             # Phase 2 output (not yet created)
```

### Source Code (repository root)

```text
src/
├── core/                # Pure game engine (unchanged)
│   ├── index.ts
│   ├── types.ts
│   ├── state.ts
│   ├── session.ts
│   └── ...
└── ui/                  # React rendering layer (unchanged)
    ├── components/
    ├── pages/
    └── ...

tests/
├── integration/         # New: Integration tests (GamePage + real engine)
│   ├── helpers/
│   │   ├── fixtures.ts    # Engine fixture builders (makeCycleBoard, makeBlockedBoard, etc.)
│   │   ├── render-game.tsx # Wrapper: mount GamePage with optional initial session
│   │   └── selectors.ts   # DOM query helpers (getCoinAt, getDotAt, getEdgeBetween)
│   ├── game-flow.test.ts       # US1: Complete game to terminal state
│   ├── move-validation.test.ts # US2: Illegal moves rejected, legal moves accepted
│   ├── cycle-closure.test.ts   # US3: Cycle closes, interior coins flip
│   ├── auto-pass.test.ts       # US4: Auto-pass triggers, notice, turn switches
│   ├── component-coordination.test.ts # US5: TurnIndicator, highlights, hover states
│   └── new-game-reset.test.ts  # US6: Terminal → New Game resets all state
├── unit/                  # Future: top-level unit tests (if any)
├── e2e/                   # Future: Playwright tests (out of scope)
└── contract/              # Future: API contract tests (out of scope)
```

**Structure Decision**: The `tests/` directory is organized by test type (`integration/`, `unit/`, `e2e/`, `contract/`). Integration tests live in `tests/integration/` with files named by user story concern. A `tests/integration/helpers/` subdirectory contains shared test utilities (fixtures, render wrapper, DOM selectors) to keep test files focused on assertions.

## Complexity Tracking

No complexity violations. The architecture adds a thin test layer (helpers + test files) that mounts existing components with the real engine. No new abstractions, no global stores, no side-effect layers. Test fixtures are pure functions that use existing engine `placeCoin`/`joinCoins` to build state.

(End of file - total 89 lines)
