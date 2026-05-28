---
description: "Task list for feature 012 — Player & Game-Driver Abstraction"
---

# Tasks: Player & Game-Driver Abstraction

**Input**: Design documents from `/specs/012-player-game-driver/`
**Prerequisites**: plan.md, spec.md, research.md (R1–R10), data-model.md, contracts/ (driver, agents, ui-cli-integration)

**Tests**: INCLUDED — the project mandates TDD (Constitution II: every `src/core/` change is driven by a failing test first; all three contracts specify test-first). Write each test task and confirm it FAILS before its implementation task.

**Organization**: Tasks are grouped by the spec's user stories. The shared `Agent` interface, `driveGame` loop, and the three agents are **Foundational** (Phase 2) because every story depends on them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, Polish carry no story label)
- All paths are repository-relative from `cycles/`.

## Path Conventions

Single project: pure engine in `src/core/`, React UI in `src/ui/`, CLI in `src/cli/`, cross-cutting suites in `tests/`. New code lives in `src/core/driver/` (per plan Structure Decision).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new module's home so subsequent files resolve.

- [x] T001 Create the driver module skeleton: `src/core/driver/index.ts` and `src/core/driver/agents/index.ts` (empty barrels) and the `src/core/driver/__tests__/` directory.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure `Agent` interface, `driveGame` loop, and the three agents — needed by ALL user stories. Pure TypeScript in `src/core/driver/`, no framework imports (Constitution I).

**⚠️ CRITICAL**: No user story can be completed until this phase is done.

- [x] T002 Define driver types in `src/core/driver/types.ts`: `Agent`, `DriverUpdate` (start|applied|rejected|end), `GameDriverOptions`, `DriverHooks`, `GameResult`, the `DriverError` class (`code: "illegal-move-limit"|"max-moves-exceeded"|"bad-agents"`), and the `MAX_MOVES` constant (=200). Re-export them from `src/core/driver/index.ts`. (per data-model.md)
- [x] T003 Re-export the driver barrel from the engine: add `export * from "./driver/index";` to `src/core/index.ts` (the only `@core` barrel change). Confirm `tsc --noEmit` resolves the new `@core` surface.
- [x] T004 [P] Write FAILING tests `src/core/driver/__tests__/deferred-agent.test.ts`: `selectMove` pends until `submit`; resolves with the submitted move; `fail(e)` rejects; `signal` abort rejects with `AbortError` and clears the resolver (no late resolve — SC-006); `submit` with no pending request is a no-op. (contracts/agents.md C2)
- [x] T005 [P] Write FAILING tests `src/core/driver/__tests__/scripted-agent.test.ts`: plays its list in order; advancing past the end throws `DriverError`. (contracts/agents.md C3)
- [x] T006 [P] Write FAILING tests `src/core/driver/__tests__/cpu-agent.test.ts`: wraps a stub `BotFunction` and returns its move without mutating `session`; an injected `think` delays the move until it settles (fake timers); abort during `think` rejects and the bot is NOT called. (contracts/agents.md C1)
- [x] T007 [P] [Impl] Implement `createDeferredAgent(slot, options?)` in `src/core/driver/agents/deferred-agent.ts` → makes T004 green.
- [x] T008 [P] [Impl] Implement `createScriptedAgent(slot, moves)` in `src/core/driver/agents/scripted-agent.ts` → makes T005 green.
- [x] T009 [P] [Impl] Implement `createCpuAgent(slot, bot, options?)` in `src/core/driver/agents/cpu-agent.ts` → makes T006 green.
- [x] T010 Export the three agents from `src/core/driver/agents/index.ts` and ensure `src/core/driver/index.ts` re-exports them. (depends on T007–T009)
- [x] T011 Write FAILING tests `src/core/driver/__tests__/game-driver.test.ts` covering contracts/driver.md C2: two `ScriptedAgent`s reach terminal with `result === computeFinalScore` and the expected `applied` sequence; **property** — driver terminal session equals replaying the same moves through `step` for N random scripted games; forced-pass emits `applied{forced:true}` WITHOUT calling that slot's agent (spy); illegal move emits `rejected` then `DriverError("illegal-move-limit")` after the bound, and illegal-then-legal recovers; abort during `selectMove` rejects with `AbortError` and applies no move (SC-006); `MAX_MOVES` exceeded throws `DriverError("max-moves-exceeded")`; mismatched `agents[s].slot` throws `DriverError("bad-agents")`; update order is `start (applied|rejected)* end`; **turn order (FR-003)** — a spy confirms each turn asks `agents[session.state.currentPlayer]` (never an external counter); **already-terminal** — `driveGame` on a terminal `initialSession` emits `start`→`end` and calls no agent (spec Edge Cases).
- [x] T012 Implement `driveGame(options): Promise<GameResult>` in `src/core/driver/game-driver.ts` with small helpers (`takeTurn`, `forcedPass`) each ≤15 cognitive complexity / ≤100 lines; export from `src/core/driver/index.ts` → makes T011 green.

