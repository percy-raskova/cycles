# Feature Specification: React Interactivity — Browser Gameplay

**Feature Branch**: `005-react-interactivity`
**Created**: 2026-05-22
**Status**: Draft
**Input**: User description: "Sprint 5: React interactivity — input and move construction. Click an empty intersection to PLACE (with a face selector), click two coins in sequence to JOIN. Hover states showing legal moves. Animate flips. This is where most projects sprawl; resist. The engine already knows what's legal — the UI's only job is to call applyMove and re-render. Exit criteria: a human can play a full game in the browser."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Place a Coin (Priority: P1)

As a player, I want to click an empty grid intersection, choose heads or tails, and place a coin so I can make a PLACE move.

**Why this priority**: PLACE is the most common move type and the primary way the board changes. Without it, the game cannot begin.

**Independent Test**: Can be fully tested by loading the game page, clicking an empty intersection, selecting a face, and asserting the coin appears at the correct position with the correct face.

**Acceptance Scenarios**:

1. **Given** an empty board with HEADS to move, **When** I click an empty intersection, **Then** a face selector appears allowing me to choose heads or tails.
2. **Given** the face selector is open, **When** I select heads, **Then** the coin is placed at the clicked intersection with face heads, the current player switches to TAILS, and the coins-remaining count decrements.
3. **Given** a board with no coins remaining, **When** I click an empty intersection, **Then** no face selector appears and no coin is placed.

---

### User Story 2 - Join Two Coins (Priority: P1)

As a player, I want to click one coin and then a second coin to create a JOIN edge so I can build the planar graph structure.

**Why this priority**: JOIN is the second primary move type and defines the game's topology. Without it, encirclement and scoring cannot occur.

**Independent Test**: Can be fully tested by loading the game page, clicking a coin (first selection), clicking a second coin, and asserting an edge appears between them.

**Acceptance Scenarios**:

1. **Given** a board with at least two coins, **When** I click a first coin, **Then** it is highlighted as the start of a JOIN.
2. **Given** a first coin is selected, **When** I click a second coin that forms a legal JOIN, **Then** an edge appears connecting the two coins, the first coin is deselected, and the current player switches.
3. **Given** a first coin is selected, **When** I click a second coin that forms an illegal JOIN (non-queen-line or blocked), **Then** no edge is created, the first coin remains selected, and a brief visual feedback indicates the move was rejected.
4. **Given** a first coin is selected, **When** I click the same coin again or press Escape, **Then** the selection is cancelled and no JOIN is attempted.

---

### User Story 3 - Hover States for Legal Moves (Priority: P2)

As a player, I want to see which moves are legal before I click so I can plan my turn without trial and error.

**Why this priority**: Legal-move feedback dramatically improves usability. However, the game is playable without it, so it is P2.

**Independent Test**: Can be fully tested by hovering over empty intersections and coins and asserting that legal targets are visually distinguished from illegal ones.

**Acceptance Scenarios**:

1. **Given** it is my turn with legal placements available, **When** I hover over an empty intersection that is a legal placement, **Then** the intersection is highlighted (e.g., larger dot or ring) to indicate it is a valid target.
2. **Given** it is my turn with legal placements available, **When** I hover over an empty intersection that is not a legal placement, **Then** no special highlight appears.
3. **Given** I have selected a first coin for a JOIN, **When** I hover over a second coin that forms a legal JOIN, **Then** the second coin is highlighted and a preview line appears connecting the two coins.
4. **Given** I have selected a first coin for a JOIN, **When** I hover over a second coin that forms an illegal JOIN, **Then** no preview line appears and the second coin is not highlighted as a valid target.

---

### User Story 4 - Animate Coin Flips (Priority: P2)

As a player, I want to see coins visually flip when they are captured inside a cycle so I can understand what changed on the board.

**Why this priority**: Coin flips are the most dramatic game event. Visual feedback makes the cause-and-effect of cycle closure obvious. However, the game logic is correct without animation, so this is P2.

**Independent Test**: Can be fully tested by constructing a PLACE move that closes a cycle, then asserting that coins inside the cycle briefly animate (e.g., fill color transition) to show their new face.

**Acceptance Scenarios**:

1. **Given** a board where a PLACE move will close a cycle containing coins of the opposite face, **When** the PLACE move is applied, **Then** the captured coins briefly animate to show their face flipping from heads to tails or vice versa.
2. **Given** a board where a PLACE move does not close a cycle, **When** the move is applied, **Then** no coin flip animation occurs.
3. **Given** a flip animation is in progress, **When** the player attempts another move, **Then** the move is queued or ignored until the animation completes.

---

### User Story 5 - Play a Full Game to Completion (Priority: P1)

