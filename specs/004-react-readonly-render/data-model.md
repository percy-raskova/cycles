# Data Model: Visual Rendering Layer

**Feature**: React Read-Only SVG Renderer (Sprint 4)
**Date**: 2026-05-22

## Overview

The visual rendering layer is a read-only projection of the canonical `GameState` (defined in `src/core/types.ts`) into SVG elements. No new domain entities are introduced; the visual model is a 1:1 geometric mapping of existing engine data.

## Coordinate Mapping

The 7×7 grid uses a fixed logical coordinate system:

| Engine Concept | Visual Mapping |
|---|---|
| `Position { row, col }` | SVG `(x, y)` where `x = margin + col * cellSize`, `y = margin + row * cellSize` |
| `Coin` | `<circle>` at mapped position + `<text>` label "H" or "T" |
| `Edge { from, to }` | `<line>` from `from` mapped position to `to` mapped position |
| Grid intersections | `<line>` horizontal/vertical grid lines + `<circle>` dots at intersections |

**Constants** (tunable during implementation):
- `CELL_SIZE`: 100 logical units
- `MARGIN`: 50 logical units
- `VIEWBOX_SIZE`: `MARGIN * 2 + CELL_SIZE * 7` = 800
- `COIN_RADIUS`: ~30–35 logical units

## Component Hierarchy

```
BoardView (props: { state: GameState })
├── GridView (props: { gridSize: number })
│   └── 7 horizontal lines + 7 vertical lines + 49 intersection dots
├── EdgeView[] (props: { from: Position; to: Position })
│   └── One <line> per edge in state.edges
└── CoinView[] (props: { coin: Coin })
    └── One <g> containing <circle> + <text> per coin in state.coins
```

**Render order (z-index)**:
1. GridView (background)
2. EdgeView (middle layer — edges should not obscure coins)
3. CoinView (top layer — coins always visible above edges)

## State Transitions

The renderer is stateless. When the `GameState` prop changes, React re-renders the entire SVG tree. No diffing or incremental update logic is required — the DOM is small enough (max ~200 SVG elements) that full re-renders are trivial.

## Visual Styling Constants

Palette inspired by orchid flower tones (fuchsia petals, green stems) combined with bisexual lighting (warm pink vs. cool cyan contrast on the two coin faces).

| Element | SVG Attribute | Value |
|---|---|---|
| Grid lines | stroke | `#F5E6F5` (pale orchid lavender) |
| Grid lines | strokeWidth | 1 |
| Intersection dots | fill | `#C8A2C8` (orchid) |
| Intersection dots | r | 3 |
| Coin (heads) | fill | `#FFB6E6` (light hot pink — warm side of bisexual lighting) |
| Coin (heads) | stroke | `#FF1493` (deep pink) |
| Coin (tails) | fill | `#B6E6FF` (light cyan — cool side of bisexual lighting) |
| Coin (tails) | stroke | `#00BFFF` (deep sky blue) |
| Coin label | fill | `#4A0E4A` (deep purple, readable on both pink and cyan) |
| Coin label | fontSize | 24 |
| Coin label | fontFamily | `system-ui, sans-serif` |
| Coin label | fontWeight | `bold` |
| Edge | stroke | `#9932CC` (dark orchid) |
| Edge | strokeWidth | 2 |

## Validation Rules

- A `Coin` at an invalid `Position` (outside 0–6 range) must not be rendered (defensive, should not occur with valid engine state).
- An `Edge` referencing a `Position` with no coin must still render the line segment (the edge exists independently of coin presence in the data model).
- Duplicate edges (same `from`/`to` pair in either order) must render only once (though the engine should prevent duplicates).
