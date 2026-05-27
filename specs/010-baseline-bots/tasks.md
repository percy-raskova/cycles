# Tasks: Baseline AI Opponents

**Input**: Design documents from `/specs/010-baseline-bots/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and ensure existing exports are ready for bot integration.

- [X] T001 Create `src/core/bots/` directory and `src/core/bots/index.ts` placeholder
- [X] T002 Verify `src/core/index.ts` re-exports everything bots need (`GameState`, `Move`, `Player`, `applyMove`, `legalPlacements`, `legalJoins`, `hasLegalMoves`, `createSession`, `computeFinalScore`, `step`, `isValidState`, `positionKey`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and helpers that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundational (Write first, ensure they fail)

- [X] T003 [P] Add unit tests for `scoreForPlayer` in `src/core/__tests__/behavior/score-evaluation.test.ts`
- [X] T004 [P] Add unit tests for `allLegalMoves` in `src/core/__tests__/behavior/all-legal-moves.test.ts`
- [X] T009 [P] Add property-based test: `allLegalMoves` returns only moves that `applyMove` accepts without throwing in `src/core/__tests__/behavior/all-legal-moves.test.ts`

### Implementation for Foundational

- [X] T005 [P] Implement `scoreForPlayer(state, player)` in `src/core/score.ts`
- [X] T006 [P] Implement `allLegalMoves(state)` helper in `src/core/bots/legal-moves.ts` (combines placements and joins into a single `Move[]`)
- [X] T007 Define `BotFunction` type and `BotStrategy` union in `src/core/bots/index.ts`
- [X] T008 Re-export bot types from `src/core/index.ts`

**Checkpoint**: Foundation ready — `scoreForPlayer`, `allLegalMoves`, `BotFunction` type all exist and have passing tests.

---

## Phase 3: User Story 1 — Play Against Random Bot (Priority: P1) 🎯 MVP

**Goal**: A player can select "Random" opponent, choose their role (P1/P2), and play a complete game where the bot makes uniformly random legal moves.

**Independent Test**: Select Random opponent → play full game → verify bot never illegal-moves and distribution is uniform across many games.

### Tests for User Story 1 (Write first, ensure they fail) ⚠️

- [X] T010 [P] [US1] Unit test: `randomBot` returns a legal move for a mid-game state in `src/core/__tests__/behavior/bot-strategies.test.ts`
- [X] T011 [P] [US1] Property test: `randomBot` never returns an illegal move (fast-check over random states) in `src/core/__tests__/behavior/bot-strategies.test.ts`
- [X] T012 [P] [US1] Statistical test: `randomBot` uniform distribution across legal moves (chi-squared over many samples) in `src/core/__tests__/behavior/bot-strategies.test.ts`
- [X] T013 [P] [US1] Integration test: `useBotGame` auto-invokes Random bot on bot's turn in `src/ui/hooks/__tests__/useBotGame.test.tsx`

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement `randomBot` in `src/core/bots/random.ts`
- [X] T015 [US1] Implement `useBotGame` hook in `src/ui/hooks/useBotGame.ts` (wraps `useGameSession`, accepts `botDelayMs` option defaulting to 300, auto-invokes bot when `currentPlayer` is the bot after the configured delay; tests pass `delayMs: 0` to skip)
- [X] T016 [US1] Implement `SetupScreen` component in `src/ui/components/SetupScreen.tsx` (supports: opponent = Human | Random; playerRole = HEADS | TAILS)
- [X] T017 [US1] Wire `SetupScreen` + `useBotGame` into `src/ui/App.tsx` (show setup before game, pass chosen opponent/role to session creation)
- [X] T018 [P] [US1] Add a11y test for `SetupScreen` in `src/ui/components/__tests__/SetupScreen.test.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 — Play Against Greedy Bot (Priority: P2)

**Goal**: A player can select "Greedy" opponent, choose their role, and play a complete game where the bot always picks the move maximizing immediate score delta (including encirclement).

**Independent Test**: Select Greedy opponent → play full game → verify bot consistently scores higher than Random when played head-to-head.

### Tests for User Story 2 (Write first, ensure they fail) ⚠️

- [X] T019 [P] [US2] Unit test: `greedyBot` picks the move with highest score delta in a constructed state in `src/core/__tests__/behavior/bot-strategies.test.ts`
- [X] T020 [P] [US2] Unit test: `greedyBot` tie-breaking is deterministic (stable evaluation order) in `src/core/__tests__/behavior/bot-strategies.test.ts`
- [X] T021 [P] [US2] Unit test: `greedyBot` correctly values encirclement payoff (cycle closure flips) in `src/core/__tests__/behavior/bot-strategies.test.ts`
- [X] T022 [P] [US2] Property test: `greedyBot` never returns an illegal move in `src/core/__tests__/behavior/bot-strategies.test.ts`
- [X] T023 [P] [US2] Integration test: `useBotGame` auto-invokes Greedy bot on bot's turn in `src/ui/hooks/__tests__/useBotGame.test.tsx`

### Implementation for User Story 2

- [X] T024 [P] [US2] Implement `greedyBot` in `src/core/bots/greedy.ts` (evaluates every legal move via `applyMove` + `scoreForPlayer`, deterministic tie-break)
- [X] T025 [US2] Extend `SetupScreen` in `src/ui/components/SetupScreen.tsx` to include "Greedy" opponent option
- [X] T026 [US2] Extend `useBotGame` in `src/ui/hooks/useBotGame.ts` to support `"greedy"` strategy

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 — Bot vs Bot Simulation (Priority: P3)

