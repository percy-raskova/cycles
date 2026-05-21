# Tasks: Move Application — Flips and Encirclement

**Input**: Design documents from `/specs/002-move-application/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, quickstart.md

**Tests**: Included — the feature specification mandates property-based testing as exit criteria.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the project for Sprint 2 development

- [ ] T001 Update `src/core/types.ts` to add `Move` discriminated union (`PlaceMove`, `JoinMove`, `PassMove`)
- [ ] T002 Update `src/core/index.ts` to export `Move` types and `applyMove` (stub export initially)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Geometric primitives and graph algorithms that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Add `pointInPolygon(point, polygon)` to `src/core/geometry.ts` using ray-casting algorithm for integer grid coordinates
- [ ] T004 [P] Write example tests in `src/core/__tests__/geometry.test.ts` for `pointInPolygon`: square, triangle, point on boundary, point outside
- [ ] T005 [P] Write fast-check property test in `src/core/__tests__/geometry.test.ts`: for any simple polygon on the 7×7 grid, `pointInPolygon` matches brute-force grid enumeration
- [ ] T006 Add `findCycle(state, a, b)` to `src/core/move.ts` using BFS shortest path on existing edges to find the cycle path when JOIN(a,b) closes a cycle; returns `null` if no cycle
- [ ] T007 Add `coinsInsideCycle(state, cyclePath)` to `src/core/move.ts` using `pointInPolygon` to test every coin not on the cycle boundary

**Checkpoint**: Foundation ready — `pointInPolygon` is tested, `findCycle` and `coinsInsideCycle` compile, and geometry primitives are property-tested. User story implementation can now begin.

---

## Phase 3: User Story 1 — Apply Simple Moves (Priority: P1) 🎯 MVP

**Goal**: Given any legal simple move (PLACE, JOIN without cycle, PASS), return a correctly updated `GameState`.

**Independent Test**: `bun run test:run` executes `src/core/__tests__/move.test.ts` and all simple-move scenarios pass.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US1] Write example tests in `src/core/__tests__/move.test.ts` for PLACE: coin appears, supply decreases, player switches, passCount resets, lastAction set
- [ ] T009 [P] [US1] Write example tests in `src/core/__tests__/move.test.ts` for simple JOIN: edge added, endpoints flip, player switches, passCount resets
- [ ] T010 [P] [US1] Write example tests in `src/core/__tests__/move.test.ts` for PASS: passCount increments, player switches, lastAction set, no other state changes
- [ ] T011 [P] [US1] Write example tests in `src/core/__tests__/move.test.ts` for illegal move rejection: occupied PLACE throws, blocked JOIN throws, duplicate JOIN throws

### Implementation for User Story 1

- [ ] T012 [US1] Implement `applyMove(state, move)` in `src/core/move.ts` for PLACE variant — delegate to `placeCoin` from `state.ts`
- [ ] T013 [US1] Implement `applyMove` JOIN variant (simple, no cycle) in `src/core/move.ts` — delegate to `joinCoins` from `state.ts`
- [ ] T014 [US1] Implement `applyMove` PASS variant in `src/core/move.ts` — update passCount, switch player, set lastAction

**Checkpoint**: `applyMove` works for all simple moves, all US1 tests pass, and `bun run test:run` is green.

---

## Phase 4: User Story 2 — Apply Cyclic Join with Encirclement (Priority: P1)

**Goal**: When a JOIN creates a cycle, correctly identify and flip all interior coins.

**Independent Test**: `bun run test:run` executes `src/core/__tests__/move.test.ts` and all encirclement scenarios produce exactly the expected flips.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US2] Write example tests in `src/core/__tests__/move.test.ts` for cyclic JOIN rectangle: 4 boundary coins + 1 interior → interior flips
- [ ] T016 [P] [US2] Write example tests in `src/core/__tests__/move.test.ts` for cyclic JOIN empty interior: only endpoints flip
- [ ] T017 [P] [US2] Write example tests in `src/core/__tests__/move.test.ts` for cyclic JOIN multiple interior coins: all interior coins flip
- [ ] T018 [P] [US2] Write example tests in `src/core/__tests__/move.test.ts` for non-cyclic JOIN: endpoints flip, no interior detection performed

### Implementation for User Story 2

- [ ] T019 [US2] Extend `applyMove` JOIN variant in `src/core/move.ts` to detect cycles: call `findCycle`, and if a cycle is found, flip all interior coins via `coinsInsideCycle` in addition to endpoints
- [ ] T020 [US2] Verify `findCycle` returns the correct closed polygon path for rectangular, triangular, and irregular cycles in example tests

**Checkpoint**: Cyclic JOINs flip exactly the right coins, all US2 tests pass, and `bun run test:run` is green.

---

## Phase 5: User Story 3 — Property Test Validation (Priority: P1)

**Goal**: Prove `applyMove` preserves invariants across adversarial random move sequences.

**Independent Test**: `bun run test:run` executes `src/core/__tests__/oracle.test.ts` and `src/core/__tests__/move.test.ts` with zero failures across thousands of generated cases.

### Tests for User Story 3 ⚠️

> **NOTE: Property tests can be written incrementally alongside US1/US2, but must be hardened in this phase**

- [ ] T021 [P] [US3] Add fast-check property test in `src/core/__tests__/oracle.test.ts`: generate random legal move sequences from initial state, assert `coins.size + coinsRemaining === 12` at every step
- [ ] T022 [P] [US3] Add fast-check property test in `src/core/__tests__/oracle.test.ts`: generate random legal move sequences, assert face parity (heads + tails = total placed coins) holds at every step
- [ ] T023 [P] [US3] Add fast-check property test in `src/core/__tests__/oracle.test.ts`: after every `applyMove`, `legalPlacements` and `legalJoins` return valid results for the new state

### Implementation for User Story 3

- [ ] T024 [US3] Add `isValidState(state)` helper in `src/core/move.ts` or `src/core/state.ts` — a public, independently testable invariant checker that validates coin count, face consistency, and edge validity

**Checkpoint**: All property tests pass with default fast-check numRuns (100). No flakiness. Invariant checker survives adversarial move sequences.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure the module is clean, well-documented, and meets project quality gates

- [ ] T025 [P] Run `bun run lint:write` to auto-fix any formatting drift in new/modified files
- [ ] T026 Run `bun run typecheck` to verify zero TypeScript errors across `src/core/`
- [ ] T027 [P] Verify test coverage ≥ 90% on `src/core/` by running `bun run test:run -- --coverage`
- [ ] T028 Update `src/core/index.ts` to ensure the public API surface is minimal and correct (no internal helpers exported unless needed for tests)
- [ ] T029 [P] Verify `applyMove` cognitive complexity ≤ 15 per Biome rule; extract sub-functions if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - US1, US2, US3 can proceed sequentially or with US3 tests written incrementally alongside US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 — depends on `applyMove` JOIN variant being implemented
- **User Story 3 (P3)**: Can start after US2 — depends on `applyMove` being complete for all move types so the property test has a full surface to exercise

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Core implementation before polish

### Parallel Opportunities

- T003, T004, T005 (geometry pointInPolygon + example tests + property tests) can run in parallel
- T008, T009, T010, T011 (US1 example tests for PLACE, JOIN, PASS, illegal moves) can run in parallel
- T015, T016, T017, T018 (US2 example tests for encirclement scenarios) can run in parallel once T013 is done
- T021, T022, T023 (US3 property tests for invariants) can run in parallel once T019 is done
- T025, T027 (lint + coverage check) can run in parallel after all implementation is done

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Write example tests for cyclic JOIN rectangle"
Task: "Write example tests for cyclic JOIN empty interior"
Task: "Write example tests for cyclic JOIN multiple interior"
Task: "Write example tests for non-cyclic JOIN"

# Then implement:
Task: "Extend applyMove JOIN variant to detect cycles and flip interior coins"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (add Move types)
2. Complete Phase 2: Foundational (geometry + cycle detection primitives)
3. Complete Phase 3: User Story 1 (simple moves with tests)
4. **STOP and VALIDATE**: `bun run test:run` passes, coverage ≥ 90%

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Test independently → simple moves work
3. US2 → Test independently → cyclic JOINs with encirclement work
4. US3 → Harden property tests → adversarial invariant validation passes
5. Polish → Lint, typecheck, coverage gate, complexity check

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
