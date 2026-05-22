# Implementation Plan: React Interactivity — Browser Gameplay

**Branch**: `005-react-interactivity` | **Date**: 2026-05-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-react-interactivity/spec.md`

## Summary

Extend the read-only SVG renderer from Sprint 4 into a fully interactive browser game. Add click handlers for PLACE and JOIN moves, hover states for legal-move feedback, CSS transitions for coin-flip animations, and game-session integration for turn management, auto-pass, and terminal detection. The engine (`GameSession.step`) is the sole authority on move legality; the UI's only job is to construct moves from user input, call `step`, and re-render.

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 18.3.1
**Primary Dependencies**: Vite 5.4.11, React DOM, @vitejs/plugin-react
**Storage**: N/A (client-side, no persistence across reloads)
**Testing**: Vitest 2.1.8 + React Testing Library + jsdom (component tests for interaction state machines and event handlers)
**Target Platform**: Browser (Vite dev server, modern evergreen)
**Project Type**: Web application (React frontend + pure TypeScript engine)
**Performance Goals**: 60 fps for typical interaction; <100ms illegal-move feedback; <500ms flip animation; <50ms hover update
**Constraints**: No animation libraries (CSS transitions only); no state persistence; no AI/multiplayer/undo; UI does not duplicate engine validation
**Scale/Scope**: Single interactive game page, 7×7 grid, max 12 coins (TOTAL_COINS), edges bounded by planar graph constraints

## Constitution Check

*The project constitution (`.specify/memory/constitution.md`) is currently unfilled — placeholders only. No ratified gates exist. Proceeding under `AGENTS.md` constraints:*

- ✅ `src/core/` remains pure — all interactivity lives in `src/ui/`, imports `@core/` only
- ✅ UI layer stays thin — state machine for move construction is local to the page component, not a global store
- ✅ Immutable state — `GameSession` is never mutated; `step` returns a new session

## Project Structure

### Documentation (this feature)

```text
specs/005-react-interactivity/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (component prop extensions)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── core/                # Pure game engine (unchanged from Sprint 3-4)
│   ├── index.ts
│   ├── types.ts
│   ├── state.ts
│   ├── move.ts
│   ├── session.ts
│   ├── geometry.ts
│   └── __tests__/
├── cli/                 # CLI harness (unchanged from Sprint 3)
│   └── ...
└── ui/                  # React rendering layer
    ├── main.tsx         # Entry point (unchanged)
    ├── App.tsx          # Root component (mounts GamePage instead of DevPage)
    ├── App.css          # Extended with animation keyframes + interactive states
    ├── lib/
    │   ├── constants.ts  # Unchanged from Sprint 4
    │   └── coordinates.ts # Unchanged from Sprint 4
    ├── components/
    │   ├── BoardView.tsx     # Extended with click/hover/preview props
    │   ├── CoinView.tsx      # Extended with onClick, isSelected, isFlipping
    │   ├── EdgeView.tsx      # Unchanged from Sprint 4
    │   ├── GridView.tsx      # Extended with onIntersectionClick, isHighlighted
    │   ├── FaceSelector.tsx  # New: inline modal for heads/tails choice
    │   ├── TurnIndicator.tsx # New: player, coins remaining, auto-pass notice
    │   ├── GameOverPanel.tsx # New: final score + New Game button
    │   └── __tests__/
    │       ├── BoardView.test.tsx
    │       ├── CoinView.test.tsx
    │       ├── GridView.test.tsx
    │       ├── FaceSelector.test.tsx
    │       ├── TurnIndicator.test.tsx
    │       └── GameOverPanel.test.tsx
    └── pages/
        ├── GamePage.tsx      # New: interactive game page (replaces DevPage)
        └── DevPage.tsx       # Preserved from Sprint 4 (developer tool)
```

**Structure Decision**: Sprint 4's component hierarchy is extended, not replaced. Each component gains minimal props for its specific interactivity concern. The new `GamePage` orchestrates the `GameSession` lifecycle and move-construction state machine. `DevPage` is preserved for continued developer use.

## Complexity Tracking

No complexity violations. The architecture remains two-layered (engine + UI). The move-construction state machine is a simple 3-state enum (IDLE, SELECTING_FACE, SELECTING_SECOND_COIN) local to `GamePage`. No new abstractions, no global stores, no side-effect layers.
