# Tasks: Game Loop and CLI

**Input**: Design documents from `/specs/003-game-loop-cli/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Test tasks included per project convention (90% coverage threshold on `src/core/`, pre-commit hook runs full suite).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create CLI directory and configure build entry point

- [ ] T001 Create src/cli/ directory with stub files: src/cli/main.ts, src/cli/parser.ts, src/cli/renderer.ts
- [ ] T002 [P] Add CLI script entry to package.json scripts (e.g., `"cli": "bun run src/cli/main.ts"`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core session types and pure functions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Define GameSession, TurnResult, FinalScore types and createSession in src/core/session.ts
- [ ] T004 Implement hasLegalMoves and computeFinalScore in src/core/session.ts
- [ ] T016 Implement consecutive pass tracking and terminal flag in src/core/session.ts
- [ ] T017 Implement random first player selection with seedable random source in src/core/session.ts
- [ ] T005 [P] Write foundational session unit tests in src/core/__tests__/session.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 – Play Full Game in the Terminal (Priority: P1) 🎯 MVP

**Goal**: A player can start the CLI, enter moves, see the board update, and reach a terminal state with a final score.

**Independent Test**: Run `bun run cli`, enter a sequence of legal PLACE and JOIN moves, and verify the game ends with a winner or draw displayed.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US1] Write parser unit tests in src/cli/__tests__/parser.test.ts
- [ ] T007 [P] [US1] Write renderer unit tests in src/cli/__tests__/renderer.test.ts

### Implementation for User Story 1

- [ ] T008 [US1] Implement step function with move application and player alternation in src/core/session.ts
- [ ] T009 [P] [US1] Implement command parser in src/cli/parser.ts
- [ ] T010 [P] [US1] Implement ASCII board renderer in src/cli/renderer.ts
- [ ] T011 [US1] Implement main.ts stdin loop and game orchestration in src/cli/main.ts (responsibilities: random first-player announcement, ASCII board print, turn prompt with player name and coins remaining, read-parse-step loop, invalid-move re-prompt without turn consumption, forced-pass message, terminal score display, and graceful EOF/Ctrl+D exit)

**Checkpoint**: At this point, a complete game can be played in the terminal from start to finish.

---

## Phase 4: User Story 2 – Forced Pass Detection (Priority: P2)

**Goal**: When a player has zero legal moves, the system automatically forces a pass. A voluntary PASS when legal moves exist is rejected.

**Independent Test**: Construct a board state with no legal moves and verify that `step` returns a forced pass without consuming player input.

### Tests for User Story 2

- [ ] T012 [P] [US2] Write forced pass detection tests in src/core/__tests__/session.test.ts

### Implementation for User Story 2

- [ ] T013 [US2] Implement forced pass auto-detection in src/core/session.ts step function
- [ ] T014 [US2] Reject voluntary PASS when hasLegalMoves is true in src/core/session.ts step function

**Checkpoint**: At this point, forced passes are enforced and voluntary passes are blocked.

---

## Phase 5: User Story 3 – Terminal Detection and Final Scoring (Priority: P3)

**Goal**: The game ends after two consecutive passes and displays the final score and winner.

**Independent Test**: Simulate two consecutive passes programmatically and verify the session becomes terminal with the correct FinalScore.

### Tests for User Story 3

- [ ] T015 [P] [US3] Write terminal detection and scoring tests in src/core/__tests__/session.test.ts

### Implementation for User Story 3

> Note: The core implementation for terminal detection (T016) and random first-player (T017) was moved to Phase 2 (Foundational) because both are required by User Story 1. This phase focuses on validating those capabilities.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Coverage, property tests, API exports, and end-to-end validation

- [ ] T018 [P] Add fast-check property tests for session invariants in src/core/__tests__/session.test.ts
- [ ] T019 Export session public API from src/core/index.ts
- [ ] T020 Run full test suite and verify ≥90% coverage on src/core/
- [ ] T022 [P] Add lightweight performance validation for SC-002 in src/core/__tests__/session.test.ts (simulate terminal-state computation 100× and assert <1s total)
- [ ] T023 [P] Add EOF graceful exit test in src/cli/__tests__/main.test.ts (simulate Ctrl+D / stdin close and verify process exits 0 without error)
- [ ] T021 Dogfood: play a complete terminal game and document any rule ambiguities discovered

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 session logic but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1/US2 session logic but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core implementation before CLI integration
- Story complete before moving to next priority

### Parallel Opportunities

- T005 (foundational tests) can run in parallel with T004, T016, T017 (foundational impl) once T003 is done
- T006 and T007 (US1 tests) can run in parallel
- T009 and T010 (parser + renderer) can run in parallel
- T012 (US2 tests) and T013 (US2 impl) can overlap with US1 polish
- T015 (US3 tests) can overlap with earlier stories once foundational session logic is complete
- T022 (performance) and T023 (EOF exit) can run in parallel during polish

---

## Parallel Example: User Story 1

```bash
# Launch parser and renderer tests together:
Task: "Write parser unit tests in src/cli/__tests__/parser.test.ts"
Task: "Write renderer unit tests in src/cli/__tests__/renderer.test.ts"

# Launch parser and renderer implementation together:
Task: "Implement command parser in src/cli/parser.ts"
Task: "Implement ASCII board renderer in src/cli/renderer.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Play a complete game in the terminal
5. Dogfood and document rule ambiguities

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Terminal play works (MVP!)
3. Add User Story 2 → Test independently → Forced pass enforcement works
4. Add User Story 3 → Test independently → Terminal detection works
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (includes T016 terminal detection and T017 random first player)
2. Once Foundational is done:
   - Developer A: User Story 1 (parser, renderer, main loop)
   - Developer B: User Story 2 (forced pass logic + tests)
   - Developer C: User Story 3 (terminal detection tests + scoring validation)
3. Stories complete and integrate independently via the shared session.ts interface

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
