# Component Prop Contracts

**Feature**: React Interactivity — Browser Gameplay (Sprint 5)

These contracts extend the Sprint 4 read-only component interfaces with interactivity props and define new interactive components.

## Extended BoardView

```typescript
interface BoardViewProps {
  readonly state: GameState;
  readonly onCoinClick: (position: Position) => void;
  readonly onIntersectionClick: (position: Position) => void;
  readonly onIntersectionHover: (position: Position | null) => void;
  readonly selectedCoin: Position | null;
  readonly hoveredPosition: Position | null;
  readonly previewEdge: { readonly from: Position; readonly to: Position } | null;
  readonly legalPlacements: ReadonlySet<string>;
  readonly flippingCoins: ReadonlySet<string>;
}
```

- **Purpose**: Renders the complete interactive board. Passes click/hover handlers down to child elements.
- **Invariants**: All callback props are stable references (wrapped in `useCallback` by parent) to prevent unnecessary re-renders.

## Extended CoinView

```typescript
interface CoinViewProps {
  readonly coin: Coin;
  readonly onClick?: (position: Position) => void;
  readonly isSelected: boolean;
  readonly isHighlighted: boolean;
  readonly isFlipping: boolean;
}
```

- **Purpose**: Renders a single interactive coin. `onClick` is optional for read-only contexts.
- **Visual states**:
  - `isSelected`: Thick gold ring (`#FFD700`) around the coin.
  - `isHighlighted`: Slightly larger radius or brighter stroke.
  - `isFlipping`: CSS transition class applied to circle for fill/stroke animation.

## Extended GridView

```typescript
interface GridViewProps {
  readonly gridSize: number;
  readonly cellSize: number;
  readonly margin: number;
  readonly onIntersectionClick?: (position: Position) => void;
  readonly onIntersectionHover?: (position: Position | null) => void;
  readonly hoveredPosition: Position | null;
  readonly legalPlacements: ReadonlySet<string>;
}
```

- **Purpose**: Renders the interactive grid background. Dots are clickable and hoverable.
- **Visual states**:
  - Legal placement + hover: Dot grows to r=6 and stroke appears (`#90EE90` light green ring).
  - Non-legal + hover: No change.

## FaceSelector

```typescript
interface FaceSelectorProps {
  readonly position: Position;
  readonly onSelect: (face: CoinFace) => void;
  readonly onCancel: () => void;
}
```

- **Purpose**: Inline face selector shown next to the clicked intersection.
- **Behavior**: Two buttons (H / T). Clicking either calls `onSelect`. Clicking outside or pressing Escape calls `onCancel`.

## TurnIndicator

```typescript
interface TurnIndicatorProps {
  readonly session: GameSession;
  readonly notice: string | null;
}
```

- **Purpose**: Displays current player, coins remaining, and auto-pass notice.
- **Notice**: Shown briefly when auto-pass is pending (e.g., "HEADS has no legal moves — passing").

## GameOverPanel

```typescript
interface GameOverPanelProps {
  readonly score: FinalScore;
  readonly onNewGame: () => void;
}
```

- **Purpose**: Displays final score and "New Game" button.
- **Invariants**: Only rendered when `session.isTerminal === true`.

## GamePage (orchestrator)

```typescript
interface GamePageProps {
  // No external props — self-contained
}
```

- **Purpose**: Top-level interactive page. Manages `GameSession`, `MovePhase`, `HoverState`, `FlipState`.
- **Side effects**: `useEffect` for auto-pass detection.
- **Child components**: `BoardView`, `FaceSelector` (conditional), `TurnIndicator`, `GameOverPanel` (conditional).