**Checkpoint**: The pure driver + agents are complete and fully tested headlessly. User stories can now proceed (in parallel if staffed).

---

## Phase 3: User Story 1 - Browser human-vs-CPU runs on the unified driver, no visible change (Priority: P1) 🎯 MVP

**Goal**: Re-route the live web game through `driveGame` (human → `DeferredAgent`, CPU → `CpuAgent`), preserving every on-screen behavior (placement/join, flip animation, "thinking" indicator, auto-pass notice, undo, reset, game-over).

**Independent Test**: Play a full browser game vs the CPU and run the existing UI/integration/e2e/visual/a11y suites — all pass with no behavioral change (SC-001).

> Write the failing hook tests (T013) before reworking the hook (T014).

- [x] T013 [US1] Update FAILING hook tests `src/ui/hooks/__tests__/useBotGame.test.tsx` for the driver path: `submitMove(legalMove)` advances the session and exposes the resulting `lastFlipped`; `botThinking` is true for the whole bot turn (advance the injected 2s `think` via fake timers); `undo()` while thinking aborts the pending bot move (no extra move applied); a forced-pass turn sets the auto-pass notice then advances after the injected 1s delay; human-vs-human routes `submitMove` to the current slot. (contracts/ui-cli-integration.md C1)
- [x] T014 [US1] Rework `src/ui/hooks/useBotGame.ts`: build `agents` (human slot → `createDeferredAgent`; opponent → `createCpuAgent(oppSlot, getBotFunction(opponent), { think: (s)=>delay(2000,s) })`, or a 2nd `DeferredAgent` for human-vs-human); start `driveGame({...,onUpdate,signal,hooks})` in an effect; map `onUpdate`→`setSession` + compute `lastFlipped` via `findFlippedCoins`; expose `submitMove`; abort+restart the run on `reset`/`undo`; derive `botThinking`; set `hooks.beforeForcedPass` to show the 1s notice → makes T013 green.
- [x] T015 [US1] Simplify `src/ui/hooks/useGameSession.ts` into the driver-fed session container (its `step`+`setState` role is now the driver's); keep the public surface any caller still needs; update `src/ui/hooks/__tests__/useGameSession.test.tsx`. (same subsystem as T014 — sequential)
- [x] T016 [US1] Update `src/ui/pages/GamePage.tsx`: dispatch moves via `submitMove` (PLACE gated by existing legality checks; JOIN pre-validated with the engine query `canJoin` — gate **only** via engine query functions (`canJoin`/`legalJoins`/`legalPlacements`), with **no inline geometry or rule logic in the UI** (Constitution III) — else dispatch `ILLEGAL_MOVE`); drive the flip animation from the EXISTING `session.history.length` growth effect using `lastFlipped`; REMOVE the standalone auto-pass effect (now driver-owned). `gamePageReducer.ts` is unchanged. (contracts/ui-cli-integration.md C2; depends on T014)
- [x] T017 [US1] First locate the consumer (`rg "useBotGame" src/ui`), then update its wiring (the component mounting `GamePage`, e.g. `src/ui/App.tsx`) for the new return surface (`submitMove` replaces the old `applyMove` prop). (depends on T016)
- [x] T018 [US1] Verify US1 / SC-001: run the `useBotGame`, `useGameSession`, `GamePage` (+ `.a11y`) unit tests and the `tests/integration`, `tests/e2e`, `tests/visual`, `tests/a11y` suites — all green. Fix any parity regression (bot-move flips, illegal feedback, `botThinking` timing, undo-while-thinking).

**Checkpoint**: The browser human-vs-CPU game runs entirely through `driveGame` with no user-visible change.

---

## Phase 4: User Story 2 - Headless game between two programmatic players + CLI on the driver (Priority: P2)

**Goal**: A full game runs headlessly between two `Agent`s (no UI), and the CLI's hand-rolled loop is replaced by `driveGame` (SC-004).

**Independent Test**: A Node test drives two programmatic players to terminal and asserts winner/score match the engine, with no UI; the CLI plays a scripted transcript identically to before.

- [x] T019 [P] [US2] Write FAILING headless integration test `src/core/driver/__tests__/headless-game.test.ts`: drive `createCpuAgent("HEADS", strategicBot)` vs `createCpuAgent("TAILS", randomBot)` to terminal and assert `result === computeFinalScore` (no clock injected ⇒ deterministic Strategic side); a `ScriptedAgent` vs `ScriptedAgent` game reproduces a known terminal result on repeat; the test imports nothing from `@ui`/DOM. (FR-012, SC-002)
- [x] T020 [US2] Update FAILING CLI tests in `src/cli/__tests__/`: a scripted input transcript yields identical board renders, turn prompts, error messages, forced-pass lines, and game-over summary to the pre-migration CLI; input EOF prints "Goodbye!"; an illegal-but-parseable line prints the engine error and re-prompts (no turn advance). (contracts/ui-cli-integration.md C3)
- [x] T021 [US2] Rework `src/cli/main.ts::runGame(inputSource, output)` (signature preserved): build a shared line iterator + one stdin-fed `Agent` per slot (read+`parseMove`, re-read on parse error); wire `onUpdate`→`render`/`output`; own an `AbortController` that the stdin agent aborts on EOF (caught → "Goodbye!"); delegate the loop to `driveGame`; DELETE the hand-rolled `while`-loop and its forced-pass branch → makes T020 green.
- [x] T022 [US2] Verify US2: `headless-game` test + the full `src/cli` suite are green; confirm SC-004 (the ask/validate/forced-pass loop now exists only in `driveGame`).

**Checkpoint**: Headless two-player games and the CLI both run on the single driver.

---

## Phase 5: User Story 3 - A new move-source plugs in without touching the engine or driver (Priority: P3)

**Goal**: Prove the `Agent` contract is the extension seam: a new asynchronous move-source runs through the unchanged `driveGame`.

**Independent Test**: A `FakeRemoteAgent` (resolving its move from an injected `Promise`) drives a full game through the unchanged driver; adding it required no edits to the driver/engine/existing agents.

- [x] T023 [P] [US3] Add `src/core/driver/__tests__/fake-remote-agent.test.ts`: a `FakeRemoteAgent` whose `selectMove` resolves from an injected `Promise<Move>` (settling after an awaited external signal) plays a full game through the unchanged `driveGame` with correct turn order/result; a variant whose `selectMove` rejects (simulated disconnect) surfaces the failure from `driveGame` without corrupting the last good session. (contracts/agents.md C4, FR-010)
- [x] T024 [US3] Verify SC-003: run `git diff --stat` for the US3 change set and confirm it touches ONLY the new test file — no edits to `src/core/driver/game-driver.ts`, the engine, or the shipped agents were needed; record this note in the test file header / research R10.

**Checkpoint**: The abstraction is proven to be the API surface — new players plug in with zero core edits.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Enforce the gates and validate the success criteria across all stories.

- [x] T025 [P] Run `bun run test:coverage`; confirm `src/core/` (including `src/core/driver/`) ≥ 90% (SC-005); add tests for any uncovered branch.
- [x] T026 [P] Run `bun run lint` (Biome): confirm `src/core/driver/**` imports no `react`/`react-dom`/`@ui` (engine-purity `noRestrictedImports` passes — SC-005) and every new function is ≤15 cognitive complexity / ≤100 lines; fix violations. Confirm `src/core/driver/__tests__/**` run under Vitest's `node` environment (the default for `src/core/**`), so any accidental DOM/browser-only usage fails at test time (enforces FR-013).
- [x] T027 [P] Run `bun run typecheck` (`tsc --noEmit`) — zero errors.
- [x] T028 Run the FULL suite `bun run test:run` — 100% green including `tests/integration`, `tests/e2e`, `src/cli`, visual, and a11y (SC-001).
- [x] T029 [P] Run `bun run build` (`tsc && vite build`) — succeeds (the web migration ships).
- [x] T030 Walk the quickstart acceptance checklist (SC-001…SC-007), tick each; record any implementation divergence from research/contracts as a note in `research.md` (Constitution VII — preserve reasoning).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories. Within it: T002 (types) → T003 (barrel); T004–T006 (agent tests, [P]) → T007–T009 (agent impls, [P]) → T010; then T011 (driver tests) → T012 (driver impl). Driver tests (T011) depend on the agents (T007–T009) and types (T002).
- **User Stories (Phase 3–5)**: each depends only on Foundational, NOT on each other — they can run in parallel (US1 in `src/ui/`, US2 in `src/cli/` + a driver test, US3 in a driver test).
- **Polish (Phase 6)**: depends on all targeted stories being complete.

### User Story Dependencies

- **US1 (P1)**: after Foundational. No dependency on US2/US3.
- **US2 (P2)**: after Foundational. Independent of US1/US3.
- **US3 (P3)**: after Foundational. Independent of US1/US2.

### Within Each Story

- The failing test task precedes its implementation task (TDD).
- US1: T013 → T014 → {T015, T016} → T017 → T018. US2: T019 [P]; T020 → T021 → T022. US3: T023 → T024.

### Parallel Opportunities

- Foundational agent tests **T004, T005, T006** together; then agent impls **T007, T008, T009** together.
- Once Foundational is done, the three stories run in parallel; their first tasks **T013 (US1)**, **T019 (US2)**, **T023 (US3)** touch different files.
- Polish: **T025, T026, T027, T029** in parallel (T028 after fixes; T030 last).

---

## Parallel Example: Phase 2 Foundational

```bash
# After T002 (types) + T003 (barrel): write the three agent tests together
Task: "deferred-agent.test.ts — submit/fail/abort"          # T004
Task: "scripted-agent.test.ts — list playback / exhaustion"  # T005
Task: "cpu-agent.test.ts — wraps bot, think-delay, abort"    # T006

# Then implement the three agents together (each in its own file)
Task: "createDeferredAgent in agents/deferred-agent.ts"      # T007
Task: "createScriptedAgent in agents/scripted-agent.ts"      # T008
Task: "createCpuAgent in agents/cpu-agent.ts"                # T009
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational (the driver + agents — most of the new code) → 3. Phase 3 US1 → **STOP & VALIDATE**: the web game is unchanged (SC-001) and now runs on the driver. Ship.

### Recommended risk-ordering note

US1 (the web migration) carries the most regression risk; US2 and US3 depend only on Foundational and exercise the driver more simply. A pragmatic sequence is **Foundational → US2 (headless + CLI, validates the driver end-to-end) → US3 (extensibility) → US1 (UI migration)**, even though US1 is the P1 *business* priority. Either order is valid because the stories are independent.

### Incremental Delivery

Foundational ready → add US1 (MVP, ship) → add US2 → add US3 → Polish. Each story adds value without breaking the previous ones.

---

## Notes

- [P] = different files, no incomplete-task dependency. [Story] label maps each task to a spec user story.
- TDD: confirm every test task FAILS before writing its implementation.
- The existing UI/integration/e2e/CLI suites are the behavioral oracle for the migrations (SC-001/SC-004) — keep them green, do not weaken them.
- Engine purity: nothing under `src/core/driver/` may import React/DOM/`@ui`; `AbortSignal` is a permitted standard global.
- Commit after each task or logical group (conventional messages).
- Total: **30 tasks** — Setup 1, Foundational 11, US1 6, US2 4, US3 2, Polish 6.
