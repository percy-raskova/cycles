# Feature Specification: Baseline AI Opponents

**Feature Branch**: `010-baseline-bots`  
**Created**: 2026-05-25  
**Status**: Draft  
**Input**: User description: "Random and greedy opponents. Two baseline bots, both stateless functions (state) → move. Random picks uniformly from legal moves. Greedy picks the move maximizing immediate score delta (including encirclement payoff, which makes greedy non-trivial). These exist primarily as sparring partners for the MCTS sprint, but they're also useful difficulty levels. Exit criteria: random and greedy both play complete legal games against each other 1000 times with zero crashes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play Against Random Bot (Priority: P1)

A player wants to practice against a simple, unpredictable opponent. They select "Random" as the opponent difficulty, choose whether to play as Player 1 or Player 2, and play a complete game of Cycles.

**Why this priority**: The Random bot is the simplest baseline opponent and provides immediate value as an easy difficulty level. It requires no strategic evaluation, making it the fastest to implement and most reliable.

**Independent Test**: Can be fully tested by selecting the Random opponent from the difficulty menu, choosing a player role, playing a game to completion, and verifying the bot never makes an illegal move.

**Acceptance Scenarios**:

1. **Given** a new game setup screen with "Random" opponent selected, **When** the player chooses their role (P1 or P2) and starts the game, **Then** the match begins with the correct player assignment.
2. **Given** a game with "Random" opponent where it is the bot's turn, **When** the bot selects a move, **Then** it makes a legal move within 100ms.
3. **Given** the bot has multiple legal moves available, **When** it selects a move over many games, **Then** each legal move is chosen with roughly equal frequency (uniform distribution).
4. **Given** a game against the Random bot, **When** the game reaches a terminal state, **Then** the game ends cleanly with a winner declared.

---

### User Story 2 - Play Against Greedy Bot (Priority: P2)

A player wants a more challenging opponent that makes tactically sound decisions. They select "Greedy" as the opponent difficulty, choose whether to play as Player 1 or Player 2, and play a complete game.

**Why this priority**: The Greedy bot adds meaningful strategic depth beyond random play while remaining computationally lightweight. It serves as a stepping-stone difficulty between Random and future MCTS-based opponents.

**Independent Test**: Can be fully tested by selecting the Greedy opponent, choosing a player role, playing multiple games, and observing that the bot consistently makes moves that improve its score or block the player.

**Acceptance Scenarios**:

1. **Given** a new game setup screen with "Greedy" opponent selected, **When** the player chooses their role (P1 or P2) and starts the game, **Then** the match begins with the correct player assignment.
2. **Given** a game state where the Greedy bot can capture a coin on its turn, **When** the bot evaluates its options, **Then** it selects a move that results in the highest immediate score increase.
3. **Given** a game state where the Greedy bot can complete a cycle, **When** the bot evaluates its options, **Then** it accounts for encirclement payoff (coins flipped) in its score calculation.
4. **Given** multiple moves with the same score delta, **When** the bot chooses among them, **Then** it breaks ties deterministically using a stable evaluation order.

---

### User Story 3 - Bot vs Bot Simulation (Priority: P3)

A developer wants to validate bot stability and game engine correctness by running automated simulations. They initiate a headless match between Random and Greedy bots.

**Why this priority**: Automated simulation provides regression testing for both the bots and the underlying game engine. It is required as an exit criterion and supports the MCTS development sprint by providing a stable testing harness.

**Independent Test**: Can be fully tested by running a headless simulation script that pits Random against Greedy and reports game outcomes.

**Acceptance Scenarios**:

1. **Given** 1000 simulated games between Random and Greedy with starting players alternated evenly, **When** all games are executed sequentially, **Then** zero crashes, exceptions, or illegal moves occur.
2. **Given** the results of 1000 head-to-head games with balanced starting players, **When** win rates are compared, **Then** Greedy wins more often than Random.
3. **Given** a bot-versus-bot simulation, **When** each game completes, **Then** the game state remains valid and the move history contains only legal moves.

