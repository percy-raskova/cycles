# Test Fixture API Contract

**Feature**: Integration Tests (Sprint 6)

## Fixture Functions

All fixtures live in `tests/integration/helpers/fixtures.ts`.

### `makeInitialState(firstPlayer?: Player): GameState`

Returns an empty board with the specified first player (defaults to random per engine).

### `makeCycleBoardState(): GameState`

Returns a board with four coins in a square:
- Coins at (2,2) heads, (2,4) tails, (4,4) heads, (4,2) tails
- Edges: (2,2)→(2,4), (2,4)→(4,4), (4,4)→(4,2)
- The cycle is open; joining (4,2)→(2,2) would close it.

### `makeBlockedBoardState(): GameState`

Returns a board where the current player has no legal moves.
- All 12 coins placed.
- Current player's coins are positioned such that no legal JOIN targets remain.

### `makeFullBoardNoEdgesState(): GameState`

Returns a board with all 12 coins placed but zero edges.

## Render Wrapper Contract

### `renderGame(options?: RenderGameOptions): RenderResult & { user: UserEvent }`

Located in `tests/integration/helpers/render-game.tsx`.

**Options**:

```typescript
interface RenderGameOptions {
  readonly initialSession?: GameSession;
}
```

**Behavior**:
- If `initialSession` is provided, renders `<GamePage initialSession={initialSession} />`.
- If omitted, renders `<GamePage />` (which calls `createSession()` internally).
- Returns the standard RTL `RenderResult` plus a `user` instance from `@testing-library/user-event`.

## Selector Helper Contract

### `getCoinAt(row: number, col: number): HTMLElement`

Finds the coin group element at the given position via `screen.getByTestId(\`coin-${row}-${col}\`)`.

### `getDotAt(row: number, col: number): HTMLElement`

Finds the grid dot (intersection circle) at the given position. Queries by `cx`/`cy` attributes since dots don't have per-position test IDs.

### `getEdgeBetween(from: Position, to: Position): HTMLElement`

Finds the edge line between two positions via `screen.queryByTestId(\`edge-${from.row}-${from.col}-${to.row}-${to.col}\`)`.

### `getFaceSelector(row: number, col: number): HTMLElement`

Finds the face selector container for a given intersection position.

## Invariants

- All fixture functions are pure — no side effects, no global state.
- `renderGame` creates a new user-event instance per call — no shared event state between tests.
- Selector helpers throw descriptive errors when elements are not found.
