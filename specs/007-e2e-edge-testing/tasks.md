# Tasks: Comprehensive E2E Edge-Case Testing

**Input**: Design documents from `/specs/007-e2e-edge-testing/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are explicitly requested (FR-011, FR-012, FR-014, FR-015). All test tasks must be written first and must FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Playwright, configure E2E infrastructure, prepare directory structure

- [ ] T001 Install `@playwright/test` as devDependency in `package.json`
- [ ] T002 Add `e2e`, `e2e:ui`, and `e2e:debug` scripts to `package.json`
- [ ] T003 [P] Create `playwright.config.ts` with `webServer` pointing to `bun run preview` on `http://localhost:5173`
- [ ] T004 [P] Add Playwright artifacts (`test-results/`, `playwright-report/`) to `.gitignore`
- [ ] T005 [P] Create `tests/e2e/` directory structure: `fixtures/`, `helpers/`, `specs/`
- [ ] T006 [P] Update `vitest.config.ts` to exclude `tests/e2e/` from Vitest runs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Engine fix for edge-blocking placement (FR-013) and geometric helper exports. MUST complete before ANY user story tests or implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Export `pointOnSegment` helper from `src/core/geometry.ts` (currently private)
- [ ] T008 Add `positionBlockedByEdge` helper in `src/core/geometry.ts` using exported `pointOnSegment`
- [ ] T009 Update `legalPlacements` in `src/core/state.ts` to filter out positions blocked by any existing edge
- [ ] T010 [P] Add defense-in-depth check in `placeCoin` in `src/core/state.ts` to reject blocked positions
- [ ] T011 Update `src/core/index.ts` to export new helpers if needed
- [ ] T012 Write FAILING unit test in `src/core/__tests__/state.test.ts` confirming placement along an edge is rejected

**Checkpoint**: Foundation ready — `legalPlacements` rejects positions on existing edge lines; unit test fails before fix, passes after

---

## Phase 3: User Story 1 — Verify Edge Drawing Rules (Priority: P1) 🎯 MVP

**Goal**: Validate all edge-drawing rules (queen-lines, blocking, crossings, duplicates) and the new placement-blocking rule. Achieve 100% branch coverage for `src/core/geometry.ts` and `src/core/state.ts` join/placement logic.

**Independent Test**: Run `bun run test:run src/core/__tests__/geometry.test.ts src/core/__tests__/state.test.ts` — all tests pass, coverage report shows 100% branches for target files.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Write property-based test for `edgeIntersects` symmetry in `src/core/__tests__/geometry.test.ts`
- [ ] T014 [P] [US1] Write property-based test for `pointInPolygon` completeness on all grid points in `src/core/__tests__/geometry.test.ts`
- [ ] T015 [P] [US1] Write test for collinear overlapping edges rejection in `src/core/__tests__/state.test.ts`
- [ ] T016 [P] [US1] Write test for crossing edges at non-shared point in `src/core/__tests__/state.test.ts`
- [ ] T017 [P] [US1] Write test for boundary rank/file JOIN acceptance in `src/core/__tests__/state.test.ts`
- [ ] T018 [P] [US1] Write test for diagonal edge passing through intermediate coin in `src/core/__tests__/state.test.ts`
- [ ] T019 [P] [US1] Write test for duplicate edge rejection in `src/core/__tests__/state.test.ts`
- [ ] T020 [P] [US1] Write test for non-queen-line JOIN rejection in `src/core/__tests__/state.test.ts`
- [ ] T021 [US1] Write integration test for placement along edge rejection in `tests/integration/edge-placement.test.ts`
- [ ] T022 [P] [US1] Write test for full-board PLACE rejection in `src/core/__tests__/state.test.ts`

### Implementation for User Story 1

- [ ] T023 [US1] Implement any missing geometry validations in `src/core/geometry.ts` to make new tests pass
- [ ] T024 [US1] Implement any missing state validations in `src/core/state.ts` to make new tests pass

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 — Verify Cycle Closure and Coin Flipping (Priority: P1)

**Goal**: Validate cycle closure detection, region flipping, and endpoint handling. Achieve 100% branch coverage for `src/core/move.ts` (cycle detection and flipping).

