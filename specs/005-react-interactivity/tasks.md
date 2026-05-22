# Tasks: React Interactivity — Browser Gameplay

**Input**: Design documents from `/specs/005-react-interactivity/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/component-props.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: CSS foundations and animation framework for interactive states

- [X] T001 [P] Add CSS transition keyframes and interactive state classes to `src/ui/App.css` (coin-selected ring, coin-flipping transition, dot-hover highlight, preview-line style)
- [X] T002 [P] Add global keyboard handler for Escape key cancellation in `src/ui/App.css` or `src/ui/pages/GamePage.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core interactive extensions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Extend `GridView` in `src/ui/components/GridView.tsx` with `onIntersectionClick`, `onIntersectionHover`, `hoveredPosition`, and `legalPlacements` props; make dots clickable and hoverable
- [X] T004 Extend `CoinView` in `src/ui/components/CoinView.tsx` with `onClick`, `isSelected`, `isHighlighted`, and `isFlipping` props; add gold ring for selected state, CSS transition for flipping
- [X] T005 Extend `BoardView` in `src/ui/components/BoardView.tsx` with `onCoinClick`, `onIntersectionClick`, `onIntersectionHover`, `selectedCoin`, `hoveredPosition`, `previewEdge`, `legalPlacements`, and `flippingCoins` props; wire down to children

**Checkpoint**: Foundation ready — GridView, CoinView, and BoardView are interactive shells

---

## Phase 3: User Story 1 — Place a Coin (Priority: P1) 🎯 MVP

**Goal**: Click an empty intersection, choose heads/tails, place a coin

**Independent Test**: Load game page, click empty intersection, select face, assert coin appears with correct face and player switches

### Tests for User Story 1

- [X] T006 [P] [US1] Write `FaceSelector.test.tsx` asserting face selector renders H/T buttons and calls `onSelect`/`onCancel`
- [X] T007 [P] [US1] Write `GridView.test.tsx` update asserting clickable dots call `onIntersectionClick` with correct position
- [X] T008 [P] [US1] Write `GamePage.test.tsx` test asserting clicking an empty intersection opens face selector, selecting face places coin

### Implementation for User Story 1

- [X] T009 [P] [US1] Implement `FaceSelector` in `src/ui/components/FaceSelector.tsx` (inline H/T choice, positioned near clicked intersection)
- [X] T010 [US1] Implement PLACE move construction in `src/ui/pages/GamePage.tsx`: click empty intersection → SELECTING_FACE → select face → `step(session, PlaceMove)` → back to IDLE
- [X] T011 [US1] Wire `FaceSelector` into `GamePage` conditionally when `movePhase.kind === "SELECTING_FACE"`

**Checkpoint**: At this point, `bun run dev` shows a board where clicking empty intersections lets you place coins. User Story 1 is independently testable.

---

## Phase 4: User Story 2 — Join Two Coins (Priority: P1)

**Goal**: Click one coin, then a second coin, to create a JOIN edge

**Independent Test**: Load game page, click first coin, click second coin, assert edge appears; test illegal join rejection and cancellation

### Tests for User Story 2

- [X] T012 [P] [US2] Write `CoinView.test.tsx` update asserting `isSelected` prop renders gold ring
- [X] T013 [P] [US2] Write `BoardView.test.tsx` update asserting preview line renders when `previewEdge` prop is provided
- [X] T014 [P] [US2] Write `GamePage.test.tsx` update asserting JOIN flow: select first coin, select second, edge appears; illegal join shows feedback; Escape cancels

### Implementation for User Story 2

- [X] T015 [US2] Implement JOIN move construction in `src/ui/pages/GamePage.tsx`: click coin → SELECTING_SECOND_COIN → click second coin → `step(session, JoinMove)` → back to IDLE; handle illegal move error feedback
- [X] T016 [US2] Add Escape key handler and same-coin-click cancellation in `GamePage` to exit SELECTING_SECOND_COIN
- [X] T017 [US2] Add brief illegal-move visual feedback (e.g., shake animation on rejected coin) in `CoinView.tsx` or `App.css`

