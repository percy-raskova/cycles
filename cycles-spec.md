# CYCLES

A two-player game of planar graphs, parity, and enclosure, played with paper, pen, and coins.

## Components

- A 7×7 grid drawn on paper (49 intersections).
- 12 coins, any denomination, all identical.
- A pen.
- Two players, designated HEADS and TAILS.

## Setup

Draw the 7×7 grid. Place the 12 coins in a shared supply beside the board. Determine the first player by any means.

## Definitions

- **Coin**: a coin resting on a grid intersection. Each coin shows one face (heads or tails) at any moment.
- **Edge**: a straight line segment drawn between two coins.
- **Queen-line**: a line along which a chess queen could travel — horizontal, vertical, or 45° diagonal. Two coins lie on a queen-line iff they share a row, a column, or a diagonal of the grid.
- **Cycle**: a closed loop formed by edges, enclosing a region of the board.
- **Boundary intersection**: an intersection on the outer rank or file of the grid.

## The Turn

On your turn, perform exactly one of the following actions.

### (A) PLACE

Take a coin from the supply. Place it on any empty grid intersection — including any boundary intersection. Choose which face is up. Either face is permitted regardless of which player you are.

### (B) JOIN

Draw an edge between two coins that are not already directly connected. The edge must:

1. lie along a queen-line (horizontal, vertical, or 45° diagonal — eight directions in total);
2. be a single straight segment with its endpoints at the two chosen coins;
3. not cross any existing edge;
4. not pass through any other coin.

Edges drawn along the outer ranks and files of the board are legal — the board boundary is not off-limits.

**Effect of JOIN:**

- If the new edge does **not** close a cycle, the two endpoint coins are flipped to their opposite faces.
- If the new edge **does** close a cycle, enclosing a region of the board, every coin within that region — both on its boundary and strictly inside it — is flipped exactly once. The endpoint flip does not additionally apply.

If no legal action is available, you must pass.

## End of Game

The game ends when both players pass on consecutive turns.

## Scoring

Count the coins showing each face. The player whose face appears on more coins wins. Equal counts are a draw.

## Clarifications

- Coins, once placed, do not move and are not removed.
- Edges, once drawn, cannot be erased.
- Either player may place a coin showing either face; either player may join any two coins regardless of the faces currently shown.
- A coin of degree zero at the end of the game shows whichever face it was last set to.
- The supply may be exhausted before the game ends; PLACE is then unavailable and only JOIN remains.
- A coin lying on a queen-line between two others blocks any direct JOIN between them — such an edge would pass through it.
- When a JOIN closes a cycle, exactly one new bounded region is created (a consequence of planar graph structure). Only the coins in that region flip; coins on prior cycles outside the new region are unaffected.

## UI Conveniences

- **Undo**: A digital implementation may offer an undo control that reverts the most recent move by replaying the game state from the initial position up to (but not including) the last move. Undo is a convenience, not a game rule, and has no effect on scoring or turn order.
- **Reset**: A digital implementation may offer a reset control that immediately returns the game to the initial empty-board state. This is equivalent to starting a new game.