**Independent Test**: Run `bun run test:run src/core/__tests__/move.test.ts` — all tests pass, coverage report shows 100% branches for `src/core/move.ts`.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T025 [P] [US2] Write test for non-cycle JOIN (only endpoints flip) in `src/core/__tests__/move.test.ts`
- [ ] T026 [P] [US2] Write test for square cycle closure (boundary + interior flip) in `src/core/__tests__/move.test.ts`
- [ ] T027 [P] [US2] Write test for coin on polygon boundary (not flipped, strict interior) in `src/core/__tests__/move.test.ts`
- [ ] T028 [P] [US2] Write test for nested cycle closure (only newly enclosed region flips) in `src/core/__tests__/move.test.ts`
- [ ] T029 [P] [US2] Write test for figure-eight cycle prevention (BFS returns simple cycle) in `src/core/__tests__/move.test.ts`
- [ ] T030 [P] [US2] Write test for coins outside new cycle region (unchanged) in `src/core/__tests__/move.test.ts`
- [ ] T031 [P] [US2] Write test for zero-degree coin scoring at game end in `src/core/__tests__/session.test.ts`
- [ ] T032 [US2] Write integration test for cycle closure edge cases in `tests/integration/cycle-edge-cases.test.ts`

### Implementation for User Story 2

- [ ] T033 [US2] Implement any missing move validations in `src/core/move.ts` to make new tests pass

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 — Verify Terminal Conditions and Auto-Pass (Priority: P2)

**Goal**: Validate terminal detection, auto-pass behavior, and score computation.

**Independent Test**: Run `bun run test:run src/core/__tests__/session.test.ts tests/integration/terminal-scoring.test.ts` — all tests pass.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T034 [P] [US3] Write test for auto-pass when zero legal moves exist in `src/core/__tests__/session.test.ts`
- [ ] T035 [P] [US3] Write test for no auto-pass when exactly one legal move remains in `src/core/__tests__/session.test.ts`
- [ ] T036 [P] [US3] Write test for terminal state after two consecutive passes in `src/core/__tests__/session.test.ts`
- [ ] T037 [P] [US3] Write test for accurate final score computation in `src/core/__tests__/session.test.ts`
- [ ] T038 [P] [US3] Write test for draw outcome when heads === tails in `src/core/__tests__/session.test.ts`
- [ ] T039 [US3] Write integration test for terminal state scoring in `tests/integration/terminal-scoring.test.ts`

### Implementation for User Story 3

- [ ] T040 [US3] Implement any missing session logic in `src/core/session.ts` to make new tests pass

**Checkpoint**: User Story 3 independently functional

---

## Phase 6: User Story 4 — Verify Boundary and Corner Behaviors (Priority: P2)

**Goal**: Validate boundary positions, coin supply exhaustion, and corner case behaviors.

**Independent Test**: Run `bun run test:run src/core/__tests__/state.test.ts tests/integration/boundary-positions.test.ts` — all tests pass.

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T041 [P] [US4] Write test for single-coin JOIN rejection in `src/core/__tests__/state.test.ts`
- [ ] T042 [P] [US4] Write test for adjacent coin JOIN acceptance (row/col/diag) in `src/core/__tests__/state.test.ts`
- [ ] T043 [P] [US4] Write test for coin supply exhaustion (PLACE rejected, JOIN accepted) in `src/core/__tests__/state.test.ts`
- [ ] T044 [P] [US4] Write test for all-12-coins no-joins terminal in `src/core/__tests__/session.test.ts`
- [ ] T045 [P] [US4] Write test for out-of-bounds position rejection in `src/core/__tests__/state.test.ts`
- [ ] T046 [US4] Write integration test for boundary positions and supply exhaustion in `tests/integration/boundary-positions.test.ts`

### Implementation for User Story 4

- [ ] T047 [US4] Implement any missing boundary validations in `src/core/state.ts` to make new tests pass

**Checkpoint**: User Story 4 independently functional

---

## Phase 7: User Story 5 — Verify Dev Server and Build Integrity (Priority: P3)

**Goal**: Validate Vite dev server, production build, and Playwright E2E tests covering critical user journeys.

**Independent Test**: Run `bun run build` (exit 0), then `bun run e2e` (all 5 specs pass).

### Tests for User Story 5 ⚠️

> **NOTE: Write E2E specs FIRST, ensure they FAIL before any UI fixes**

- [ ] T048 [P] [US5] Create Playwright page helpers in `tests/e2e/helpers/page-helpers.ts` (click intersection, select face, click coin, read turn indicator, etc.)
- [ ] T049 [P] [US5] Create board-state fixtures for E2E in `tests/e2e/fixtures/board-states.ts`
- [ ] T050 [P] [US5] Write E2E spec for place-coin journey in `tests/e2e/specs/place-coin.spec.ts`
- [ ] T051 [P] [US5] Write E2E spec for join-coins journey in `tests/e2e/specs/join-coins.spec.ts`
- [ ] T052 [P] [US5] Write E2E spec for cycle-close journey in `tests/e2e/specs/cycle-close.spec.ts`
- [ ] T053 [P] [US5] Write E2E spec for auto-pass journey in `tests/e2e/specs/auto-pass.spec.ts`
- [ ] T054 [US5] Write E2E spec for game-over journey in `tests/e2e/specs/game-over.spec.ts`