**Checkpoint**: At this point, coins can be joined. User Story 2 is independently testable.

---

## Phase 5: User Story 3 — Hover States for Legal Moves (Priority: P2)

**Goal**: Highlight legal placements and JOIN targets on hover

**Independent Test**: Hover over empty intersection and coins; assert correct highlights and preview lines appear only for legal targets

### Tests for User Story 3

- [X] T018 [P] [US3] Write `GridView.test.tsx` update asserting legal placement dots are highlighted on hover
- [X] T019 [P] [US3] Write `BoardView.test.tsx` update asserting preview line appears only when `previewEdge` is provided

### Implementation for User Story 3

- [X] T020 [P] [US3] In `GamePage.tsx`, pre-compute `legalPlacements` set and pass to `BoardView`/`GridView`; implement `onIntersectionHover` to update hover state
- [X] T021 [US3] In `GamePage.tsx`, when `movePhase.kind === "SELECTING_SECOND_COIN"`, compute whether hovered coin is a legal JOIN target and set `previewEdge` accordingly
- [X] T022 [US3] In `GridView.tsx`, render hover highlight (larger dot + light green ring) for legal placements
- [X] T023 [US3] In `CoinView.tsx`, render hover highlight for legal JOIN targets when a first coin is selected

**Checkpoint**: At this point, hover feedback works. User Story 3 is independently testable.

---

## Phase 6: User Story 4 — Animate Coin Flips (Priority: P2)

**Goal**: Coins inside a closed cycle briefly animate their face flip

**Independent Test**: Construct a PLACE that closes a cycle; assert captured coins transition fill/stroke color over 500ms

### Tests for User Story 4

- [X] T024 [P] [US4] Write `CoinView.test.tsx` update asserting `isFlipping` prop applies CSS transition class
- [X] T025 [P] [US4] Write `GamePage.test.tsx` update asserting after a cycle-closing PLACE, `flippingCoins` set contains captured coin positions

### Implementation for User Story 4

- [X] T026 [P] [US4] In `CoinView.tsx`, add CSS transition class when `isFlipping` is true (`transition: fill 500ms ease, stroke 500ms ease`)
- [X] T027 [US4] In `GamePage.tsx`, after each successful `step`, diff `previousSession.state.coins` with `newSession.state.coins` to find flipped positions; populate `flippingCoins` set
- [X] T028 [US4] In `GamePage.tsx`, block new move input while `flippingCoins` is non-empty (set `isAnimating` flag); clear `flippingCoins` after 500ms timeout
- [X] T029 [US4] Verify `App.css` contains `.coin-flipping` class with correct `transition` properties

**Checkpoint**: At this point, coin flip animations work. User Story 4 is independently testable.

---

## Phase 7: User Story 5 — Play a Full Game to Completion (Priority: P1)

**Goal**: Turn management, auto-pass, terminal detection, New Game

**Independent Test**: Play through a game to terminal state; assert auto-pass triggers, game ends, score displays, New Game resets

### Tests for User Story 5

- [X] T030 [P] [US5] Write `TurnIndicator.test.tsx` asserting it displays current player, coins remaining, and notice text
- [X] T031 [P] [US5] Write `GameOverPanel.test.tsx` asserting it displays score and calls `onNewGame`
- [X] T032 [P] [US5] Write `GamePage.test.tsx` update asserting auto-pass triggers when no legal moves, terminal state shows GameOverPanel, New Game resets session

### Implementation for User Story 5

