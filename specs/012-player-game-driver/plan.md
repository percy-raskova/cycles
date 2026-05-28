# Implementation Plan: Player & Game-Driver Abstraction

**Branch**: `012-player-game-driver` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-player-game-driver/spec.md`

## Summary

Introduce one load-bearing abstraction that decouples *whose turn it is* from *where the move
comes from*: an **`Agent`** interface (`readonly slot: Player`, `selectMove(session, signal?):
Promise<Move>`) and a single pure async driver **`driveGame(options): Promise<GameResult>`** that
loops *ask the current slot's agent → validate via the existing `step` → emit an update → repeat*
until the engine reports terminal. Concrete agents built now: **`CpuAgent`** (wraps the existing
synchronous `BotFunction`s), **`DeferredAgent`** (move arrives via an external `submit`, used by the
UI and CLI for human input), and **`ScriptedAgent`** (fixed move list for headless tests). The
browser human-vs-CPU game is **re-routed through `driveGame`** (the React hook starts a run, feeds a
`DeferredAgent` from clicks, and aborts to cancel on undo/reset), the **CLI** refactors its
hand-rolled loop onto `driveGame`, and a **`FakeRemoteAgent`** test double proves a new asynchronous
move-source plugs in with zero engine/driver edits. The engine is unchanged (orchestration only).
This collapses the turn loop that exists in **three** places today (CLI, `useBotGame`, `GamePage`)
into **one**.

## Technical Context

**Language/Version**: TypeScript 5.x, strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); `target ES2022`, `lib ["ES2022","DOM","DOM.Iterable"]`.
**Primary Dependencies**: None new. Reuses `@core` (`step`, `hasLegalMoves`, `computeFinalScore`, `undo`, `reset`, `createSession`, legal-move queries, `serializeSession`). Cancellation uses the platform-standard `AbortController`/`AbortSignal` (no dependency). React 18 + Vite for the UI hook rework only.
**Storage**: N/A (stateless; immutable in-memory `GameSession`).
**Testing**: Vitest with `fast-check` (property tests). New unit tests in `src/core/driver/__tests__/`; existing UI/integration/e2e suites act as the behavioral regression oracle for the web migration (SC-001).
**Target Platform**: Browser (Cloudflare Pages SPA) + Node CLI; the driver and pure agents are platform-agnostic and run unchanged in a Node test, the browser, or a future server/Durable Object (FR-013).
**Project Type**: Single project — pure engine module (`src/core/`) consumed by a thin React UI (`src/ui/`) and a CLI (`src/cli/`).
**Performance Goals**: No new perf budget. The driver adds negligible overhead per turn (one `step` + one `await`); bot move time is unchanged (same `BotFunction`). UI pacing (2,000 ms bot think, 1,000 ms auto-pass notice) is preserved exactly via injected hooks.
**Constraints**: Engine purity — `src/core/driver/` imports no React/DOM/framework (Biome `noRestrictedImports` guard); full immutability (driver threads sessions through `step`, never mutates); **every loop statically bounded** (`MAX_MOVES` constant; `maxIllegalRetries` constant) per FR-014; per-function cognitive complexity ≤ 15 and ≤ 100 lines (Biome gate) — the loop is split into small helpers (`takeTurn`, `forcedPass`).
**Scale/Scope**: Board 7×7, ≤ 12 coins, ≤ ~50 moves/game. New code ≈ the `Agent` interface + `driveGame` + three agents + tests (~the "~200 lines, mostly tests" estimate), plus the `useBotGame`/`GamePage`/`cli/main.ts` migration edits.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — still passing.*

| Principle | Compliance | Notes |
|-----------|-----------|-------|
| I. Engine Purity | ✅ PASS | `Agent`, `driveGame`, and the pure agents (`CpuAgent`/`DeferredAgent`/`ScriptedAgent`) live in `src/core/driver/` with **no** React/DOM/framework imports. `AbortSignal` is a standard global (typed via the existing `DOM` lib), **not** a framework import — purity holds; the Biome `noRestrictedImports` guard on `src/core/**` covers the new dir. I/O wiring (React handlers, CLI stdin, future remote/MCP) lives outside core and feeds a `DeferredAgent` (R7/R8). |
| II. Test-First Discipline | ✅ PASS | Loop, forced-pass, illegal-retry bound, cancellation, terminal/result, and each agent written test-first; ≥ 90% coverage on `src/core/`. Property test: a random `ScriptedAgent` vs `ScriptedAgent` game's result equals the engine's for the same move sequence; abort-mid-turn never applies a move. |
| III. UI/Engine Separation | ✅ PASS | The driver is engine-side; the UI becomes a *thinner* adapter (feeds `DeferredAgent`, renders updates). UI move pre-validation uses engine **queries** (`canJoin`/`legalJoins`) for gating — the same read-only pattern already used for legal-move highlighting — so no rule logic moves into the UI (R5). |
| IV. Pre-Commit Quality Gates | ✅ PASS | Biome + `tsc --noEmit` + Vitest run pre-commit. Complexity ≤ 15 / ≤ 100 lines drives splitting `driveGame` into `takeTurn`/`forcedPass` helpers. |
| V. Accessibility by Default | ✅ PASS | No UI surface changes — same board, controls, focus, and touch targets. The migration is internal; the "thinking"/auto-pass affordances are preserved identically (FR-011). |
| VI. Immutability by Default | ✅ PASS | The driver advances state only through `step` (returns new sessions); never mutates. The `DeferredAgent` resolver is local transient control state, not game state. |
| VII. Canonical Rules Fidelity | ✅ PASS | FR-015: no rule/scoring/terminal change; the driver only *calls* `step`/`hasLegalMoves`/`computeFinalScore`. Consolidating the CLI and web onto one loop **directly serves** Principle VII ("CLI and web MUST present identical behavior") by construction. |

**No violations.** Complexity Tracking section omitted (nothing to justify).

**Key engine facts feeding the design** (verified, see research):
`step(session, move)` auto-passes when `!hasLegalMoves` and rejects a voluntary PASS when legal moves
exist — so the driver's forced-pass is just `step(_, PASS)` (R4). `BotFunction` is synchronous, so
`CpuAgent` is a thin `Promise.resolve(bot(state))` adapter (R6). `AbortSignal` is available in every
target runtime, making it the cancellation primitive without breaking purity (R3). `Player =
"HEADS"|"TAILS"` already exists, so the new interface is named `Agent` to avoid collision (R1).

## Project Structure

### Documentation (this feature)

```text
specs/012-player-game-driver/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 — R1..R10: naming, driver shape, AbortSignal, forced-pass, bounds, pacing, UI/CLI migration, purity, extensibility
├── data-model.md        # Phase 1 — entities: Agent, GameDriverOptions, DriverUpdate, GameResult, the three agents
├── quickstart.md        # Phase 1 — drive a headless game, migrate the UI/CLI, run the suites
├── contracts/
│   ├── driver.md            # driveGame() + Agent interface contract (pre/postconditions, tests)
│   ├── agents.md            # CpuAgent / DeferredAgent / ScriptedAgent contracts
│   └── ui-cli-integration.md# useBotGame hook + CLI runGame migration contract
├── checklists/
│   └── requirements.md  # spec quality checklist (from /speckit-specify)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/core/
├── driver/                      # NEW — pure orchestration (≥90% coverage, no framework deps)
│   ├── index.ts                 # barrel: Agent, driveGame, agents, types
│   ├── types.ts                 # Agent, DriverUpdate, GameDriverOptions, DriverHooks, GameResult, DriverError
│   ├── game-driver.ts           # driveGame(options): Promise<GameResult> — the single loop (+ takeTurn/forcedPass helpers)
│   ├── agents/
│   │   ├── index.ts
│   │   ├── cpu-agent.ts         # createCpuAgent(slot, bot, { think? }) — wraps a BotFunction
│   │   ├── deferred-agent.ts    # createDeferredAgent(slot) → { agent, submit, fail } — external move source (human/remote)
│   │   └── scripted-agent.ts    # createScriptedAgent(slot, moves) — fixed list (headless tests / replay)
│   └── __tests__/
│       ├── game-driver.test.ts      # loop, forced-pass, illegal bound, cancellation, terminal/result, MAX_MOVES
│       ├── cpu-agent.test.ts        # wraps bot; think-delay; abort
│       ├── deferred-agent.test.ts   # submit resolves; fail/abort rejects
│       ├── scripted-agent.test.ts   # plays the list; exhausted-list behavior
│       └── fake-remote-agent.test.ts# US3: async-from-elsewhere double; full game; no core edits needed
├── index.ts                     # EDIT — re-export ./driver from the @core barrel
└── (unchanged) state.ts, move.ts, session.ts, score.ts, serialization.ts, geometry.ts, bots/, types.ts

src/ui/
├── hooks/
│   ├── useBotGame.ts            # REWORK — build a driveGame run; DeferredAgent(human) + CpuAgent(bot); expose submitMove; abort+restart on reset/undo; derive botThinking
│   ├── useGameSession.ts        # SIMPLIFY/ABSORB — session-state container driven by driver updates (keep public surface callers use)
│   └── __tests__/               # UPDATE — useBotGame/useGameSession tests for the driver path
├── pages/
│   ├── GamePage.tsx             # EDIT — dispatch moves via submitMove (pre-validate legality); flips via the existing history-length effect
│   └── gamePageReducer.ts       # KEEP — UI interaction state machine unchanged
└── (App wiring touched only if the hook's return surface changes)

src/cli/
└── main.ts                      # REWORK — runGame builds stdin-fed agents + onUpdate=render, delegates the loop to driveGame (signature preserved)

tests/ (integration, e2e, visual, a11y)  # UNCHANGED sources — the behavioral oracle; must stay 100% green (SC-001)
```

**Structure Decision**: Single-project layout (unchanged). The only new directory is
`src/core/driver/`, holding the pure `Agent`/`driveGame`/agents. The migration edits are confined to
`src/ui/hooks/useBotGame.ts`, `src/ui/hooks/useGameSession.ts`, `src/ui/pages/GamePage.tsx`, and
`src/cli/main.ts`; the `@core` barrel gains a driver re-export. No engine rule files change (FR-015).

## Complexity Tracking

> No Constitution violations — section intentionally empty.

## Traceability (spec → design)

| Spec item | Where addressed |
|-----------|-----------------|
| FR-001 (async move-source bound to a slot) | `Agent` interface (R1, data-model) |
| FR-002 / FR-003 (loop; slot from engine state) | `driveGame` loop reads `session.state.currentPlayer` (R2, contracts/driver.md) |
| FR-004 (forced pass, no agent ask) | driver `forcedPass` via `step(_,PASS)` + `beforeForcedPass` hook (R4) |
| FR-005 / FR-014 (illegal retry; bounded loops) | `maxIllegalRetries` (default 1) + `MAX_MOVES` constant; UI pre-validates (R5) |
| FR-006 (stop at terminal; final result) | loop condition `!session.isTerminal`; `GameResult` from `computeFinalScore` (R2) |
| FR-007 / SC-006 (cancellable; no stale move) | `AbortSignal` + `throwIfAborted()` after `selectMove`; undo/reset = abort+restart (R3, R7) |
| FR-008 (human move from external input) | `DeferredAgent.submit` (R7); UI handlers + CLI stdin call it (R9) |
| FR-009 (CPU delegates to existing bots) | `CpuAgent` wraps `BotFunction` unchanged (R6) |
| FR-010 / SC-003 (new kind, no core edits) | `FakeRemoteAgent` test double (R10) |
| FR-011 / SC-001 (browser behavior identical) | `useBotGame`/`GamePage` rework; existing suites are the oracle (R7) |
| FR-012 / SC-002 (headless two-player game) | `ScriptedAgent` vs `CpuAgent`/`ScriptedAgent` driven by `driveGame` in Node tests (R2, R8) |
| FR-013 / SC-005 (cross-runtime; no framework deps) | pure `src/core/driver/`; AbortSignal; purity gate (R3, R8) |
| FR-015 (no rule change) | driver only calls existing engine functions (Constitution VII) |
| SC-004 (one loop, not three) | CLI + `GamePage` forced-pass + `useBotGame` fork all replaced by `driveGame` (R4, R7, R9) |
| SC-007 (only-illegal player fails loud, bounded) | `maxIllegalRetries` exhaustion throws `DriverError` (R5) |