As a player, I want the game to handle turns, passes, and terminal detection automatically so I can play a complete game from start to finish without restarting.

**Why this priority**: This is the exit criteria for the sprint. The game must be playable end-to-end.

**Independent Test**: Can be fully tested by playing through a full game (PLACE, JOIN, PASS as needed) until two consecutive passes occur, then asserting the final score is displayed.

**Acceptance Scenarios**:

1. **Given** a game in progress, **When** the current player has no legal moves, **Then** a PASS button appears (or the turn is auto-passed) and the player indicator updates.
2. **Given** the current player has legal moves, **When** they attempt to click the PASS button, **Then** the pass is rejected with feedback that legal moves are still available.
3. **Given** two consecutive passes have occurred, **When** the second pass is applied, **Then** the game ends, the board is locked from further input, and the final score (heads count, tails count, winner/draw) is displayed.
4. **Given** the game has ended, **When** the player clicks a "New Game" button, **Then** a fresh board is initialized and play restarts.

---

### Edge Cases

- What happens when the player clicks rapidly during an animation? → Input is ignored or queued until animation completes.
- What happens when the player refreshes the page mid-game? → The game state is lost; no persistence is required for this sprint.
- What happens when a coin is placed on a touch device? → Tap behaves the same as click; face selector appears on tap.
- What happens when the board is completely filled with coins but no edges? → JOIN moves are impossible; the player must PASS.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Clicking an empty grid intersection MUST open a face selector (heads/tails) if the current player has legal placements remaining.
- **FR-002**: Selecting a face from the selector MUST construct a `PlaceMove` and apply it via the engine's `applyMove` function.
- **FR-003**: Clicking a coin MUST select it as the start of a JOIN. Clicking a second coin MUST construct a `JoinMove` and apply it via `applyMove`.
- **FR-004**: Clicking the same coin twice or pressing Escape MUST cancel the JOIN selection.
- **FR-005**: If `applyMove` returns an error (illegal move), the UI MUST show brief visual feedback and MUST NOT change the board state.
- **FR-006**: Hovering over an empty intersection that is a legal placement MUST highlight the intersection.
- **FR-007**: Hovering over a coin when a first coin is selected for JOIN MUST show a preview line if the join is legal.
- **FR-008**: When a PLACE move closes a cycle, coins inside the cycle MUST briefly animate to show their face flipping.
- **FR-009**: A PASS button MUST be available when the current player has no legal moves, and MUST be disabled when legal moves exist.
- **FR-010**: After two consecutive passes, the game MUST end, input MUST be disabled, and the final score MUST be displayed.
- **FR-011**: A "New Game" button MUST reset the board to initial state.

### Key Entities

- **GamePage**: The interactive game page. Manages game session state (via `GameSession` from Sprint 3), move construction state machine, and renders `BoardView`.
- **BoardView** (extended): Accepts `onCoinClick`, `onIntersectionClick`, `hoveredPosition`, `selectedCoin`, and `previewEdge` props for interactivity.
- **CoinView** (extended): Accepts `onClick`, `isSelected`, `isHighlighted`, and `isFlipping` props.
- **FaceSelector**: A small modal or inline component for choosing heads/tails when placing a coin.
- **MoveBuilder**: Internal state machine tracking the current move construction phase (IDLE, SELECTING_FACE, SELECTING_SECOND_COIN).
- **TurnIndicator**: Displays current player, coins remaining, and pass button state.
- **GameOverPanel**: Displays final score and "New Game" button when terminal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A human can play a complete game from initial state to terminal state (two consecutive passes) using only mouse clicks (or taps) in the browser.
- **SC-002**: Illegal move attempts (clicking occupied intersection, invalid JOIN) are rejected with visual feedback within 100ms of the click.
- **SC-003**: Coin flip animations complete within 500ms and are visually distinguishable from instantaneous state changes.
- **SC-004**: Hover state feedback updates within 50ms of mouse movement.
- **SC-005**: The game state remains consistent after every move — no phantom coins, no missing edges, no incorrect player alternation.

## Assumptions

- The existing read-only SVG renderer from Sprint 4 is the visual foundation; interactivity is added by extending those components with event handlers.
- The engine (`src/core/session.ts` `step` function, `applyMove` from `src/core/move.ts`) is the sole authority on move legality. The UI does not duplicate validation logic.
- Animations are implemented with CSS transitions only; no animation libraries are introduced.
- Game state is not persisted across page reloads; a refresh starts a new game.
- Touch input (mobile/tablet) is supported via the same click/tap handlers; no separate gesture system is built.
- No AI opponent, no network multiplayer, no undo/redo, no move history replay — these are "future work."