- [X] T033 [P] [US5] Implement `TurnIndicator` in `src/ui/components/TurnIndicator.tsx` (player name, coins remaining, auto-pass notice)
- [X] T034 [P] [US5] Implement `GameOverPanel` in `src/ui/components/GameOverPanel.tsx` (final score heads/tails/winner, New Game button)
- [X] T035 [US5] In `GamePage.tsx`, add `useEffect` for auto-pass: when `!hasLegalMoves(session) && !session.isTerminal`, show notice, delay 1s, call `step(session, PASS)`
- [X] T036 [US5] In `GamePage.tsx`, when `session.isTerminal`, disable all input handlers and render `GameOverPanel`
- [X] T037 [US5] In `GamePage.tsx`, implement `onNewGame` handler that calls `createSession()` to reset state
- [X] T038 [US5] Wire `GamePage` into `src/ui/App.tsx` replacing `DevPage` as the default route

**Checkpoint**: At this point, a full game can be played in the browser. This is the sprint exit criteria.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality gate, dev page preservation, documentation

- [X] T039 [P] Ensure `src/ui/pages/DevPage.tsx` from Sprint 4 is preserved and accessible (either as separate route or commented import in App.tsx)
- [X] T040 [P] Run full quality gate: `bun run lint && bun run typecheck && bun run test:run` — fix any issues
- [X] T041 Validate `quickstart.md` by playing a full game in the browser and confirming all scenarios work
- [X] T042 Verify no new exports needed in `src/core/index.ts` for the UI layer (should use existing `createSession`, `step`, `hasLegalMoves`, `computeFinalScore`, `applyMove`, types)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–7)**: All depend on Foundational phase completion
  - US1 and US2 are the core MVP and should be done first
  - US3, US4, US5 can proceed in parallel after US1+US2 (different concerns: hover, animation, session management)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **US2 (P1)**: Can start after Foundational. No dependencies on US1 (JOIN doesn't need PLACE to work in tests — can mock state with coins).
- **US3 (P2)**: Depends on US1 and US2 being complete (needs PLACE and JOIN working to test hover feedback).
- **US4 (P2)**: Depends on US1 (needs PLACE to close cycles). Can be developed in parallel with US2 and US3.
- **US5 (P1)**: Depends on US1 and US2 (needs both move types for a full game). Should be last or concurrent with US3/US4.

### Within Each User Story

- Tests should be written first (TDD), then implementation
- Components are independent files and can be developed in parallel
- GamePage integration happens after sub-components are ready

### Parallel Opportunities

- T001, T002 (Setup) can run in parallel
- T003, T004, T005 (Foundational) can run in parallel
- T009 (FaceSelector) and T015 (JOIN GamePage logic) can run in parallel after Foundation
- T020, T022, T023 (hover) can run in parallel
- T026, T027, T028 (animation) can run in parallel
- T033, T034, T035, T036, T037 (US5 components) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch FaceSelector implementation and tests together:
Task: "Implement FaceSelector in src/ui/components/FaceSelector.tsx"
Task: "Write FaceSelector test in src/ui/components/__tests__/FaceSelector.test.tsx"

# Then integrate into GamePage:
Task: "Implement PLACE move construction in src/ui/pages/GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (CSS animations)
2. Complete Phase 2: Foundational (extend BoardView, CoinView, GridView)
3. Complete Phase 3: US1 (PLACE moves work)
4. Complete Phase 4: US2 (JOIN moves work)
5. **STOP and VALIDATE**: `bun run dev` — can place coins and join them

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → PLACE works → Validate
3. Add US2 → JOIN works → Validate
4. Add US3 → Hover feedback works → Validate
5. Add US4 → Flip animations work → Validate
6. Add US5 → Full game playable → Validate (this is the sprint exit criteria)
7. Polish → Quality gate passes

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (FaceSelector + PLACE)
   - Developer B: US2 (JOIN selection + error feedback)
   - Developer C: US3 (hover highlights)
3. US1 + US2 converge on GamePage integration
4. Developer A or D: US4 (flip animations)
5. Developer B or E: US5 (auto-pass, GameOverPanel, New Game)
6. Team: Polish together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- The engine (`step`, `applyMove`) is never modified by this sprint
- All interactivity lives in `src/ui/`; `src/core/` is read-only
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently
