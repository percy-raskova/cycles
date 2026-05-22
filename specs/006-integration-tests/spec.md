# Feature Specification: Integration Tests

**Feature Branch**: `006-integration-tests`  
**Created**: 2026-05-22  
**Status**: Draft  
**Input**: User description: "for now just integration tests. top level tests/ directory, all tests should be located here in a logical directory structure. chromium for now is fine. no visual regression needed. real intent is catching regressions and proving the game works as much as possible prior to trying to deploy it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Game Flow (Priority: P1)

As a developer preparing to deploy, I want to verify that a full game can be played from initial state through terminal state using the real game engine and React UI layer together, so that I can be confident the entire system works end-to-end before deployment.

**Why this priority**: This is the highest-value test. If a full game cannot complete, nothing else matters. It exercises PLACE, JOIN, PASS, terminal detection, and score computation in sequence.

**Independent Test**: Mount the interactive GamePage with the real engine, programmatically perform a sequence of moves (place coins, join coins, trigger passes), and assert that the game reaches a terminal state with a GameOverPanel showing the correct final score.

**Acceptance Scenarios**:

1. **Given** an initial game session, **When** a sequence of legal PLACE and JOIN moves are applied through the GamePage, **Then** the game eventually reaches a terminal state and renders the GameOverPanel with a score matching the engine's `computeFinalScore`.
2. **Given** a terminal game session, **When** the "New Game" button is clicked, **Then** a fresh game session starts with initial state, the GameOverPanel disappears, and the TurnIndicator shows the starting player.

---

### User Story 2 - Move Validation (Priority: P1)

As a developer maintaining the game, I want to verify that all move types (PLACE, JOIN, PASS) are correctly validated and applied through the UI layer, so that illegal moves are rejected without corrupting game state and legal moves produce correct state transitions.

**Why this priority**: Move validation is the core of the game. Regression here would break gameplay entirely. This story tests the contract between the UI's move-construction state machine and the engine's `step()` function.

**Independent Test**: Mount GamePage, attempt illegal moves (occupied placement, non-queen-line join, join through coin), assert they are rejected with appropriate feedback, then apply legal moves and assert state changes correctly.

**Acceptance Scenarios**:

1. **Given** an empty board, **When** a player attempts to place a coin on an occupied intersection, **Then** the placement is rejected and the turn does not switch.
2. **Given** two coins not on a queen line, **When** a player attempts to join them, **Then** the join is rejected, the edge does not appear, and illegal-move feedback is shown.
3. **Given** a game where the current player has legal moves, **When** a PASS move is attempted, **Then** the engine rejects it and the turn does not switch.
4. **Given** a game where the current player has no legal moves, **When** the auto-pass triggers, **Then** the turn passes correctly and the pass count increments.

---

### User Story 3 - Cycle Closure (Priority: P2)

As a developer, I want to verify that closing a cycle by joining two coins correctly flips all coins inside the cycle, so that this complex engine behavior is protected from regressions.

**Why this priority**: Cycle detection and interior coin flipping is the most complex engine behavior. It spans geometry (`findCycle`), polygon containment (`pointInPolygon`), and state mutation. A regression here would be hard to catch manually.

**Independent Test**: Construct a known board state with coins arranged in a square, join the final edge to close the cycle, assert that interior coins have flipped faces and endpoint coins have flipped.

**Acceptance Scenarios**:

1. **Given** four coins arranged in a square with three edges forming a U-shape, **When** the fourth edge is placed to close the cycle, **Then** all coins inside the square have flipped faces, the new edge appears, and endpoint coins have flipped.
2. **Given** a cycle-closing join, **When** the move is applied, **Then** the UI renders the `coin-flipping` CSS transition class on all flipped coins.

---

### User Story 4 - Auto-Pass Behavior (Priority: P2)

As a developer, I want to verify that the auto-pass mechanism triggers correctly when a player has no legal moves, so that the game progresses automatically without breaking the turn order.

**Why this priority**: Auto-pass involves a `useEffect` timer, the `hasLegalMoves` engine function, and UI state (notice display). It is susceptible to race conditions and regressions in the timer logic.

**Independent Test**: Construct a board state where the current player has no legal placements and no legal joins, mount GamePage, assert the notice appears, wait for the auto-pass delay, assert the turn has passed.

**Acceptance Scenarios**:

1. **Given** a board where the current player has no legal moves, **When** the game renders, **Then** the TurnIndicator displays a "no legal moves — passing" notice.
2. **Given** the auto-pass notice is displayed, **When** the auto-pass delay elapses, **Then** the turn switches to the other player, the notice disappears, and the pass count increments.
3. **Given** a terminal state (two consecutive passes), **When** the game renders, **Then** no auto-pass triggers, the GameOverPanel is displayed, and the TurnIndicator is hidden.

---

### User Story 5 - Component Coordination (Priority: P2)

As a developer, I want to verify that all UI components (BoardView, CoinView, GridView, TurnIndicator, GameOverPanel, FaceSelector) coordinate correctly through GamePage state changes, so that the UI remains consistent as the game progresses.

**Why this priority**: Each component is tested in isolation, but their coordination through props and callbacks is only tested in GamePage. Regressions in prop wiring or state lifting could cause silent UI failures.

**Independent Test**: Mount GamePage, progress through various game phases, assert that each component renders the correct data derived from the current GameSession.

**Acceptance Scenarios**:

