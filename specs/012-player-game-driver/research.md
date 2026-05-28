# Phase 0 Research: Player & Game-Driver Abstraction

Decisions below resolve the design unknowns implied by the spec. The two scope forks
were settled at `/speckit-specify` time (recorded in spec Assumptions): **build Human +
CPU now, prove extensibility with a test double, defer real remote/MCP transports**; and
**migrate the browser game onto the driver this feature**. They are treated as settled
inputs and not re-litigated here.

Verified codebase facts feeding these decisions:

- `@core` already exports the full move surface: `createSession`, `step(session, move): StepResult`
  (`ok`/`error`), `hasLegalMoves`, `computeFinalScore`, `canUndo`, `undo`, `reset`,
  `legalPlacements`/`legalJoins`/`canJoin`, `serializeSession`/`deserializeSession`, and the
  immutable `GameSession { state, history, isTerminal, winner }`. **No engine change is needed.**
- The turn loop exists in **three** places today: `src/cli/main.ts::runGame` (a `while
  (!isTerminal)` loop), `src/ui/hooks/useBotGame.ts` (an `isBotTurn` effect that `setTimeout`s
  the bot move), and `src/ui/pages/GamePage.tsx` (its own forced-pass effect + click→`applyMove`).
  Forced-pass logic is duplicated between the CLI and `GamePage`.
- `BotFunction = (state: GameState) => Move` is **synchronous**; `useBotGame` already wraps it in
  `Promise.resolve(...)`.
- `tsconfig.json` has `lib: ["ES2022","DOM","DOM.Iterable"]` for all of `src` → `AbortSignal`
  is in scope. Engine purity is enforced by Biome `noRestrictedImports` (react/react-dom/@ui),
  not by the TS lib set.
- `type Player = "HEADS" | "TAILS"` is exported from `@core/types` and used pervasively.

---

## R1 — Concept name: `Agent` (additive), not a renamed `Player`

**Decision**: Name the move-source interface **`Agent`**, with a field `readonly slot: Player`
(reusing the existing `"HEADS" | "TAILS"` type) and a method `selectMove(...)`. The
description's literal `interface Player` is treated as illustrative.

**Rationale**: `@core/types` already defines `Player = "HEADS" | "TAILS"`, used in `state.ts`,
`session.ts`, `score.ts`, the bots, `useBotGame.ts`, and `setup.ts`. Naming the new interface
`Player` would collide with that widely-used slot type. Adding a **new** name (`Agent`) is
surgical — it disturbs zero existing identifiers — whereas freeing up `Player` by renaming the
slot type to `Slot`/`Side` would touch dozens of call sites across the *pure engine* and risk
regressions for no functional gain (violates "surgical changes" / "respect existing code").
`Agent` is idiomatic for "an entity that selects actions for a side," and reads naturally:
`agent.slot`, `agents.HEADS`.

**Alternatives considered**:
- *`interface Player` + rename `Player` slot type → `Slot`* — rejected: high churn across pure
  core + UI + tests, real regression risk on a working engine, no functional benefit.
- *`Participant`* — acceptable but more verbose; `Agent` is shorter and equally clear.
- *`PlayerController` / `MoveSource`* — rejected: longer, less idiomatic.

---

## R2 — Driver shape: one async function `driveGame(options): Promise<GameResult>`

**Decision**: The driver is a single async function

```ts
function driveGame(options: GameDriverOptions): Promise<GameResult>;
```

that loops to terminal, emitting each step via an `onUpdate(update)` callback and accepting an
`AbortSignal`. The **same** function backs all three contexts: the browser hook starts it in an
effect and aborts to cancel; the CLI and headless tests `await` it directly.

