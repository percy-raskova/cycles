# Component Prop Contracts

**Feature**: React Read-Only SVG Renderer (Sprint 4)

These contracts define the public interface of each React component in the rendering layer. All components are presentational (no side effects, no local state beyond derived memoization).

## BoardView

```typescript
interface BoardViewProps {
  readonly state: GameState;
}
```

- **Purpose**: Top-level SVG container. Renders the complete board for a given `GameState`.
- **Invariants**: Never modifies `state`. Produces a single `<svg>` root element.
- **Children**: `GridView`, `EdgeView[]`, `CoinView[]` (in z-order: grid → edges → coins).

## GridView

```typescript
interface GridViewProps {
  readonly gridSize: number; // always 7 for CYCLES
  readonly cellSize: number; // logical units, e.g. 100
  readonly margin: number;   // logical units, e.g. 50
}
```

- **Purpose**: Background grid layer. Renders horizontal/vertical lines and intersection dots.
- **Invariants**: `gridSize` must be > 0. Pure geometry — no game data.

## CoinView

```typescript
interface CoinViewProps {
  readonly coin: Coin; // { position: Position, face: CoinFace }
  readonly cellSize: number;
  readonly margin: number;
  readonly radius: number;
}
```

- **Purpose**: Renders a single coin as an SVG group containing a circle and a text label.
- **Invariants**: `radius` must be < `cellSize / 2` to avoid overlap with adjacent coins.
- **Label**: Text content is `"H"` for `face === "heads"`, `"T"` for `face === "tails"`.

## EdgeView

```typescript
interface EdgeViewProps {
  readonly edge: Edge; // { from: Position, to: Position }
  readonly cellSize: number;
  readonly margin: number;
}
```

- **Purpose**: Renders a single edge as an SVG `<line>` between two grid intersections.
- **Invariants**: Renders even if no coin exists at `from` or `to` (data-layer concern, not visual).
- **Z-order**: Rendered below all `CoinView` instances.

## DevPage

```typescript
interface DevPageProps {
  // No props — self-contained page with internal textarea state
}
```

- **Purpose**: Developer-facing page for pasting `GameState` JSON and visualizing it.
- **State**: Internal textarea string + parsed `GameState | null`.
- **Exports**: `gameStateToJson(state: GameState): string` and `jsonToGameState(json: string): GameState | null` helper functions (dev-only, not part of public API).
