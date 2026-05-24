# Data Model: CYCLES Game Engine

**Date**: 2026-05-22  
**Feature**: Comprehensive E2E Edge-Case Testing  
**Plan**: [plan.md](plan.md)

## Overview

The CYCLES game engine operates on a fixed 7×7 grid. All game state is immutable (functions return new state). The engine is pure TypeScript with zero React imports.

## Entities

### Position

```typescript
interface Position {
  readonly row: number; // 0–6 inclusive
  readonly col: number; // 0–6 inclusive
}
```

**Validation**: `0 ≤ row < GRID_SIZE` and `0 ≤ col < GRID_SIZE`, where `GRID_SIZE = 7`.

### Coin

```typescript
interface Coin {
  readonly position: Position;
  face: CoinFace; // "heads" | "tails"
}
```

**Constraints**:
- Each coin occupies exactly one Position.
- No two coins may share the same Position.
- Maximum 12 coins on the board (`TOTAL_COINS = 12`).

### Edge

```typescript
interface Edge {
  readonly from: Position;
  readonly to: Position;
}
```

**Constraints**:
- `from` and `to` must both be occupied by coins.
- `from` and `to` must lie on a queen-line (same row, same column, or same diagonal).
- No duplicate edges (undirected: `{a,b}` === `{b,a}`).
- No edge may cross any other edge at a non-shared point.
- No edge may pass through any intermediate coin on the same queen-line.
- **NEW (FR-013)**: An edge blocks placement of new coins at any empty Position that lies on the geometric line segment between its endpoints.

### GameState

```typescript
interface GameState {
  readonly coins: ReadonlyMap<string, Coin>; // key = "row,col"
  readonly edges: readonly Edge[];
  readonly currentPlayer: Player; // "HEADS" | "TAILS"
  readonly coinsRemaining: number; // 0–12
  readonly passCount: number; // 0–2
  readonly lastAction: Action | null; // "PLACE" | "JOIN" | "PASS" | null
}
```

**Invariant**: `coins.size + coinsRemaining === TOTAL_COINS` (12).

### Move

```typescript
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

type Move = PlaceMove | JoinMove | PassMove;
```

### GameSession

```typescript
interface GameSession {
  readonly state: GameState;
  readonly history: readonly Move[];
  readonly isTerminal: boolean;
  readonly winner: Player | "draw" | null;
}
```

## State Transitions

### PLACE

```
Preconditions:
  - coinsRemaining > 0
  - position is within bounds
  - position is not occupied by a coin
  - position is not blocked by any existing edge (FR-013)

Postconditions:
  - New coin added at position with chosen face
  - coinsRemaining -= 1
  - currentPlayer toggles (HEADS ↔ TAILS)
  - passCount = 0
  - lastAction = "PLACE"
```

### JOIN

```
Preconditions:
  - Both a and b are occupied by coins
  - a and b are on a queen-line
  - No existing edge connects a and b
  - Proposed edge does not cross any existing edge
  - Proposed edge does not pass through any intermediate coin

Postconditions:
  - New edge added
  - If edge closes a cycle: all coins on and inside the cycle boundary are flipped exactly once
  - If edge does not close a cycle: only endpoint coins are flipped
  - currentPlayer toggles (HEADS ↔ TAILS)
  - passCount = 0
  - lastAction = "JOIN"
```

### PASS

```
Preconditions:
  - No legal moves available (forced pass)
  - OR: game is already terminal (no-op)

Postconditions:
  - currentPlayer toggles (HEADS ↔ TAILS)
  - passCount += 1
  - lastAction = "PASS"
  - If passCount >= 2: game becomes terminal
```

## Validation Rules

1. **Coin count invariant**: `coins.size + coinsRemaining === 12`
2. **Bounds invariant**: All coin positions satisfy `0 ≤ row < 7` and `0 ≤ col < 7`
3. **Edge coin existence**: Every edge references positions that exist in `coins`
4. **Pass count**: `passCount` is always in `[0, 2]` during active play; `>= 2` means terminal
5. **No duplicate edges**: The `edges` array contains no pair of edges that are equal (undirected)
6. **Planar graph**: No two edges cross at a non-shared point
7. **No through-coin edges**: No edge passes through a coin on its queen-line
8. **No placement along edge**: No empty position on an existing edge's line segment is legal for placement (FR-013)

## Relationships

```mermaid
erDiagram
    GameState ||--o{ Coin : contains
    GameState ||--o{ Edge : contains
    GameSession ||--|| GameState : tracks
    Edge ||--|| Coin : from
    Edge ||--|| Coin : to
```