**Goal**: A developer can run a headless simulation of Random vs Greedy (or any two bots) and get aggregated win/loss/draw/crash stats over N games.

**Independent Test**: Run `runSimulation({ botA: greedyBot, botB: randomBot, games: 1000, alternateStarts: true })` → verify `crashes === 0` and `winsA > winsB`.

### Tests for User Story 3 (Write first, ensure they fail) ⚠️

- [X] T027 [P] [US3] Unit test: `runSimulation` returns correct result shape for a 2-game sample in `src/core/__tests__/bots/simulation.test.ts`
- [X] T028 [P] [US3] Regression test: 1000-game Random vs Greedy with `alternateStarts: true` completes with `crashes === 0` in `src/core/__tests__/bots/simulation.test.ts`
- [X] T029 [P] [US3] Regression test: Greedy wins at least as many as Random over 1000 games with alternating starts in `src/core/__tests__/bots/simulation.test.ts`
- [X] T030 [P] [US3] Unit test: `runSimulation` respects `alternateStarts` (even games = botA P1, odd games = botB P1) in `src/core/__tests__/bots/simulation.test.ts`
- [X] T031 [P] [US3] Performance test: 1000-game simulation completes in under 60s in `src/core/__tests__/bots/simulation.test.ts`

### Implementation for User Story 3

- [X] T032 [P] [US3] Implement `runSimulation(config)` in `src/core/bots/simulate.ts`
- [X] T033 [P] [US3] Implement `SimulationConfig` and `SimulationResult` types in `src/core/bots/simulate.ts`
- [X] T034 [US3] Export simulation types and runner from `src/core/bots/index.ts`
- [X] T035 [US3] Re-export simulation from `src/core/index.ts`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, coverage, cleanup, and validation.

- [X] T036 [P] Ensure `src/core/bots/` directory maintains ≥ 90% test coverage (overall core coverage: 93.39%)
- [X] T037 [P] Run `bun run lint` and fix any issues in new files
- [X] T038 [P] Run `bun run typecheck` and fix any `tsc --noEmit` errors
- [X] T039 [P] Verify `SetupScreen` touch targets are ≥ 44×44 CSS pixels and have visible focus indicators
- [X] T040 [P] Verify `SetupScreen` does not convey information by color alone (use labels + shapes)
- [X] T041 Run full test suite (`bun run test:run`) and confirm zero failures
- [X] T042 Validate quickstart.md Phase-1 deliverable: run a 100-game simulation manually and confirm output matches `SimulationResult` shape documented in data-model.md
- [X] T044 [P] Add per-move latency benchmark for `randomBot` and `greedyBot` on a worst-case state (all 12 coins placed, many joins) in `src/core/__tests__/behavior/bot-perf.test.ts`
- [X] T045 [P] [US1] Define and export `GameSetupOptions` and `BotStrategy` UI types in `src/ui/types/setup.ts`
- [X] T046 [P] Add unit test: `randomBot` and `greedyBot` throw Error when called with an invalid `GameState` in `src/core/__tests__/behavior/bot-strategies.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion.
  - US1 (Random Bot) must complete before shared UI components can be assumed stable for US2.
  - US2 (Greedy Bot) extends the same `SetupScreen` and `useBotGame` from US1.
  - US3 (Simulation) is core-only and can proceed in parallel with US2 once Foundational is done.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational. Reuses `SetupScreen` and `useBotGame` scaffolding from US1; can begin UI work in parallel if the scaffolding API is agreed upon.
- **User Story 3 (P3)**: Can start after Foundational. Pure core work; independent of US1 and US2 UI.

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Core bot implementation before UI integration.
- Story complete before moving to next priority.

### Parallel Opportunities

- **Phase 2**: `scoreForPlayer` and `allLegalMoves` can be developed in parallel.
- **Phase 3 core**: `randomBot` implementation and its tests can run in parallel with `useBotGame` hook design.
- **Phase 4 core**: `greedyBot` implementation and its tests can run in parallel with US3 simulation work.
- **Phase 5**: `runSimulation` and all simulation tests are independent of UI.
- **Phase 6 polish**: lint, typecheck, coverage, and a11y checks can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch bot core and UI tests together:
Task: "Unit test: randomBot legal move" in src/core/__tests__/behavior/bot-strategies.test.ts
Task: "Integration test: useBotGame auto-invokes Random bot" in src/ui/hooks/__tests__/useBotGame.test.tsx

# Launch core implementation and UI component together:
Task: "Implement randomBot" in src/core/bots/random.ts
Task: "Implement SetupScreen" in src/ui/components/SetupScreen.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Random Bot + UI)
4. **STOP and VALIDATE**: Play a complete game against Random bot, verify no crashes
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Random Bot) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Greedy Bot) → Test independently → Deploy/Demo
4. Add User Story 3 (Simulation) → Run 1000-game regression → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: User Story 1 (Random bot core + UI)
   - Developer B: User Story 2 (Greedy bot core — UI reuse from US1)
   - Developer C: User Story 3 (Simulation harness — pure core)
3. Stories complete and integrate independently.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Each user story should be independently completable and testable.
- Verify tests fail before implementing.
- Commit after each task or logical group.
- Stop at any checkpoint to validate story independently.
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence.
