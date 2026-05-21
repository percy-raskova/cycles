# Tasks: Core Engine — State and Legality

**Input**: Design documents from `/specs/001-core-engine-state/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, quickstart.md

**Tests**: Included — the feature specification mandates property-based testing as exit criteria.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Consolidate existing scaffold code into the planned structure

- [ ] T001 Remove `src/core/board.ts` and `src/core/game.ts` after extracting reusable logic into `src/core/state.ts`
- [ ] T002 Update `src/core/types.ts` to add `passCount: number` to `GameState`
- [ ] T003 Update `src/core/index.ts` to export `legalPlacements` and `legalJoins` from the new `state.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core geometry and state primitives that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Update `src/core/geometry.ts` — verify `isQueenLine`, `areEdgesEqual`, `edgeIntersects` handle collinear non-intersecting segments correctly
- [ ] T005 [P] Add adversarial property tests for `edgeIntersects` in `src/core/__tests__/geometry.test.ts` using fast-check (random segment pairs on the 7×7 grid)
- [ ] T006 Create `src/core/state.ts` with `createInitialState` (merged from old `board.ts`) and helper `positionKey(pos)`

**Checkpoint**: Foundation ready — `createInitialState` works, geometry primitives are property-tested, and the module compiles. User story implementation can now begin.

---

## Phase 3: User Story 1 — Query Legal Placements (Priority: P1) 🎯 MVP

**Goal**: Given any `GameState`, return the complete set of empty grid intersections where a coin can be placed.

**Independent Test**: `bun run test:run` executes `src/core/__tests__/state.test.ts` and all legal-placement scenarios pass.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [P] [US1] Write example tests in `src/core/__tests__/state.test.ts` for `legalPlacements`: empty board → 49 positions, full board → empty, partial board → excludes occupied
- [ ] T008 [P] [US1] Write fast-check property test in `src/core/__tests__/oracle.test.ts`: for any random board state, every position returned by `legalPlacements` is within bounds and unoccupied

### Implementation for User Story 1

- [ ] T009 [US1] Implement `legalPlacements(state)` in `src/core/state.ts` (returns readonly Position[])

**Checkpoint**: `legalPlacements` is implemented, all US1 tests pass, and `bun run test:run` is green.

---

## Phase 4: User Story 2 — Query Legal Joins (Priority: P1)

**Goal**: Given any `GameState`, return the complete set of unordered coin pairs that can be legally joined by a new edge, enforcing all four geometric/topological constraints.

**Independent Test**: `bun run test:run` executes `src/core/__tests__/state.test.ts` and all legal-join scenarios pass (queen-line, no blocking, no duplicate, no crossing).

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US2] Write example tests in `src/core/__tests__/state.test.ts` for `legalJoins`: aligned with no block → included, blocked by coin → excluded, already connected → excluded, would cross existing edge → excluded, not queen-line → excluded
- [ ] T011 [P] [US2] Write hand-written oracle functions in `src/core/state.ts` (or a `__tests__/helpers.ts`): `oracleIsQueenLine`, `oracleNotBlocked`, `oracleNotDuplicate`, `oracleNotCrossing`
- [ ] T012 [P] [US2] Write fast-check property test in `src/core/__tests__/oracle.test.ts`: for any random board state with coins and edges, every pair returned by `legalJoins` passes all four oracle checks

### Implementation for User Story 2

- [ ] T013 [US2] Implement `legalJoins(state)` in `src/core/state.ts` (returns readonly [Position, Position][])
- [ ] T014 [US2] Implement helper `passesThroughCoin(from, to, coins)` in `src/core/state.ts` (or reuse from old `game.ts` if correct)

**Checkpoint**: `legalJoins` is implemented, all US2 tests pass, edge cases from spec are covered, and `bun run test:run` is green.

---

## Phase 5: User Story 3 — Property Test Validation (Priority: P1)

**Goal**: Prove correctness against adversarial input, not just hand-picked examples.

**Independent Test**: `bun run test:run` executes `src/core/__tests__/oracle.test.ts` and `src/core/__tests__/geometry.test.ts` with zero failures across thousands of generated cases.

### Tests for User Story 3 ⚠️

> **NOTE: Property tests can be written incrementally alongside US1/US2, but must be hardened in this phase**

- [ ] T015 [P] [US3] Harden `src/core/__tests__/geometry.test.ts` with fast-check property: for any two segments on the 7×7 grid, `edgeIntersects` matches the mathematical ground truth (no false negatives, no false positives)
- [ ] T016 [P] [US3] Harden `src/core/__tests__/oracle.test.ts` with fast-check property: generate random board states (0–12 coins, random edges), assert `legalJoins` returns only pairs that pass the hand-written oracle
- [ ] T017 [P] [US3] Add coverage property in `src/core/__tests__/oracle.test.ts`: for small fully-populated boards, `legalJoins` must return at least as many pairs as a brute-force enumeration (sanity check against over-filtering)

### Implementation for User Story 3

- [ ] T018 [US3] Add `isLegalJoin(state, a, b)` helper in `src/core/state.ts` — a public, independently testable decomposition of `legalJoins` that the oracle can call

**Checkpoint**: All property tests pass with the default fast-check numRuns (100). No flakiness. Planarity checker survives adversarial grid-segment input.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure the module is clean, well-documented, and meets project quality gates

- [ ] T019 [P] Run `bun run lint:write` to auto-fix any formatting drift in new/modified files
- [ ] T020 Run `bun run typecheck` to verify zero TypeScript errors across `src/core/`
- [ ] T021 [P] Verify test coverage ≥ 90% on `src/core/` by running `bun run test:run -- --coverage`
- [ ] T022 Delete any dead code left over from the old `board.ts` / `game.ts` consolidation
- [ ] T023 Update `src/core/index.ts` to ensure the public API surface is minimal and correct

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
- **User Story 2 (P2)**: Can start after US1 or in parallel if tests are written first — depends on `createInitialState` and geometry primitives
- **User Story 3 (P3)**: Can start after US2 — depends on `legalPlacements` and `legalJoins` being implemented so the oracle has something to verify

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Helper oracles before property tests (US2)
- Core implementation before polish

### Parallel Opportunities

- T004 and T005 (geometry update + adversarial property tests) can run in parallel
- T007 and T008 (US1 example tests + US1 property tests) can run in parallel
- T010, T011, T012 (US2 example tests + oracle helpers + US2 property tests) can run in parallel once T009 is done
- T015, T016, T017 (US3 hardened property tests) can run in parallel
- T019, T021 (lint + coverage check) can run in parallel after all implementation is done

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Write example tests in src/core/__tests__/state.test.ts for legalJoins"
Task: "Write hand-written oracle functions"
Task: "Write fast-check property test in src/core/__tests__/oracle.test.ts"

# Then implement:
Task: "Implement legalJoins(state) in src/core/state.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (consolidate existing code)
2. Complete Phase 2: Foundational (geometry + state primitives)
3. Complete Phase 3: User Story 1 (legalPlacements with tests)
4. **STOP and VALIDATE**: `bun run test:run` passes, coverage ≥ 90%

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Test independently → legalPlacements works
3. US2 → Test independently → legalJoins works with all 4 constraints
4. US3 → Harden property tests → adversarial validation passes
5. Polish → Lint, typecheck, coverage gate, cleanup

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
