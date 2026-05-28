# Feature Specification: Player & Game-Driver Abstraction

**Feature Branch**: `012-player-game-driver`  
**Created**: 2026-05-27  
**Status**: Draft  
**Input**: User description: "Introduce a single load-bearing abstraction — a *player* that binds a board slot (HEADS/TAILS) to an asynchronous `selectMove(session)` — plus a *game driver* that loops: ask the current player for a move, validate and apply it through the existing engine, repeat until terminal. The same driver runs identically in the browser, a command-line session, a headless test, or a future server runtime. The engine itself already exposes everything needed (`step`, `hasLegalMoves`, `legalPlacements`/`legalJoins`, `serializeSession`/`deserializeSession`, immutable session state); this feature adds orchestration only. Concrete players: human (move from UI/CLI input) and CPU (existing bots) now; remote/MCP players plug into the same seam later without engine changes."

## User Scenarios & Testing *(mandatory)*

> Personas: the **end player** (whose on-screen experience must not change) and the **integrator/developer** (who consumes the new orchestration surface to run games in new contexts).

### User Story 1 - Browser human-vs-CPU game runs on the unified driver, with no visible change (Priority: P1)

A player opens the web app and plays a full game against the CPU opponent exactly as before — placing coins, joining coins, watching flips animate, seeing the "bot thinking" indicator, getting an automatic pass when they have no legal moves, undoing, resetting, and reaching a game-over screen. Internally, every move (theirs and the CPU's) now flows through one turn driver instead of the current split path (a human click channel plus a separate bot-turn branch).

**Why this priority**: This is the single load-bearing change. Routing the *real* consumer (the live web game) through the driver is what proves the abstraction is correct and complete. Until this works with zero user-visible regression, nothing else can safely depend on it.

**Independent Test**: Play a complete browser game (and run the existing UI/integration/e2e suites) against the CPU; confirm identical outcomes, identical interaction flow, and identical visual feedback to the pre-refactor build.

**Acceptance Scenarios**:

1. **Given** a new human-vs-CPU game, **When** the human commits a legal placement or join, **Then** the move is applied, any flips animate, and the turn passes to the CPU — exactly as today.
2. **Given** it is the CPU's turn, **When** the CPU is computing, **Then** the "thinking" indicator shows for the same perceived duration and the CPU's move is then applied automatically.
3. **Given** the current player has no legal moves, **When** their turn begins, **Then** the game shows the auto-pass notice and passes automatically without asking anyone to choose a move.
4. **Given** a game in progress, **When** the human undoes or starts a new game while the CPU is thinking, **Then** the pending CPU move is discarded and the board reflects the rewound/new state with no stale move applied.
5. **Given** a game reaches its end (two consecutive passes), **When** the final move resolves, **Then** the game-over screen shows the same winner and score the engine computes.

---

### User Story 2 - Run a complete game headlessly between two programmatic players (Priority: P2)

A developer runs a full game between two programmatic players — for example CPU-vs-CPU for benchmarking, or a scripted move list vs. a CPU — in a plain Node test or the command-line tool, with no browser, DOM, or UI. The driver plays the game to completion and reports the final winner, score, and full move history.

**Why this priority**: Proves the driver runs identically *off* the browser (the "Node test / CLI / server" promise) and lets the command-line tool reuse the one driver instead of carrying its own loop. Unlocks automated bot-vs-bot evaluation through the same code path players use.

**Independent Test**: In a Node test, construct two programmatic players, drive a game to terminal, and assert the winner/score/history equal what the engine produces for the same move sequence — with no UI rendering involved.

**Acceptance Scenarios**:

1. **Given** two CPU players bound to opposite slots, **When** the driver runs to completion, **Then** it reaches a terminal session and reports a winner and score consistent with the engine.
2. **Given** a player that has no legal moves on its turn, **When** the driver reaches that turn, **Then** it passes automatically and continues, without requesting a move.
3. **Given** the same starting session and the same sequence of player moves, **When** the game is driven twice, **Then** both runs produce identical terminal results (deterministic given deterministic players).

---

### User Story 3 - A new move-source plugs in without touching the engine or driver (Priority: P3)

A developer adds a new kind of move-source — standing in for a future networked/remote opponent or an MCP tool-call opponent — purely by implementing the player contract. The driver, the engine, and the existing human/CPU players are not modified. In this feature the new kind is a **test-double asynchronous player** that resolves its move only after an awaited external signal, demonstrating that move-sources delivering moves asynchronously (over time, from elsewhere) work through the unchanged driver.

**Why this priority**: This extensibility *is* the point of the abstraction — it is the internal API surface. Real network and MCP transports are deferred, so the seam is validated now with a test double; building the actual transports is future work that will plug into this same contract.

**Independent Test**: Implement a fake async player that resolves a move when an external promise settles, run a full game with it through the existing driver, and confirm the change set touches only the new player and its test — no edits to the driver, engine, or existing players.

**Acceptance Scenarios**:

1. **Given** a player whose move resolves asynchronously after an external signal, **When** it is the player's turn, **Then** the driver awaits the move and applies it once available, leaving turn order and results correct.
2. **Given** the new player is added, **When** the repository diff is inspected, **Then** no modification to the driver, engine, or existing players was required to support it.
3. **Given** an async player whose move selection fails (rejects/throws), **When** that turn is taken, **Then** the failure is surfaced and the session state is not corrupted.

---

### Edge Cases

- **Forced pass**: when the current slot has no legal moves, the driver advances by passing automatically and does **not** request a move from that slot's player.
- **Illegal move from a player**: the driver does not advance; it surfaces the rejection and re-requests a move from the same player. A programmatic player that only ever returns illegal moves triggers a bounded, loud failure — never an infinite loop.
- **Already-terminal session**: the driver never requests a move once the engine reports the game is over.
- **Cancellation mid-turn**: a turn in progress (a human awaiting input, a CPU computing, an async player awaiting a signal) can be aborted; an aborted move is never applied — including across undo, reset/new-game, and teardown.
- **Undo/rewind**: after the session rewinds, the driver resumes by asking whichever player owns the now-current turn.
- **Same player kind on both slots** (e.g., CPU vs CPU, or two async players): the driver still alternates strictly by the engine's current slot.
- **Move-selection failure** (e.g., a future remote disconnect, a bot error): surfaced to the embedder without corrupting or advancing session state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define a single move-source abstraction that binds one board slot (HEADS or TAILS) to a means of producing that slot's next move, where the move is produced **asynchronously** (it may arrive immediately or after awaiting external input).
- **FR-002**: The system MUST provide a turn driver that, given a starting session and one player bound to each slot, repeatedly (a) asks the current slot's player for a move, (b) validates and applies it through the existing engine, and (c) continues until the engine reports a terminal session.
- **FR-003**: The driver MUST derive whose turn it is from the engine's session state, never from an independent turn counter, so turn order always matches the canonical rules.
- **FR-004**: When the current slot has no legal moves, the driver MUST advance the turn by passing automatically, WITHOUT requesting a move from that slot's player.
- **FR-005**: When a player supplies a move the engine rejects, the driver MUST NOT advance the turn; it MUST surface the rejection and request another move from the same player, up to a bounded number of attempts.
- **FR-006**: The driver MUST stop exactly when the engine reports the session is terminal, and MUST expose a final result (winner and score) consistent with the engine's own computation.
- **FR-007**: The driver MUST be cancellable: an in-progress turn can be aborted, and a move produced by an aborted turn MUST NOT be applied to the session.
- **FR-008**: A human player MUST produce its move from externally supplied input (a UI interaction sequence or a command-line entry); the move reaches the driver when the human commits it.
- **FR-009**: A CPU player MUST produce its move by delegating to the existing bot strategies (random, greedy, strategic) with NO change to those strategies' decision logic.
- **FR-010**: The abstraction MUST allow a new player kind to be added solely by implementing the player contract, with NO modification to the driver, the engine, or existing players; this MUST be demonstrated this feature by a test-double asynchronous player.
- **FR-011**: The browser human-vs-CPU game MUST be driven through this driver, and its observable behavior — move placement/joining, flip animation, "thinking" indicator, auto-pass notice, undo, reset/new-game, and game-over result — MUST remain identical to the pre-refactor experience.
- **FR-012**: A complete game MUST be runnable headlessly (no UI, no DOM, no rendering layer) between two programmatic players, producing the same terminal result the engine would for the same move sequence.
- **FR-013**: The move-source abstraction, the driver, and the players that perform no input/output (CPU, and the move-delivery primitive shared by human players) MUST run unchanged across environments — browser, command line, headless test, and a future server runtime — i.e., they MUST NOT depend on any UI rendering or browser-only capability.
- **FR-014**: Every loop introduced by this feature MUST be bounded (the game terminates under the engine's finite coin/turn limits; illegal-move retries are finite). It MUST be impossible for the driver to loop forever.
- **FR-015**: This feature MUST NOT change any game rule or the engine's move-validation, scoring, or terminal logic; it adds orchestration only.

### Key Entities

- **Player (move-source / participant)**: One side of a game. Holds the slot it plays (HEADS or TAILS) and a way to produce that slot's next move given the current session, returning the move asynchronously. Concrete kinds in scope: **human** (move from external UI/CLI input) and **CPU** (delegates to existing bots). Forward-looking kinds (remote/network, MCP tool-call) implement the same contract later. *(Note: the engine already exports a `Player` type meaning the HEADS/TAILS slot; the new participant concept must be named to avoid colliding with it — see Assumptions.)*
- **Game Driver**: The turn orchestrator. Given a session and one player per slot, runs ask → validate → apply → repeat to terminal, owning forced-pass, illegal-move retry, cancellation, and final-result reporting. It observes/emits session updates so an embedder (web UI, CLI, future server) can render or broadcast each step.
- **Human input channel**: The mechanism by which an external actor (a completed UI move gesture, a CLI line) hands a committed move to a human player that the driver is awaiting.
- **Engine session & move types (existing, unchanged)**: The immutable session, the validate-and-apply step, the legal-move queries, terminal/score computation, and (de)serialization that the driver and players are defined in terms of. This feature consumes them as-is.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A full browser game against the CPU produces the same outcomes and on-screen behavior as before the refactor — 100% of the existing UI, integration, and end-to-end tests pass with no behavioral changes required.
- **SC-002**: A complete game between two programmatic players runs to a terminal state with no UI, and its winner and score match the engine's computation for the same moves in 100% of runs.
- **SC-003**: Adding the test-double asynchronous player requires zero edits to the driver, engine, or existing players (the change set touches only the new player file and its test).
- **SC-004**: After this feature, the "ask → validate → forced-pass → repeat" turn loop exists in exactly one place; the command-line tool and the web app no longer each carry their own copy of it.
- **SC-005**: The non-I/O core of this feature (the abstraction, the driver, the CPU player) maintains ≥90% test coverage and contains no UI/DOM/framework dependencies, as verified by the existing coverage and engine-purity gates.
- **SC-006**: Across all cancellation scenarios (undo, reset/new-game, teardown mid-turn), zero stale or aborted moves are applied — verified by targeted tests.
- **SC-007**: A player that only returns illegal moves causes a bounded, loud failure rather than a hang — verified by a test asserting the driver stops after the retry bound.

## Assumptions

- **Engine is complete and frozen for this feature.** The existing `@core` move API (create session, validate-and-apply step, legal-move queries, terminal/score computation, session (de)serialization, immutable session state) is sufficient and is NOT modified. Rules fidelity is preserved (Constitution VII).
- **Player kinds built now: human + CPU.** Real network/remote and MCP transports are OUT OF SCOPE for this feature and deferred to future work; extensibility is proven now via a test-double asynchronous player (resolves the Q1 "build scope" decision).
- **The browser game IS migrated onto the driver this feature**, preserving behavior exactly (resolves the Q2 "web migration" decision). The React layer becomes a thin adapter that feeds a human player from UI events and renders driver/session updates.
- **Naming collision is real and resolved in planning.** The engine already defines `Player = "HEADS" | "TAILS"` (a slot). To avoid collision, the new move-source concept will take a distinct name (e.g., participant/agent/controller — final identifier chosen in the plan), and its `slot` field reuses the existing role type. The description's literal `interface Player` is treated as illustrative, not prescriptive.
- **Bot adaptation is mechanical.** Existing bot strategies are synchronous `(state) → move`; the CPU player adapts them to the asynchronous move contract without altering bot internals. The strategic bot's clock continues to be injected at the call boundary so the engine stays time-free.
- **Forced pass stays automatic.** No player is ever asked to "pass"; the driver owns this, consolidating the auto-pass logic currently duplicated between the CLI and the web page.
- **Illegal-move policy.** The driver re-asks a human (matching today's "stay on the same turn after an illegal click" UX) and fails loud after a bounded retry count for programmatic players (consistent with the project's "logic-layer bad inputs fail loud" stance).
- **Undo/reset semantics preserved.** Browser undo/reset behave as today; the driver resumes asking whoever owns the now-current turn after a rewind.
- **No CI.** Correctness is enforced solely by the existing pre-commit gate — Biome, `tsc --noEmit`, and the full Vitest suite with the ≥90% core-coverage and engine-purity checks (Constitution IV).
