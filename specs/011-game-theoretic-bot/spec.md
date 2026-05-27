# Feature Specification: Game-Theoretic Bot

**Feature Branch**: `011-game-theoretic-bot`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "look at @cycles-game-theory.md lets make a spec to implement that into a replacement for the greedy ai"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Select Strategic Opponent (Priority: P1)

A player setting up a new game can choose a "Strategic" AI opponent that replaces the existing Greedy bot. The Strategic bot uses game-theoretic heuristics derived from the formal analysis of CYCLES to make stronger decisions in both placement and join phases.

**Why this priority**: This is the core deliverable — giving players access to a more challenging AI that applies principled strategy rather than simple one-move score maximization.

**Independent Test**: Start a new game, select "Strategic" opponent, play a complete match, and verify the bot never makes an illegal move and plays moves consistent with the documented heuristics.

**Acceptance Scenarios**:

1. **Given** the player is on the setup screen, **When** they view the opponent selector, **Then** they see "Strategic" as an option alongside "Human" and "Random" (replacing "Greedy").
2. **Given** the player has selected "Strategic" opponent and started a game, **When** it is the bot's turn, **Then** the bot makes a legal move within the configured delay.
3. **Given** a game against the Strategic bot, **When** the game reaches a terminal state, **Then** the bot has never made an illegal move or crashed.

---

### User Story 2 — Measurable Improvement Over Greedy (Priority: P2)

The Strategic bot must demonstrate a measurable win-rate advantage over the Greedy bot when the two play head-to-head over a large number of games with alternating starts.

**Why this priority**: Validates that the game-theoretic heuristics actually produce stronger play, not just different play. Without this, there is no evidence the replacement is an upgrade.

**Independent Test**: Run a 1,000-game head-to-head tournament between Strategic and Greedy with alternating starts. Verify Strategic wins strictly more games.

**Acceptance Scenarios**:

1. **Given** a head-to-head tournament of 1,000 games with alternating starts, **When** the tournament completes, **Then** the Strategic bot wins more games than it loses against Greedy.
2. **Given** the same tournament, **When** crashes or illegal moves are counted, **Then** the total is zero.

---

### User Story 3 — Heuristic Transparency for Developers (Priority: P3)

A developer or researcher can inspect the Strategic bot's source and see a clear mapping between each heuristic principle from the game-theoretic analysis and the code that implements it. This enables future tuning, debugging, and extension.

**Why this priority**: The game-theoretic analysis is a living document; the bot implementation should be maintainable and extensible as new insights are discovered.

**Independent Test**: Review the bot source code and verify that each major heuristic from the analysis (placement principles, join-phase rules, cycle evaluation, tempo reasoning) is explicitly labeled and logically isolated.

**Acceptance Scenarios**:

1. **Given** a developer reading the Strategic bot source, **When** they search for a named heuristic from the analysis document, **Then** they find a corresponding function or code block with a matching name or comment.
2. **Given** a mid-game state, **When** a developer queries the bot for its top-N candidate moves, **Then** they receive a ranked list with per-candidate heuristic scores for inspection.

---

### Edge Cases

- **What happens when no heuristic produces a clear favorite?** The bot falls back to Greedy-style one-move score maximization rather than making an arbitrary choice.
- **What happens when the bot is forced to make a move with Δσ ≤ 0?** The bot selects the least damaging move (minimizing score loss or maximizing future options) rather than crashing.
- **What happens in very late game states with only forced moves?** The bot applies exhaustive search for the final 2–3 moves when the remaining game tree is small enough.
- **How does the system handle a bot that takes too long?** A configurable timeout (default 5 seconds) triggers fallback to Greedy evaluation for that move.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The setup screen MUST offer "Strategic" as an opponent option and MUST no longer offer "Greedy".
- **FR-002**: The Strategic bot MUST be a pure, synchronous function from `GameState` to `Move` with no side effects.
- **FR-003**: The Strategic bot MUST evaluate placement moves using boundary-preference and center-avoidance heuristics for self-faced coins.
- **FR-004**: The Strategic bot MUST evaluate non-cycle JOIN moves using the Δσ algebra: strongly prefer +2 edges for the current player, avoid −2 edges unless forced, and treat 0 edges as neutral.
- **FR-005**: The Strategic bot MUST evaluate cycle-closing JOIN moves by the net swing `2(t − h)` and prefer cycles that enclose more opponent-faced coins than friendly-faced coins.
- **FR-006**: The Strategic bot MUST detect when both players lack a +2 non-cycle JOIN and, if placements remain available, defer JOINs to manipulate Phase-II tempo.
- **FR-007**: The Strategic bot MUST fall back to Greedy one-move score maximization when heuristics produce no clear preference.
- **FR-008**: The bot selection in the setup screen MUST remain accessible (touch targets ≥ 44×44 CSS pixels, visible focus, labels not color-only).
- **FR-009**: The system MUST support running head-to-head tournaments between any two bot strategies for regression testing.

### Key Entities *(include if feature involves data)*

- **StrategicBot**: The new bot function. Consumes `GameState`, returns `Move`. Internally composed of heuristic evaluators.
- **HeuristicEvaluator**: A named, composable scoring component that assigns a numeric score to a candidate move based on one game-theoretic principle (e.g., `BoundaryPlacementHeuristic`, `CycleCloseHeuristic`).
- **BotTournamentResult**: Aggregated statistics from a head-to-head run — wins, losses, draws, crashes, illegal moves.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a 1,000-game head-to-head tournament with alternating starts, the Strategic bot wins at least 55% of decisive games against Greedy (i.e., wins − losses > 0).
- **SC-002**: The Strategic bot completes every move in under 100ms on average and under 5,000ms in the worst case (measured on a mid-range development machine).
- **SC-003**: The Strategic bot makes zero illegal moves and causes zero crashes across 10,000 full-game simulations.
- **SC-004**: A developer can identify the code implementing each of the five major heuristic categories from the analysis document within 30 seconds of reading the source file.

## Assumptions

- The existing `GameState`, `Move`, and `applyMove` APIs remain stable; no engine changes are required beyond adding the new bot.
- The Greedy bot implementation is retained as a fallback strategy and for tournament comparison, but is removed from the UI selector.
- The game-theoretic analysis document (`cycles-game-theory.md`) is treated as authoritative but not infallible — heuristics may be tuned or partially overridden based on empirical tournament results.
- Phase-II exhaustive search is out of scope for this feature; the bot uses heuristics and limited lookahead rather than full game-tree solving.
- The bot does not learn or adapt across games; each move decision is stateless and deterministic (or deterministic given a fixed random seed for tie-breaking).
