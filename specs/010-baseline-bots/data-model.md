# Data Model: Baseline AI Opponents

**Feature**: Baseline AI Opponents  
**Date**: 2026-05-25

## Overview

This feature introduces three new conceptual entities to the CYCLES system:

1. **Bot Function** — a stateless decision function that maps a game state to a legal move.
2. **Simulation Harness** — a headless runner that orchestrates games between two bot instances and aggregates results.
3. **Game Setup Options** — UI-side configuration for starting a human-vs-bot match.

All entities are additive; no existing types are modified.

---

## Entities

### BotFunction

A pure, synchronous function that selects a move given a game state.

| Field | Type | Description |
|-------|------|-------------|
| *signature* | `(state: GameState) => Move` | Receives the current game state; returns a single legal move for `state.currentPlayer`. |

**Constraints**:
- MUST NOT mutate `state`.
- MUST return a move that passes `applyMove(state, move)` without throwing when `hasLegalMoves(session)` is true.
- MUST complete within 100ms.

**Implementations**:
- `randomBot(state)` — selects uniformly from all legal moves.
- `greedyBot(state)` — evaluates each legal move by simulating it and picks the move maximizing the current player's score.

---

### BotStrategy

A discriminated union used by the UI to label and select bot types.

```typescript
export type BotStrategy = "random" | "greedy";
```

**UI mapping**:
| Strategy | Label |
|----------|-------|
| `"random"` | "Random" |
| `"greedy"` | "Greedy" |

---

### ScoreForPlayer (helper)

A new core utility to support greedy evaluation.

```typescript
export function scoreForPlayer(state: GameState, player: Player): number;
```

**Semantics**: Returns the count of coins whose current face matches the given player (HEADS → `heads`, TAILS → `tails`).

**Rationale**: Reused by `greedyBot` and any future MCTS/minimax evaluators.

---

### SimulationConfig

Input to the headless simulation runner.

| Field | Type | Description |
|-------|------|-------------|
| `botA` | `BotFunction` | First bot competitor. |
| `botB` | `BotFunction` | Second bot competitor. |
| `games` | `number` | Total games to run (e.g., 1000). |
| `alternateStarts` | `boolean` | If `true`, game `i` starts with botA as P1 when `i` is even, and botB as P1 when `i` is odd. |

---

### SimulationResult

Aggregated output from the simulation runner.

| Field | Type | Description |
|-------|------|-------------|
| `winsA` | `number` | Games won by `botA`. |
| `winsB` | `number` | Games won by `botB`. |
| `draws` | `number` | Drawn games. |
| `crashes` | `number` | Games that threw an exception or produced an invalid move. |
| `totalGames` | `number` | Total games attempted (`winsA + winsB + draws + crashes`). |

---

### GameSetupOptions

UI-side configuration captured on the setup screen before a match begins.

| Field | Type | Description |
|-------|------|-------------|
| `opponent` | `"human" \| BotStrategy` | `"human"` for local two-player; `"random"` or `"greedy"` for bot opponent. |
| `playerRole` | `Player` | Which player the human controls. Only meaningful when `opponent !== "human"`. |

**Validation**:
- `playerRole` MUST be `"HEADS"` or `"TAILS"`.
- When `opponent === "human"`, `playerRole` is ignored (both players are human).

---

## State Transitions

### Bot Turn (UI)

```
GameState (bot's turn) ──[BotFunction]──> Move ──[applyMove]──> Next GameState
```

### Simulation Game Lifecycle

```
SimulationConfig
    │
    ▼
Create Session (alternating firstPlayer per game)
    │
    ▼
Loop: while not terminal
    ├── Bot A's turn ──> BotFunction A ──> Move ──> applyMove
    └── Bot B's turn ──> BotFunction B ──> Move ──> applyMove
    │
    ▼
Terminal reached ──> computeFinalScore ──> record winner
    │
    ▼
Repeat for N games ──> aggregate into SimulationResult
```

## Relationships

```
GameSetupOptions ──configures──> GameSession (via createSession)
BotFunction ──reads──> GameState ──produces──> Move
SimulationConfig ──contains──> 2× BotFunction
SimulationHarness ──produces──> SimulationResult
```