---

### Edge Cases

- What happens when the bot has no legal moves remaining? The game should recognize the terminal condition and end.
- How does the Greedy bot handle moves that result in the same score delta but different board positions? Tie-breaking is deterministic (first in top-left-to-bottom-right evaluation order), so tests must account for this fixed behavior.
- What happens if the game state passed to the bot is invalid or corrupted? The bot MUST throw an Error (per FR-011) so the caller can treat it as a crash.
- How does the Greedy bot behave when all moves result in a negative score delta? It should still select the least harmful legal move.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Random bot MUST select uniformly from all legal moves available in the current game state.
- **FR-002**: The Greedy bot MUST evaluate every legal move and select the one that maximizes the immediate score delta for the current player.
- **FR-003**: The Greedy bot MUST include encirclement payoff (coins flipped by completing a cycle) in its move evaluation.
- **FR-004**: Both bots MUST be implemented as stateless functions that accept a game state and return a single legal move.
- **FR-005**: Neither bot MUST ever propose or execute an illegal move.
- **FR-006**: Both bots MUST complete their move selection within 100ms on standard hardware.
- **FR-007**: The opponent-selection UI MUST present three options: Human (local two-player), Random bot, and Greedy bot.
- **FR-008**: A headless simulation harness MUST support running complete games between any two bot instances without UI interaction.
- **FR-009**: Tie-breaking for the Greedy bot when multiple moves yield the same score delta MUST be deterministic, selecting the first legal move in a stable top-left-to-bottom-right evaluation order.
- **FR-010**: When starting a game against a bot opponent, the UI MUST allow the human player to choose whether they play as Player 1 or Player 2.
- **FR-011**: If a bot function is called with an invalid or corrupted `GameState`, it MUST throw an Error rather than return an illegal move.

### Key Entities *(include if feature involves data)*

- **Bot**: A stateless decision function characterized by a strategy type (random or greedy), a legal move generator, and (for greedy) a scoring evaluator.
- **Game State**: The complete representation of the current match including board configuration, placed edges, coin ownership, current player, scores, and remaining coins.
- **Score Delta**: The difference in the current player's score before and after applying a candidate move, including points from direct coin captures and encirclement payoffs.
- **Simulation Harness**: A headless runner that initializes games, invokes bots alternately, and validates game integrity across many iterations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Random and Greedy bots play 1,000 complete legal games against each other with zero crashes, exceptions, or invalid moves.
- **SC-002**: Both bots return a valid move within 100 milliseconds on standard development hardware.
- **SC-003**: In head-to-head play, the Greedy bot wins strictly more games than the Random bot over a 1,000-game sample.
- **SC-004**: Players can select either bot as an opponent, choose their player role (P1 or P2), and complete a full match without errors.
- **SC-005**: Automated simulation completes 1,000 games in under 60 seconds total.

## Clarifications

### Session 2026-05-25

- **Q: Greedy Bot Tie-Breaking Strategy?** → **A: Deterministic** — always pick the first legal move in a stable evaluation order (top-left to bottom-right scan). This ensures reproducible tests and consistent bot behavior.
- **Q: Head-to-Head Simulation Fairness?** → **A: Alternate** — 500 games with Greedy as Player 1, 500 as Player 2, to control for first-mover advantage and ensure SC-003 measures actual strategy strength.
- **Q: Human Player Role Assignment?** → **A: Choosable** — the UI allows the human to select whether they play as Player 1 or Player 2 before the match starts when facing a bot opponent.

## Assumptions

- The game state passed to bots contains complete, correct information about the current match.
- The same game state interface used by the React UI will be consumed by the bots, ensuring engine purity is maintained.
- Legal move generation is already available and correct from prior engine work.
- Score calculation (including encirclement payoff) is already implemented and correct from prior engine work.
- No persistent bot memory or learning is required; bots are strictly stateless per-move deciders.
- Difficulty selection UI elements (menu, buttons, labels) will reuse existing UI patterns from the application.
