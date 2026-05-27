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

- **What happens when the 3-ply minimax search exceeds the time budget?** A configurable move timeout (default 2,000ms) triggers an early cutoff: the bot returns the best move found so far, or falls back to Greedy one-move evaluation if no search has completed.
- **What happens in very late game states with only forced moves?** When the remaining game tree is small enough (≤ 200 leaf nodes), the bot switches from 3-ply minimax to full exhaustive search to guarantee optimal play for the endgame.
- **What happens when the bot is forced to make a move with Δσ ≤ 0?** The 3-ply search naturally discovers this through minimax; if all leaf evaluations are negative, the bot picks the move with the least bad minimax value.
- **What happens when no heuristic produces a clear favorite at the leaf?** The leaf evaluation falls back to Greedy-style one-move score maximization, so the minimax search still has a valid gradient.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The setup screen MUST offer "Strategic" as an opponent option and MUST no longer offer "Greedy".
- **FR-002**: The Strategic bot MUST be a pure, synchronous, deterministic function from `GameState` to `Move` with no side effects. Tie-breaking between equal total scores is deterministic: prefer cycle-closing JOINs, then non-cycle JOINs, then PLACEs; within the same move type, prefer the lexicographically smallest position key.
- **FR-003**: The Strategic bot MUST evaluate placement moves using boundary-preference and center-avoidance heuristics for both face choices at each empty position, and select the face with the higher heuristic score.
- **FR-004**: The Strategic bot MUST evaluate non-cycle JOIN moves using the Δσ algebra: strongly prefer +2 edges for the current player, avoid −2 edges unless forced, and treat 0 edges as neutral.
- **FR-005**: The Strategic bot MUST evaluate all candidate moves via a 3-ply minimax search with alpha–beta pruning. The evaluation function at leaf nodes is the weighted-sum heuristic suite (FR-003–FR-006). Cycle-closing moves are therefore evaluated as `Δσ_close + v(successor_subgame)` where `v` is the heuristic leaf evaluation.
- **FR-006**: The Strategic bot MUST detect when both players lack a +2 non-cycle JOIN and, if placements remain available, defer JOINs to manipulate Phase-II tempo.
- **FR-007**: The Strategic bot MUST combine heuristic scores via a weighted sum with fixed, empirically-tuned weights. The move with the highest total score is selected.
- **FR-008**: The Strategic bot MUST fall back to Greedy one-move score maximization when all heuristic scores are zero (no heuristic produces a non-neutral evaluation).
- **FR-009**: The bot selection in the setup screen MUST remain accessible (touch targets ≥ 44×44 CSS pixels, visible focus, labels not color-only).
- **FR-010**: The system MUST support running head-to-head tournaments between any two bot strategies for regression testing.
- **FR-011**: The Strategic bot module MUST export a `inspectTopMoves(state, n)` function that returns the top-N candidate moves with per-heuristic score breakdowns, without mutating state.

### Key Entities *(include if feature involves data)*

- **StrategicBot**: The new bot function. Consumes `GameState`, returns `Move`. Internally composed of heuristic evaluators.
- **HeuristicEvaluator**: A named, composable scoring component that assigns a numeric score to a candidate move based on one game-theoretic principle (e.g., `BoundaryPlacementHeuristic`, `CycleCloseHeuristic`).
- **BotTournamentResult**: Aggregated statistics from a head-to-head run — wins, losses, draws, crashes, illegal moves.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a 1,000-game head-to-head tournament with alternating starts, the Strategic bot wins at least 55% of decisive games against Greedy (i.e., wins − losses > 0).
- **SC-002**: The Strategic bot completes every move in under 100ms on average and under 2,000ms in the worst case (measured on a mid-range development machine). The 2,000ms worst-case bound aligns with the move-timeout fallback.
- **SC-003**: The Strategic bot makes zero illegal moves and causes zero crashes across 10,000 full-game simulations.
- **SC-004**: A developer can identify the code implementing each of the five major heuristic categories from the analysis document within 30 seconds of reading the source file.

## Clarifications

### Session 2026-05-27

- **Q1**: How should multiple heuristics combine into a single move ranking?  
  **A**: Weighted sum (Option B). Each heuristic assigns a numeric score to every candidate move; scores are multiplied by fixed weights and summed. The move with the highest total wins. Tie-breaking is deterministic (stable sort by move type, then position key).
- **Q2**: Should the Strategic bot evaluate cycle-closing moves with any lookahead beyond the immediate swing?  
  **A**: Full 3-ply minimax with alpha–beta pruning (Option C). All move types are searched to fixed depth 3; leaf nodes are scored with the weighted-sum heuristic suite. In very late game states where the remaining tree is small enough, the bot switches to exhaustive search instead.
- **Q3**: How should the heuristic weights be determined?  
  **A**: Hand-tuned with manual iteration (Option B). Start with analysis-informed defaults; refine by running head-to-head tournaments against Greedy and observing win-rate changes. Final weights are documented as code constants.
- **Q4**: Should the Strategic bot ever voluntarily place an opponent-faced coin?  
  **A**: Self-face default with exceptions (Option B). The bot evaluates both faces for every empty position and chooses the one with the higher heuristic score. Opponent-faced placements are rare and require a positive net heuristic score.
- **Q5**: Should the Strategic bot export a developer-facing API that returns the top-N ranked moves with per-move heuristic breakdowns?  
  **A**: Yes, as a separate exported function (Option A). Export a `strategicBot.inspectTopMoves(state, n)` function that returns the top-N candidate moves with their total scores and per-heuristic breakdowns, without mutating state.

## Assumptions

- The existing `GameState`, `Move`, and `applyMove` APIs remain stable; no engine changes are required beyond adding the new bot.
- The Greedy bot implementation is retained as a fallback strategy and for tournament comparison, but is removed from the UI selector.
- The game-theoretic analysis document (`cycles-game-theory.md`) is treated as authoritative but not infallible — heuristics may be tuned or partially overridden based on empirical tournament results.
- Phase-II exhaustive search is used only when the remaining game tree is small enough (≤ 200 leaf nodes); otherwise the bot relies on 3-ply minimax with heuristics rather than full game-tree solving.
- The bot does not learn or adapt across games; each move decision is stateless and deterministic given the same evaluation weights and search depth.