### Implementation for User Story 5

- [ ] T055 [US5] Add `data-testid` attributes to interactive elements in `src/ui/components/` if needed for Playwright selectors
- [ ] T056 [US5] Verify `bun run build` completes with exit code 0 and outputs to `dist/`
- [ ] T057 [US5] Verify `bun run dev` starts without errors on expected port

**Checkpoint**: All 5 E2E specs pass against the running application

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Coverage verification, quality gate, findings documentation

- [ ] T058 [P] Run full test suite (`bun run test:run`) and verify all existing + new tests pass
- [ ] T059 [P] Run `bun run lint` and `bun run typecheck` — both pass with zero errors
- [ ] T060 Verify 100% branch coverage for `src/core/geometry.ts`, `src/core/state.ts`, and `src/core/move.ts` via coverage report
- [ ] T061 Run property-based tests (`fast-check`) for 1,000 iterations — no invariant violations
- [ ] T062 Run Playwright E2E suite (`bun run e2e`) — all specs pass
- [ ] T063 Write edge-case testing findings in `specs/007-e2e-edge-testing/findings.md` (document bugs found or state "no new bugs")
- [ ] T064 Update `specs/007-e2e-edge-testing/quickstart.md` if any workflow or command changes
- [ ] T065 Mark all tasks complete in `specs/007-e2e-edge-testing/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–7)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 and can proceed in parallel after Foundational
  - US3 and US4 are P2 and can proceed in parallel after US1/US2 (or simultaneously if staffed)
  - US5 (P3) depends on the application being buildable/runnable; can proceed in parallel with US3/US4
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Parallel With |
|-------|----------|------------|-------------------|
| US1   | P1       | Phase 2    | US2, US3, US4, US5 |
| US2   | P1       | Phase 2    | US1, US3, US4, US5 |
| US3   | P2       | Phase 2    | US1, US2, US4, US5 |
| US4   | P2       | Phase 2    | US1, US2, US3, US5 |
| US5   | P3       | Phase 2    | US1, US2, US3, US4 |

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core engine tests before integration tests
- Integration tests before E2E tests
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001–T006) can run in parallel
- All Foundational tasks (T007–T012) can run in parallel (within Phase 2)
- All US1 tests (T013–T022) can run in parallel
- All US2 tests (T025–T032) can run in parallel
- All US3 tests (T034–T039) can run in parallel
- All US4 tests (T041–T046) can run in parallel
- All US5 E2E specs (T050–T054) can run in parallel once page helpers exist
- All Polish tasks (T058–T065) can run in parallel after all stories complete

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "T013 [P] [US1] Property-based test for edgeIntersects symmetry"
Task: "T014 [P] [US1] Property-based test for pointInPolygon completeness"
Task: "T015 [P] [US1] Test for collinear overlapping edges"
Task: "T016 [P] [US1] Test for crossing edges"
Task: "T017 [P] [US1] Test for boundary rank/file joins"
Task: "T018 [P] [US1] Test for diagonal through-coin edges"
Task: "T019 [P] [US1] Test for duplicate edge rejection"
Task: "T020 [P] [US1] Test for non-queen-line JOIN rejection"
Task: "T021 [US1] Integration test for edge-blocking placement"
Task: "T022 [P] [US1] Test for full-board PLACE rejection"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (engine fix)
3. Complete Phase 3: User Story 1 (edge drawing rules + property tests)
4. **STOP and VALIDATE**: Test US1 independently, verify coverage targets
5. Proceed to remaining stories

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Coverage for geometry + state
3. Add US2 → Test independently → Coverage for move.ts
4. Add US3 → Test independently → Terminal/auto-pass validation
5. Add US4 → Test independently → Boundary/corner validation
6. Add US5 → Test independently → Playwright E2E + build verification
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (geometry + state tests)
   - Developer B: US2 (move.ts + cycle tests)
   - Developer C: US3 + US4 (session + boundary tests)
   - Developer D: US5 (Playwright E2E + build)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Total task count: 65
- Task count per user story: US1 = 12, US2 = 9, US3 = 7, US4 = 7, US5 = 10
- Parallel opportunities: 35+ tasks marked [P]