**Rationale**: A plain function with an options object matches the existing engine idiom
(`runSimulation`, the CLI's `runGame`) and keeps the surface minimal. The impedance mismatch
between React's render loop and an imperative `await run()` is resolved by the observer pattern:
React does **not** `await` the driver for rendering — it subscribes via `onUpdate` (→ `setSession`)
and feeds human moves into a deferred agent (R7). The driver's own `await agent.selectMove(...)`
naturally pauses on human turns (awaiting external input) and bot turns (awaiting computation),
so one loop serves the event-driven UI and the imperative CLI/test alike.

**Alternatives considered**:
- *A `GameDriver` class with `start()/stop()/submitMove()`* — rejected: more surface than needed;
  `submitMove` belongs to the human agent (R7), not the driver; a function + options is simpler.
- *A step-wise `advance(): Promise<...>` the embedder pumps* — rejected: pushes loop control to
  every embedder (re-duplicating the loop we're trying to consolidate, against SC-004). The
  `onUpdate` subscription gives React everything it needs without manual stepping.
- *Async generator (`for await (const update of driveGame(...))`)* — viable and elegant for
  CLI/tests, but awkward to consume from React and to combine with `AbortSignal`; the callback
  form is simpler for the primary (UI) consumer. Recorded as a possible future ergonomics layer.

---

## R3 — Cancellation via the standard `AbortSignal`

**Decision**: Cancellation uses the platform-standard `AbortController`/`AbortSignal`.
`GameDriverOptions.signal?: AbortSignal` is threaded through the loop and passed to
`agent.selectMove(session, signal)`. The driver calls `signal.throwIfAborted()` **after** every
`await agent.selectMove(...)` and before applying, so a move produced by an aborted turn is never
applied (FR-007, SC-006). Agents that await external input (the deferred/human agent) reject their
pending promise on `abort`.

**Rationale**: `AbortSignal` is a web/JS standard available in browsers, Node ≥15, Cloudflare
Workers, and Durable Objects, and is already typed in via the `DOM` lib — so it works in every
target runtime (FR-013) and is **not** a framework dependency, preserving engine purity
(Constitution I). It is the idiomatic cancellation primitive; embedders already know it.

**Alternatives considered**:
- *A bespoke `{ aborted: boolean; onAbort(cb) }` token* — rejected: reinvents `AbortSignal` and
  loses interop with `fetch`/timers that already accept signals (useful for the future remote agent).
- *Cancel by resolving `selectMove` with a sentinel* — rejected: muddies the `Promise<Move>`
  contract; throwing `AbortError` is cleaner and standard.

---

## R4 — Forced pass is driver-owned; UI pacing via an injected hook

**Decision**: When `!hasLegalMoves(session)`, the driver advances by `step(session, { type: "PASS" })`
**without** consulting the slot's agent (FR-004), then emits an `applied` update with `forced: true`.
A UI-only 1-second "X has no legal moves — passing" notice is preserved by an optional injected hook
`hooks.beforeForcedPass(slot, signal)` that the **UI** supplies (set notice + `await delay(1000)`);
headless/CLI omit it and pass instantly.

**Rationale**: `step` already auto-passes internally when no legal moves exist (passing any move on a
no-legal-move state triggers `applyPass`), so the driver simply calls `step(_, PASS)` — matching the
CLI's current forced-pass branch. Centralizing this removes the duplicate forced-pass code in
`GamePage` and the CLI (SC-004). Keeping the *delay/notice* as an injected hook keeps the engine
timing-free (Constitution I/VI), exactly as 011 kept the bot clock out of core via DI.

---

## R5 — Illegal-move policy and statically-bounded loops (FR-005, FR-014)

**Decision**:
- The **web UI pre-validates** candidate moves with engine queries (`legalPlacements`, `legalJoins`,
  `canJoin`) — which it already does for highlighting — and only calls the human agent's `submit`
  with a **legal** move; illegal user attempts produce local UI feedback (the existing `ILLEGAL_MOVE`
  reducer path) **without** entering the driver.
- The driver still validates every agent move via `step` (defense in depth). On rejection it emits a
  `rejected` update and re-asks the **same** slot, bounded by `agent.maxIllegalRetries` (default **1**
  → programmatic agents *fail loud* on a bug; the human agent never trips it because the UI pre-validates).
- The outer turn loop is bounded by a compile-time constant `MAX_MOVES` (e.g. 200; the true maximum is
  ≈ 50: ≤12 PLACEs + ≤~30 JOINs + passes). Exceeding it throws a `DriverError`.

**Rationale**: This keeps every loop **statically bounded** (NASA-style rule / FR-014) while preserving
today's UX (an illegal join shows feedback and stays on turn). Rule *enforcement* stays in the engine
(`canJoin`/`step`); the UI only *reads* engine legality to gate submission — the same pattern it already
uses for legal-move highlighting, so Constitution III (no rule logic in UI) holds.

**Alternatives considered**:
- *Unbounded "re-ask the human forever"* — rejected: not statically bounded (FR-014); the
  pre-validation approach makes a fatal bound safe.
- *Submit-then-reject for humans through the driver* — rejected: would force a high human retry bound,
  blurring the fail-loud guarantee for programmatic agents.

---

## R6 — Bot "thinking" delay and indicator preserved via DI

**Decision**: The 2-second pre-move bot delay becomes an **injected** async hook on the CPU agent:
`createCpuAgent(slot, bot, { think?: (signal) => Promise<void> })`; `selectMove` does
`await think?.(signal); signal?.throwIfAborted(); return bot(session.state)`. The UI injects
`think = (s) => delay(2000, s)`; CLI/headless omit it. The `botThinking` indicator is **derived** in the
hook as `!session.isTerminal && session.state.currentPlayer === botSlot` — true throughout the bot's turn
(including the think delay), false otherwise.

**Rationale**: Matches the current perceived behavior (indicator on for the whole bot turn; ~2s before the
move lands) while keeping wall-clock delays out of the engine (DI, as in 011 R4). The strategic bot's own
injected clock (`createStrategicBot({ now: performance.now, deadlineMs })`) is configured where the bot is
built (as `getBotFunction` does today) and is orthogonal to the agent's `think` delay — the CPU agent just
wraps the already-configured `BotFunction`.

---

## R7 — Human input as a deferred agent; React becomes a thin adapter

**Decision**: A `createDeferredAgent(slot)` returns `{ agent, submit(move), fail(error) }`. The agent's
`selectMove` returns a promise that resolves when the embedder calls `submit(move)` (and rejects on
`fail`/abort). The reworked `useBotGame` hook:
1. builds `agents = { [humanSlot]: deferred.agent, [oppSlot]: cpuAgent | deferred2.agent }`,
2. starts `driveGame({ initialSession, agents, onUpdate, signal, hooks })` in an effect,
3. maps `onUpdate` → `setSession` (+ notice on forced pass),
4. exposes `submitMove(move)` (used by `GamePage` clicks in place of the old `applyMove`),
5. on **undo/reset**, aborts the current run, computes the target session via `undo()`/`reset()`/`createSession()`,
   and starts a **new** run from it (agents persist),
6. computes `flipped` for animation by diffing the previous session it holds (reuse `findFlippedCoins`),
   so `GamePage`'s existing `session.history.length` effect drives the flip animation.

**Rationale**: This is the "HumanPlayer resolves from a UI event queue" of the description, realized with a
single-slot deferred promise. Undo/reset-as-abort-and-restart is the natural fit for the `AbortSignal`
model and guarantees no stale move survives a rewind (SC-006). Driving the flip animation from
history-length (an effect `GamePage` already has for undo detection) keeps the migration close to the
existing component shape.

**Verification / parity risks (the SC-001 oracle)**: the existing UI, integration, and e2e suites are the
behavioral contract. The implementation must keep **100%** of them green. Watch specifically: (a) the human
move no longer returns flips synchronously — flips arrive via the update/history-growth path; (b) bot-move
flip animation must match today's behavior; (c) illegal-move feedback now comes from UI pre-validation;
(d) `botThinking` timing; (e) undo while the bot is "thinking" discards the pending move. `useGameSession`
is absorbed/simplified into the reworked hook (its `step`+`setState` role is replaced by driver updates);
its public surface is kept where callers depend on it.

---

## R8 — Pure orchestration lives in `src/core/driver/`

**Decision**: The `Agent` interface, `driveGame`, and the pure agents (`CpuAgent`, `DeferredAgent`,
`ScriptedAgent`) live under `src/core/driver/`. They contain no React/DOM/framework imports and are
subject to the ≥90% core-coverage gate. The **wiring** that performs I/O — React event handlers calling
`submit`, the CLI's stdin reader calling `submit`, and (future) WebSocket/MCP transports — lives in
`src/ui/`, `src/cli/`, and future layers respectively, each feeding a `DeferredAgent`.

**Rationale**: The driver and these agents are pure async TypeScript, satisfying Constitution I (and
FR-013: they run unchanged in browser/Node/CF). Co-locating them with the engine they orchestrate keeps
`@core` the single source of game logic and lets the existing engine-purity Biome guard cover them. The
deferred agent's resolver is local, transient state — not game state — so Constitution VI (immutable game
state) is unaffected.

**Alternatives considered**:
- *A separate top-level `src/driver/` package* — rejected: it would need its own purity guard and import
  path; folding into `src/core/` reuses the existing `@core` barrel and gates.

---

## R9 — CLI refactors onto `driveGame` (SC-004)

**Decision**: `src/cli/main.ts::runGame(inputSource, output)` keeps its signature (tests depend on it) but
its body is reimplemented to: build a shared line-reader over `inputSource`, create one stdin-fed agent per
slot (each `selectMove` reads a line, re-reading on **parse** error until it yields a parseable `Move`),
wire `onUpdate` to `render`/`output`, own an `AbortController`, and delegate the loop to `driveGame`. On
input EOF the stdin agent aborts the controller; `runGame` catches the resulting `AbortError` and prints
"Goodbye!". Legality is still decided by the driver/engine (`step`), so an illegal-but-parseable line surfaces
a `rejected` update (re-prompt), exactly as today's `continue`.

**Rationale**: Removes the CLI's hand-rolled loop so the ask/validate/forced-pass logic lives in exactly one
place (SC-004) and the CLI provably shares the web's behavior (Constitution VII). Parse handling stays a CLI
(input) concern; legality stays an engine concern — a clean split.

---

## R10 — Extensibility proof (US3) without touching core

**Decision**: A `FakeRemoteAgent` test double lives in `src/core/driver/__tests__/` (NOT in the shipped
core). Its `selectMove` resolves from an injected `Promise<Move>` (settles after an awaited external signal),
standing in for a future networked/MCP opponent. A test drives a **full game** with it through the unchanged
`driveGame`, and asserts (a) turn order/result remain correct, (b) a rejecting `selectMove` surfaces the
failure without corrupting state, and (c) adding the double required no edits to `game-driver.ts`, the engine,
or the existing agents (SC-003). `serializeSession`/`deserializeSession` already exist, so a real remote/DO
agent later needs zero engine change — noted as future work, not built here.

**Rationale**: Validates that the `Agent` contract *is* the extension seam (the feature's whole point) using a
test double, honoring the "build the seam now, defer real transports" scope decision. Keeping the double in
tests makes the "no core edits" diff argument unambiguous.

---

## Implementation Notes (T030 — intentional divergences, preserved per Constitution VII)

Where the built code differs from the plan/contracts, with the same observable behavior:

1. **CLI illegal-move handling (vs contracts/ui-cli-integration.md C3).** The stdin agent *pre-validates* each
   parsed line with `step` and re-reads (printing `Error: …` itself) on BOTH parse and illegal moves, so it
   only ever hands the driver a legal move. C3 described illegal moves flowing through the driver's `rejected`
   update. Pre-validation was chosen because it (a) matches R5 (interactive embedders feed only legal moves —
   exactly what the UI's DeferredAgent does), (b) preserves the legacy *unlimited* re-prompt behavior (bounded
   by input/EOF) rather than the driver's per-turn `maxIllegalRetries` cap, and (c) yields byte-identical
   output (the CLI suite, the SC-004 oracle, stays green). The driver's `rejected` path remains the fail-loud
   mechanism for *programmatic* agents (bots) — its real purpose.

2. **CLI EOF (matches C3 intent).** The stdin agent owns an `AbortController` and aborts it on EOF; `runGame`
   detects cancellation via `controller.signal.aborted` (robust) rather than sniffing the thrown error type.

3. **ScriptedAgent exhaustion** rejects with `DriverError` reusing the existing code `"max-moves-exceeded"`
   (plus a disambiguating message). The three documented `DriverErrorCode`s were kept — no 4th was added — to
   stay faithful to data-model.md / T002.

4. **`useGameSession` retained (vs T015 "simplify").** Kept as a small session-container utility; it now also
   *exports* `findFlippedCoins` (reused by the driver host). `useBotGame` supersedes it on the App's critical
   path, but deleting working, tested code was judged worse than keeping it. Its test is unchanged and green.

5. **Unified flip animation (per C2).** Flips now animate for *every* applied move (incl. bot moves) via the
   single `session.history.length` growth effect + `lastFlipped`; previously only human moves animated. This is
   the C2-intended consolidation — a minor visual consistency gain, not a functional change (SC-001 preserved).

6. **Illegal-input UX preserved.** Illegal PLACE silently closes the face selector (`CANCEL_PHASE`, matching
   the legacy `MOVE_RESOLVED(EMPTY)`); illegal JOIN shows `coin-illegal` feedback (unchanged). New Game/reset
   returns to a fresh `createSession()` (matching the legacy reset), not a test-injected `initialSession`.

7. **Test timing adaptation (SC-001 oracle, not weakened).** Integration/UI tests that drove the old
   *synchronous* `applyMove` were adapted to the driver's microtask-based application: sync
   `act(() => advanceTimersByTime)` → `await act(async () => advanceTimersByTimeAsync)`, with a microtask flush
   between successive moves (the DeferredAgent re-pends only after the prior move lands). **Assertions are
   unchanged** — the same behavior is verified, satisfying SC-001 without lowering the bar.

8. **e2e scope.** The Playwright `tests/e2e/**` suite was not executed here (no browser binaries). The
   in-process vitest oracle — unit + `tests/integration` + `tests/a11y` + `tests/visual` + `src/cli`
   (415 tests) — is 100% green. Run `bun run e2e` locally / in CI to fully close SC-001.
