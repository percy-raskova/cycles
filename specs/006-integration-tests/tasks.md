# Tasks: Integration Tests

**Input**: Design documents from `/specs/006-integration-tests/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/test-api.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Test Infrastructure)

**Purpose**: Create the `tests/` directory structure and verify the test runner picks it up

- [ ] T001 [P] Create `tests/integration/` directory with `tests/integration/helpers/` subdirectory
- [ ] T002 Verify Vitest discovers tests in `tests/integration/` (run `bun run test:run tests/integration` and confirm it finds files)
- [ ] T003 [P] Add `@testing-library/user-event` setup configuration for integration tests (already installed; verify cleanup behavior)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Test helpers and the minimal GamePage testability refactor that ALL user story tests depend on

**⚠️ CRITICAL**: No integration test can be written until this phase is complete

- [ ] T004 [P] Implement `tests/integration/helpers/fixtures.ts` with `makeInitialState`, `makeCycleBoardState`, `makeBlockedBoardState`, `makeFullBoardNoEdgesState`, `makeJoinablePairState`
- [ ] T005 [P] Implement `tests/integration/helpers/selectors.ts` with `getCoinAt`, `getDotAt`, `getEdgeBetween`, `getFaceSelector`
- [ ] T006 Extend `GamePage` in `src/ui/pages/GamePage.tsx` with optional `initialSession?: GameSession` prop; use it when provided, otherwise call `createSession()`
- [ ] T007 Implement `tests/integration/helpers/render-game.tsx` with `renderGame` wrapper that mounts GamePage with optional initial session and returns RTL result + user-event instance
- [ ] T008 [P] Write tests for `fixtures.ts` in `tests/integration/helpers/__tests__/fixtures.test.ts` asserting each fixture produces valid GameState

**Checkpoint**: Foundation ready — helpers exist, GamePage accepts initial session, fixtures verified

---

## Phase 3: User Story 1 — Complete Game Flow (Priority: P1) 🎯 MVP

**Goal**: Verify a full game can be played from start to terminal state through GamePage

**Independent Test**: Mount GamePage, programmatically play moves, assert terminal state reached with correct GameOverPanel

- [ ] T009 [P] [US1] Write `tests/integration/game-flow.test.ts` test asserting a sequence of PLACE and JOIN moves reaches terminal state and renders GameOverPanel with correct score
- [ ] T010 [P] [US1] Write `tests/integration/game-flow.test.ts` test asserting "New Game" button resets to initial state (empty board, TurnIndicator shows 12 coins, no GameOverPanel)

**Checkpoint**: At this point, the most critical integration path works. US1 is independently testable.

---

## Phase 4: User Story 2 — Move Validation (Priority: P1)

**Goal**: Verify illegal moves are rejected and legal moves are accepted

**Independent Test**: Mount GamePage, attempt illegal moves, assert rejection; apply legal moves, assert acceptance

- [ ] T011 [P] [US2] Write `tests/integration/move-validation.test.ts` test asserting placing a coin on an occupied intersection is rejected (turn does not switch)
- [ ] T012 [P] [US2] Write `tests/integration/move-validation.test.ts` test asserting joining coins not on a queen line is rejected (illegal-move feedback shown)
- [ ] T013 [P] [US2] Write `tests/integration/move-validation.test.ts` test asserting a PASS move is rejected when legal moves exist
- [ ] T014 [P] [US2] Write `tests/integration/move-validation.test.ts` test asserting auto-pass triggers correctly when no legal moves exist (turn passes, pass count increments)

**Checkpoint**: At this point, move validation is covered. US2 is independently testable.

---

## Phase 5: User Story 3 — Cycle Closure (Priority: P2)

**Goal**: Verify cycle-closing JOIN flips interior and endpoint coins

**Independent Test**: Build square cycle fixture, close it through GamePage, assert flips

- [ ] T015 [P] [US3] Write `tests/integration/cycle-closure.test.ts` test asserting closing a square cycle creates the edge and flips all interior coins
- [ ] T016 [P] [US3] Write `tests/integration/cycle-closure.test.ts` test asserting the `coin-flipping` CSS class is applied to flipped coins after a cycle-closing JOIN

**Checkpoint**: At this point, cycle closure is covered. US3 is independently testable.

---

## Phase 6: User Story 4 — Auto-Pass Behavior (Priority: P2)

**Goal**: Verify auto-pass triggers, shows notice, and switches turn after delay

**Independent Test**: Build blocked-board fixture, mount GamePage, assert notice then turn switch

- [ ] T017 [P] [US4] Write `tests/integration/auto-pass.test.ts` test asserting the TurnIndicator displays a "no legal moves — passing" notice when no moves exist
- [ ] T018 [P] [US4] Write `tests/integration/auto-pass.test.ts` test asserting after the auto-pass delay, the turn switches, notice disappears, and pass count increments
- [ ] T019 [P] [US4] Write `tests/integration/auto-pass.test.ts` test asserting no auto-pass triggers in terminal state (GameOverPanel visible, TurnIndicator hidden)

**Checkpoint**: At this point, auto-pass is covered. US4 is independently testable.

---

## Phase 7: User Story 5 — Component Coordination (Priority: P2)

**Goal**: Verify all UI components reflect GameSession state correctly

**Independent Test**: Progress through game phases, assert each component renders correct data

- [ ] T020 [P] [US5] Write `tests/integration/component-coordination.test.ts` test asserting TurnIndicator updates current player and decrements coin count after a PLACE move
- [ ] T021 [P] [US5] Write `tests/integration/component-coordination.test.ts` test asserting selected coin shows `coin-selected` class and legal JOIN targets show `coin-highlighted` class
- [ ] T022 [P] [US5] Write `tests/integration/component-coordination.test.ts` test asserting hovering over a legal empty intersection applies `grid-dot-legal` class and increases dot radius
- [ ] T023 [P] [US5] Write `tests/integration/component-coordination.test.ts` test asserting FaceSelector opens on intersection click, disappears on face selection, and the new coin appears with correct label

**Checkpoint**: At this point, component coordination is covered. US5 is independently testable.

---

## Phase 8: User Story 6 — New Game Reset (Priority: P3)

**Goal**: Verify New Game fully resets all state

**Independent Test**: Play to terminal, click New Game, assert clean slate

- [ ] T024 [P] [US6] Write `tests/integration/new-game-reset.test.ts` test asserting after terminal state + New Game click, the board is empty, TurnIndicator shows initial player with 12 coins, GameOverPanel is gone, and no move phase is active

**Checkpoint**: At this point, reset is covered. US6 is independently testable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Quality gate, performance validation, documentation

- [ ] T025 [P] Run full quality gate: `bun run lint && bun run typecheck && bun run test:run` — fix any issues
- [ ] T026 Verify all integration tests complete in under 30 seconds total (`bun run test:run tests/integration`)
- [ ] T027 Verify no new exports are needed in `src/core/index.ts` (tests should use existing public API only)
- [ ] T028 [P] Update `specs/006-integration-tests/quickstart.md` with final test running instructions if they differ from initial draft
- [ ] T029 Verify `src/ui/pages/DevPage.tsx` remains unmodified by this sprint

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user story tests
- **User Stories (Phase 3–8)**: All depend on Foundational phase completion
  - US1 and US2 are the core MVP and should be done first
  - US3, US4, US5, US6 can proceed in parallel after US1+US2 (different concerns)
- **Polish (Phase 9)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **US2 (P1)**: Can start after Foundational. No dependencies on US1.
- **US3 (P2)**: Can start after Foundational. No dependencies on US1/US2 (uses fixtures).
- **US4 (P2)**: Can start after Foundational. No dependencies on US1/US2 (uses fixtures).
- **US5 (P2)**: Can start after Foundational. No dependencies on US1/US2.
- **US6 (P3)**: Can start after Foundational. No dependencies on other stories.

### Within Each User Story

- Each `.test.ts` file is self-contained and can be developed independently
- Test files are independent — no shared mutable state between tests
- Tests within the same file should be ordered from simple to complex

### Parallel Opportunities

- T004, T005 (fixtures + selectors) can run in parallel
- T009, T011, T015, T017, T020, T024 (test files for each user story) can be written in parallel after Foundational phase
- T025, T028 (quality gate + docs) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Write game-flow tests:
Task: "Write tests/integration/game-flow.test.ts asserting full game to terminal"
Task: "Write tests/integration/game-flow.test.ts asserting New Game reset"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (directory structure)
2. Complete Phase 2: Foundational (helpers + GamePage prop)
3. Complete Phase 3: US1 (game flow works)
4. Complete Phase 4: US2 (move validation works)
5. **STOP and VALIDATE**: `bun run test:run tests/integration` — core paths covered

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Full game flow tested → Validate
3. Add US2 → Move validation tested → Validate
4. Add US3 → Cycle closure tested → Validate
5. Add US4 → Auto-pass tested → Validate
6. Add US5 → Component coordination tested → Validate
7. Add US6 → New Game reset tested → Validate
8. Polish → Quality gate passes, <30s execution

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- The engine (`step`, `applyMove`) is never modified by this sprint
- All integration tests use the real engine — zero mocking
- GamePage is the single integration point for all tests
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently
