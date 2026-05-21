# Data Model: Core Engine — State and Legality

## Overview

Immutable value types for the CYCLES game engine. All fields are `readonly`; state transitions are pure functions that return new instances.

## Entities

### Position

A grid intersection on the 7×7 board.

```typescript
interface Position {
  readonly row: number; // 0–6
  readonly col: number; // 0–6
}
```

**Validation**: `row` and `col` must be integers in `[0, 6]`. Construction-time assertion (or validated by caller).

### Coin

A token placed on a grid intersection.

```typescript
type CoinFace = "heads" | "tails";

interface Coin {
  readonly position: Position;
  readonly face: CoinFace;
}
```

**Identity**: Uniquely identified by its `position`. No two coins may share the same position.

### Edge

A straight line segment connecting two coins.

```typescript
interface Edge {
  readonly from: Position;
  readonly to: Position;
}
```

**Identity**: Unordered pair. `{from: A, to: B}` is identical to `{from: B, to: A}`.
**Constraints**:
- `from` and `to` must be distinct.
- The segment must lie on a queen-line (horizontal, vertical, or 45° diagonal).
- The segment must not pass through any other coin.
- The segment must not cross any existing edge segment (shared endpoints allowed).

### GameState

The complete snapshot of a game in progress.

```typescript
type Player = "HEADS" | "TAILS";
type Action = "PLACE" | "JOIN" | "PASS";

interface GameState {
  readonly coins: ReadonlyMap<string, Coin>;
  readonly edges: readonly Edge[];
  readonly currentPlayer: Player;
  readonly coinsRemaining: number; // 0–12
  readonly passCount: number;      // 0–2 (consecutive passes; resets on non-pass)
  readonly lastAction: Action | null;
}
```

**Invariants**:
- `coins.size + coinsRemaining === 12` (conservation of coins).
- Every coin position is within the 7×7 grid bounds.
- Every edge references positions that exist in `coins`.
- `passCount` is reset to 0 whenever a non-pass action occurs.

## Derived Types

### Legal Placement

A `Position` that is:
1. Within the 7×7 grid bounds.
2. Not occupied by a coin.
3. Only valid if `coinsRemaining > 0`.

### Legal Join

An unordered pair `[Position, Position]` representing two coins that satisfy all four JOIN constraints (queen-line, no blocking coin, no duplicate edge, no crossing).

## State Queries (API Surface)

| Function | Signature | Description |
|----------|-----------|-------------|
| `createInitialState` | `(firstPlayer?: Player) => GameState` | Empty board, 12 coins in supply, pass count 0. |
| `legalPlacements` | `(state: GameState) => readonly Position[]` | All empty intersections if supply remains; else empty. |
| `legalJoins` | `(state: GameState) => readonly [Position, Position][]` | All unordered coin pairs satisfying the four constraints. |

## Notes

- The `coins` map uses string keys of the form `"${row},${col}"` for O(1) lookup.
- No persistence layer; state lives entirely on the stack/heap during a game session.
- Cycle detection and region enclosure are intentionally **not** in this data model — deferred to Sprint 2.
