# Research: React Read-Only SVG Renderer

**Date**: 2026-05-22
**Feature**: React Read-Only SVG Renderer (Sprint 4)

## Unknowns Resolved

### 1. Rendering Technology: SVG vs Canvas vs DOM

**Decision**: SVG

**Rationale**:
- SVG elements are DOM nodes, making them testable with React Testing Library (query by role, attribute, text content).
- SVG is declarative and fits React's component model naturally — each coin and edge can be a `<circle>`, `<line>`, or `<text>` element.
- The game board is static per frame (no animation in this sprint), so Canvas's imperative redraw model offers no advantage.
- SVG scales crisply at any resolution without extra work.
- The spec explicitly mandates SVG.

**Alternatives considered**:
- Canvas 2D: Better for thousands of moving objects. Overkill for 49 coins + ~100 edges. Imperative API complicates React integration and testing.
- DOM divs with CSS: Possible for a grid, but edges as line segments between arbitrary intersections are awkward with CSS. SVG `<line>` is the right primitive.

### 2. SVG Coordinate System

**Decision**: Fixed logical coordinate system with `viewBox`

**Rationale**:
- Use a `viewBox="0 0 800 800"` (or similar) so all internal coordinates are unitless and resolution-independent.
- Grid cell size = 100 logical units. With 7×7 grid and 50-unit margin on each side: `viewBox="0 0 800 800"`.
- Intersection at (row, col) maps to SVG coordinates: `(margin + col * cellSize, margin + row * cellSize)`.
- This gives clean integer math and easy testing (e.g., coin at A1 = (50, 50) if margin=50, cellSize=100).

**Alternatives considered**:
- Percentage-based coordinates: Fragile, harder to test, scales non-uniformly.
- Pixel-based with dynamic sizing: Requires measuring container, adds complexity for a read-only renderer.

### 3. Testing Strategy for Visual Components

**Decision**: React Testing Library for structural assertions + dev page for visual validation

**Rationale**:
- RTL can assert: "there are exactly 3 circles", "this text says 'H'", "this line goes from (50,50) to (150,50)".
- Visual correctness (pixel-perfect alignment, color choices, anti-aliasing) is best validated manually via the dev page by pasting real `GameState` objects from tests.
- No screenshot testing tools (Playwright, Chromatic) will be introduced in this sprint; they are "future work".

**Alternatives considered**:
- Playwright visual regression: Powerful but adds significant toolchain complexity. Deferred.
- Snapshot testing: Brittle for SVG attributes; rejected.

### 4. Dev Page State Input Format

**Decision**: Paste JSON-serialized `GameState` into a textarea

**Rationale**:
- `GameState` is plain data (Map + arrays). `JSON.stringify()` works for everything except `Map`. Need a helper to serialize/deserialize `coins` Map as an array of `[key, value]` pairs or an object.
- The dev page will include a small `gameStateToJson` / `jsonToGameState` helper in the page component itself (not in `src/core/`, since it's dev-tooling only).
- This avoids introducing a persistence/serialization layer into the engine.

### 5. Grid Background Style

**Decision**: Light horizontal and vertical grid lines + small dots at intersections

**Rationale**:
- Faint lines make the grid structure obvious without competing with coins.
- Dots at intersections reinforce the "intersection" concept central to the game's planar graph geometry.
- Lines should be subtle (low opacity or light gray) so coins and edges remain the visual focus.

**Alternatives considered**:
- Dots only: Less clear grid structure.
- Full squares/cells: Too heavy, makes the board look like a chess board rather than an intersection graph.

## Open Decisions for Implementation Phase

- Exact color palette (coin fill, edge stroke, grid lines): To be decided during implementation based on visual clarity. Dark-mode support is out of scope.
- Coin radius: ~30–35 logical units (30% of cell size) to leave gaps between adjacent coins. Exact value determined during implementation.
- Dev page layout: Side-by-side (textarea left, board right) vs stacked. Side-by-side preferred for visibility.