1. **Given** a game in progress, **When** a coin is placed, **Then** the TurnIndicator updates to show the new current player and decremented coin count.
2. **Given** a game in progress, **When** a JOIN selection is active, **Then** the selected coin displays the `coin-selected` class and legal target coins display the `coin-highlighted` class.
3. **Given** a game in progress, **When** the mouse hovers over a legal empty intersection, **Then** the dot radius increases and the `grid-dot-legal` class is applied.
4. **Given** a game with the face selector open, **When** a face is selected, **Then** the FaceSelector disappears and the new coin appears on the board with the correct label.

---

### User Story 6 - New Game Reset (Priority: P3)

As a developer, I want to verify that clicking "New Game" after a terminal state fully resets all game and UI state, so that no stale state leaks between games.

**Why this priority**: State leaks between games would be a confusing bug. This ensures all `useState` hooks in GamePage are properly reset.

**Independent Test**: Play a game to completion, click New Game, assert all state (session, move phase, hover, flipping coins, notice) returns to initial values.

**Acceptance Scenarios**:

1. **Given** a terminal game with the GameOverPanel visible, **When** the "New Game" button is clicked, **Then** the GameOverPanel disappears, the board is empty, the TurnIndicator shows the starting player with 12 coins remaining, and no move phase is active.

---

### Edge Cases

- What happens when a move is attempted while a coin-flip animation is in progress?
- How does the system handle rapid consecutive clicks on the same intersection?
- What happens if the face selector is open and the user presses Escape?
- How does the system behave when all 12 coins are placed but no edges exist (only PLACE moves, no JOIN)?
- What happens when a player has exactly one legal move left — does auto-pass still trigger correctly?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The integration test suite MUST verify that a complete game can be played from initial state to terminal state through the GamePage component using the real game engine.
- **FR-002**: The integration test suite MUST verify that illegal PLACE moves (occupied intersection, out of coins) are rejected without mutating game state.
- **FR-003**: The integration test suite MUST verify that illegal JOIN moves (non-queen line, edge intersection, passes through coin, already connected) are rejected with visual feedback.
- **FR-004**: The integration test suite MUST verify that cycle-closing JOIN moves correctly flip all interior coins and endpoint coins.
- **FR-005**: The integration test suite MUST verify that the auto-pass mechanism triggers when a player has no legal moves, displays a notice, and applies a PASS move after a brief delay.
- **FR-006**: The integration test suite MUST verify that the GameOverPanel appears when the session reaches terminal state (two consecutive passes or no legal moves for both players).
- **FR-007**: The integration test suite MUST verify that the "New Game" button resets all game and UI state to initial values.
- **FR-008**: The integration test suite MUST verify that all interactive components (BoardView, CoinView, GridView, TurnIndicator, FaceSelector, GameOverPanel) reflect the current GameSession state after each move.
- **FR-009**: The integration test suite MUST verify that coin-flip animations are triggered after cycle-closing or standard JOIN moves, and that input is blocked during the animation.

### Key Entities

- **GamePage**: The top-level integration point. Orchestrates GameSession, MovePhase, hover state, and flip animations. All integration tests mount this component.
- **GameSession**: The canonical game state from the engine. Integration tests use the real `createSession` and `step` functions — no mocking.
- **MovePhase**: The UI's ephemeral move-construction state (IDLE, SELECTING_FACE, SELECTING_SECOND_COIN). Integration tests verify transitions between phases.
- **Test Suite**: A collection of integration tests organized in a logical directory structure under `tests/`, grouped by user story or concern.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every user story (P1-P3) has at least one integration test that exercises the real engine and UI together, with no mocked engine functions.
- **SC-002**: All integration tests complete in under 30 seconds total execution time.
- **SC-003**: The integration test suite covers at least 80% of the UI component interaction paths (click handlers, hover handlers, state transitions).
- **SC-004**: A regression in any core game rule (placement, join validation, cycle detection, scoring) is caught by at least one failing integration test.
- **SC-005**: The test directory structure is intuitive enough that a new developer can locate the relevant test for a given bug within 60 seconds.

## Clarifications

### Session 2026-05-22

- **Q**: Should integration tests use fake timers or real timers for testing auto-pass and flip animations? → **A**: Fake timers (`vi.useFakeTimers()`) — deterministic, fast, no flakiness. Real timing validation belongs in E2E (future sprint).
- **Q**: How should the `tests/` directory be organized? → **A**: By test type — `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/contract/`. Integration tests live in `tests/integration/` with files named by user story concern (e.g., `game-flow.test.ts`, `move-validation.test.ts`).
- **Q**: How should integration tests build non-initial board states? → **A**: Engine fixtures — use `placeCoin`/`joinCoins` directly to build state, then mount GamePage with a pre-built session via a test helper. UI-only setup for initial-state tests.

## Assumptions

- Integration tests will run in a jsdom environment using React Testing Library, not a real browser.
- The game engine (`src/core/`) is already fully unit-tested and will not be modified by this feature.
- No visual regression or screenshot comparison is required; tests verify DOM state and attributes, not pixel rendering.
- Playwright or other E2E tooling is explicitly out of scope for this feature; it may be added in a future sprint.
- The existing UI component tests in `src/ui/components/__tests__/` remain in place; integration tests live in a separate top-level `tests/` directory.
- All timer-dependent behavior (auto-pass delay, flip animation duration) is tested using fake timers to keep execution fast and deterministic.
