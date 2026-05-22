# Implementation Plan: React Read-Only SVG Renderer

**Branch**: `004-react-readonly-render` | **Date**: 2026-05-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-react-readonly-render/spec.md`

## Summary

Build a read-only React SVG renderer for the CYCLES game board. The renderer takes a `GameState` object as a prop and produces an SVG visualization: a 7×7 grid background, coins as labeled circles at grid intersections, and JOIN edges as line segments between coin centers. A simple dev page will allow pasting any `GameState` JSON for manual visual validation. No interactivity, state management, or Storybook in this sprint.

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 18.3.1
**Primary Dependencies**: Vite 5.4.11, React DOM, @vitejs/plugin-react
**Storage**: N/A (client-side, state passed as props)
**Testing**: Vitest 2.1.8 + React Testing Library (component mount and prop-reactivity tests)
**Target Platform**: Browser (Vite dev server, modern evergreen)
**Project Type**: Web application (React frontend + pure TypeScript engine)
**Performance Goals**: 60 fps for typical boards; <100ms initial render for max-density board (49 coins + all edges)
**Constraints**: No interactivity (no click handlers, hover states, or drag-and-drop); SVG only; no Canvas or DOM-based alternatives; read-only presentational components only
**Scale/Scope**: Single dev page, 7×7 grid (49 intersections), max 49 coins, edges bounded by planar graph constraints

## Constitution Check

*The project constitution (`.specify/memory/constitution.md`) is currently unfilled — still contains `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`, etc. placeholders. No ratified gates exist to evaluate. Proceeding under the constraints documented in `AGENTS.md` and the established project architecture (pure engine in `src/core/`, thin React layer in `src/ui/`).*

**Self-check against AGENTS.md architecture rules**:
- ✅ `src/core/` remains pure — the renderer lives in `src/ui/`, imports from `@core/` alias only.
- ✅ UI layer is thin and stateless — renderer accepts `GameState` as prop, no local state mutations.
- ✅ Immutable state — renderer never modifies the input `GameState`.

## Project Structure

### Documentation (this feature)

```text
specs/004-react-readonly-render/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (component prop interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── core/                # Pure game engine (unchanged)
│   ├── index.ts
│   ├── types.ts
│   ├── state.ts
│   ├── move.ts
│   ├── session.ts
│   ├── geometry.ts
│   └── __tests__/
├── cli/                 # CLI harness (unchanged)
│   ├── parser.ts
│   ├── renderer.ts
│   ├── main.ts
│   └── __tests__/
└── ui/                  # React rendering layer
    ├── main.tsx         # Entry point (unchanged)
    ├── App.tsx          # Root component (mounts DevPage)
    ├── App.css          # Global styles (minor additions for dev page)
    ├── components/
    │   ├── BoardView.tsx    # Top-level SVG board renderer
    │   ├── CoinView.tsx     # Single coin: circle + label
    │   ├── EdgeView.tsx     # Single edge: line segment
    │   ├── GridView.tsx     # 7×7 grid background
    │   └── __tests__/
    │       ├── BoardView.test.tsx
    │       ├── CoinView.test.tsx
    │       ├── EdgeView.test.tsx
    │       └── GridView.test.tsx
    └── pages/
        └── DevPage.tsx      # State-paste dev page for manual validation
```

**Structure Decision**: Flat component hierarchy under `src/ui/components/`. Each visual element (grid, coin, edge) is a dedicated component for independent testability. The dev page lives under `src/ui/pages/` to separate presentational components from page-level wiring. No new top-level directories needed.

## Complexity Tracking

No complexity violations. The architecture remains two-layered (engine + UI) with no new abstractions introduced. SVG rendering is a direct visual mapping of existing `GameState` data — no state machines, no external APIs, no storage.
