# Data Model: Move Application — Flips and Encirclement

## Overview

Extends the Sprint 1 data model with the `Move` discriminated union and new derived types for cycle detection and interior identification. All fields remain `readonly`; all state transitions remain pure functions.

## Sprint 1 Entities (unchanged)

### Position

A grid intersection on the 7×7 board.

```typescript
interface Position {
  readonly row: number; // 0–6
  readonly col: number; // 0–6
}
```

### Coin

A token placed on a grid intersection.

```typescript
type CoinFace = "heads" | "tails";

interface Coin {
  readonly position: Position;
  readonly face: CoinFace;
}
```

### Edge

A straight line segment connecting two coins.

```typescript
interface Edge {
  readonly from: Position;
  readonly to: Position;
}
```

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

**Invariants** (unchanged from Sprint 1):
- `coins.size + coinsRemaining === 12` (conservation of coins).
- Every coin position is within the 7×7 grid bounds.
- Every edge references positions that exist in `coins`.
- `passCount` is reset to 0 whenever a non-pass action occurs.

## New Entities

### Move

A discriminated union representing a player action.

```typescript
type Move = PlaceMove | JoinMove | PassMove;

interface PlaceMove {
  readonly type: "PLACE";
  readonly position: Position;
  readonly face: CoinFace;
}

interface JoinMove {
  readonly type: "JOIN";
  readonly a: Position;
  readonly b: Position;
}

interface PassMove {
  readonly type: "PASS";
}
```

**Constraints**:
- `PlaceMove.position` must be an empty grid intersection.
- `JoinMove.a` and `JoinMove.b` must be distinct and both occupied by coins.
- `JoinMove.a` and `JoinMove.b` are treated as an unordered pair.

### Cycle Path

An ordered array of `Position` values representing the vertices of a simple cycle in the planar graph, closed (first vertex equals last vertex).

```typescript
type CyclePath = readonly Position[];
```

**Constraints**:
- Length ≥ 4 (minimum triangle has 3 distinct vertices + repeated first vertex to close).
- All positions are occupied by coins.
- Consecutive positions are connected by existing edges (or the new closing edge).
- The polygon is simple (non-self-intersecting), guaranteed by the planarity invariant.

## State Transitions (API Surface)

| Function | Signature | Description |
|----------|-----------|-------------|
| `applyMove` | `(state: GameState, move: Move) => GameState` | Validates the move, then returns a new state with the move applied. Throws on illegal move. |
| `findCycle` | `(state: GameState, a: Position, b: Position) => Position[] \| null` | If JOIN(a,b) would create a cycle, returns the closed cycle path; otherwise null. |
| `coinsInsideCycle` | `(state: GameState, cyclePath: CyclePath) => readonly Position[]` | Returns all coin positions strictly inside the cycle boundary. |
| `pointInPolygon` | `(point: Position, polygon: readonly Position[]) => boolean` | Ray-casting test: true if point is strictly inside the polygon. |

## Notes

- No persistence layer; state lives entirely on the stack/heap during a game session.
- Game-end detection (win/loss/draw) is intentionally **not** in this data model — deferred to Sprint 3.
- Move history or undo functionality is intentionally **not** in this data model — deferred to Sprint 3.
