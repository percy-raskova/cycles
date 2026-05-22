# Feature Specification: Game Loop and CLI

**Feature Branch**: `[003-game-loop-cli]`  
**Created**: 2026-05-21  
**Status**: Draft  
**Input**: User description: "Sprint 3: Game loop and terminal detection. Wrap the engine in a turn manager: alternate players, detect 'no legal move' forcing a pass, detect two consecutive passes, compute final score. Add a minimal CLI harness (read move from stdin, print board as ASCII) so you can actually play through games before any React exists. Exit criteria: you can play a full game against yourself in the terminal. This is the moment you discover any remaining rule ambiguities — do not skip it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Play a Full Game in the Terminal (Priority: P1)

Two players take turns on the same terminal. At startup, the system randomly determines which player goes first and announces it. Each turn the current player sees an ASCII rendering of the board, is told whose turn it is, and enters a move. The system validates the move, updates the board (including any coin flips caused by cycles), switches to the other player, and continues. The game ends when both players pass on consecutive turns, at which point the final score and winner are displayed.

**Why this priority**: This is the primary deliverable of the sprint. Without a playable loop, the engine remains unvalidated and the rules remain untested against real play.

**Independent Test**: Can be fully tested by starting the program, entering a sequence of legal moves and/or forced passes, and reaching a terminal state that reports a final score.

**Acceptance Scenarios**:

1. **Given** a fresh game, **When** the first player enters a legal PLACE move, **Then** the coin appears on the board showing the chosen face and play passes to the second player.
2. **Given** a game in progress, **When** a player enters a legal JOIN move that closes a cycle, **Then** every coin inside or on the boundary of the new region is flipped, the board updates, and play passes to the other player.

---

### User Story 2 – Forced Pass Detection (Priority: P2)

When a player's turn begins, the system evaluates whether any legal PLACE or JOIN move exists for that player. If no legal move is available, the system automatically records a pass, prints a notice, and ends the turn.

**Why this priority**: Core rule enforcement. The canonical rules state "If no legal action is available, you must pass." The turn manager must implement this constraint faithfully.

**Independent Test**: Can be fully tested by constructing a board state with zero legal moves for the current player and verifying that the system records a pass without waiting for input.

**Acceptance Scenarios**:

1. **Given** a board state with no legal moves for the current player, **When** their turn begins, **Then** the system records a pass, displays a "forced pass" message, and play passes to the opponent.
2. **Given** a board state with at least one legal move, **When** the player's turn begins, **Then** the system waits for player input and does not auto-pass.

---

### User Story 3 – Terminal Detection and Final Scoring (Priority: P3)

The system detects when both players have passed on consecutive turns, immediately ends the game, counts the coins showing each face, and reports the winner (or a draw).

**Why this priority**: Required for game completion. Without terminal detection the game loop would run forever.

**Independent Test**: Can be fully tested by simulating two consecutive passes and verifying that the game ends with the correct score and winner declaration.

**Acceptance Scenarios**:

1. **Given** one player has just passed, **When** the next player also has no legal moves and passes, **Then** the game ends immediately and the final score is computed.
2. **Given** the game has ended, **When** the final score is tallied, **Then** the player whose face appears on more coins is declared the winner; equal counts are reported as a draw.

---

### Edge Cases

- What happens when a player submits an invalid move?  
  → The move is rejected, a concise error message is printed, and the same player is re-prompted without consuming their turn.
- What happens if both players have no legal moves on their very first turn?  
  → The first player is forced to pass, then the second player is forced to pass; the game ends immediately with a score of 0–0 (draw).
- What happens if the coin supply is exhausted but legal joins remain?  
  → PLACE moves are no longer available; the player may still JOIN. If no joins remain, the player is forced to pass.
- What happens if standard input is closed unexpectedly (e.g., Ctrl+D / EOF)?  
  → The program exits gracefully without crashing or leaving the terminal in a broken state.
- What happens if a player types `PASS` when they still have legal moves available?  
  → The input is rejected as an invalid move, an error message is printed, and the player is re-prompted.
- How is the first player chosen?  
  → The system performs a fair random selection at startup and announces which player (HEADS or TAILS) goes first.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain an alternating turn order between the two players.
- **FR-002**: System MUST evaluate all legal PLACE and JOIN moves for the current player at the start of each turn.
- **FR-003**: System MUST automatically record a pass and end the turn when the current player has zero legal moves. Passing is only permitted when no legal move exists.
- **FR-004**: System MUST end the game when two consecutive passes are recorded.
- **FR-005**: System MUST compute the final score by counting coins showing each face and declare a winner or a draw.
- **FR-006**: System MUST provide a command-line interface that reads player moves from standard input.
- **FR-007**: System MUST render the current board state, coin faces, and edges as ASCII art after each move.
- **FR-008**: System MUST reject invalid moves — including a `PASS` command entered when legal moves still exist — display a concise error message, and re-prompt the same player.
- **FR-009**: System MUST display whose turn it is and how many coins remain in the supply before each player input prompt.
- **FR-010**: System MUST determine the first player at random (e.g., a fair coin flip) and announce it at game start.

### Key Entities *(include if feature involves data)*

- **GameSession**: Represents a complete game from setup through terminal state. Tracks the current player, move history, consecutive pass count, and the underlying board state.
- **TurnResult**: Represents the outcome of a single turn — an accepted move, a forced pass, or game termination.
- **FinalScore**: The end-of-game tally showing the count of coins for each face and the determination of winner, loser, or draw.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can play a complete game from start to finish in the terminal without restarting the program.
- **SC-002**: The game correctly ends after two consecutive passes and displays the final score and winner within 1 second of the second pass.
- **SC-003**: When a player has no legal moves, the system automatically forces a pass and informs the player before the turn ends.
- **SC-004**: 100% of invalid moves entered by a player are rejected and the player is re-prompted without losing their turn.
- **SC-005**: The ASCII board is updated and visible after every move, showing all placed coins, their current faces, and drawn edges.

## Assumptions

- The CLI operates in single-terminal hotseat mode; both players use the same keyboard and screen.
- Players enter moves using single-letter commands for PLACE and JOIN, and the full word `PASS` for a pass: `P <coord> <face>` (e.g., `P A1 H`), `J <coord1> <coord2>` (e.g., `J A1 B2`), `PASS`.
- The canonical 7×7 grid and 12-coin supply from the CYCLES rules are used.
- The engine modules from prior sprints (core state, geometry, and move application) are stable and available.
- No networking, AI opponent, persistent save/load, or graphical UI is in scope for this feature.

## Clarifications

### Session 2026-05-21

- Q: What should the exact text command format be for each move type (PLACE, JOIN, PASS)? → A: Single-letter codes `P` and `J` for PLACE and JOIN, full word `PASS` for pass. (2026-05-21)
- Q: Can a player with legal moves voluntarily pass, or is passing strictly restricted to the no-legal-moves case? → A: Passing is only permitted when no legal moves exist. (2026-05-21)
- Q: How should the CLI determine the first player? → A: Random fair selection (e.g., coin flip) at startup, announced to the players. (2026-05-21)
