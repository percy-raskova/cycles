# Tasks: React Read-Only SVG Renderer

**Input**: Design documents from `/specs/004-react-readonly-render/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/component-props.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the rendering layer

- [x] T001 [P] Create `src/ui/components/` and `src/ui/pages/` directories
- [x] T002 [P] Add `@/ui` path alias to `vite.config.ts` and `tsconfig.json` for clean component imports
- [x] T003 Install `@testing-library/react` and `jsdom` (or `happy-dom`) as dev dependencies for component testing, and configure Vitest environment

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core geometry and constants that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create `src/ui/lib/coordinates.ts` with `positionToSvg(position: Position) → { x: number, y: number }` mapping using CELL_SIZE and MARGIN
- [x] T005 Create `src/ui/lib/constants.ts` exporting `CELL_SIZE=100`, `MARGIN=50`, `VIEWBOX_SIZE=800`, `COIN_RADIUS=35`, `GRID_SIZE=7`

**Checkpoint**: Foundation ready — coordinate mapping and visual constants are defined and tested

---

## Phase 3: User Story 1 — Render Empty Board (Priority: P1) 🎯 MVP

**Goal**: Render a 7×7 grid of intersection points as SVG background with no coins or edges

**Independent Test**: Mount `BoardView` with `createInitialState()` and assert the SVG contains 14 grid lines + 49 intersection dots, zero coins, zero edges

### Tests for User Story 1

- [x] T006 [P] [US1] Write `GridView.test.tsx` asserting 7 horizontal lines, 7 vertical lines, and 49 intersection dots
- [x] T007 [P] [US1] Write `BoardView.test.tsx` asserting empty GameState renders GridView but no CoinView or EdgeView elements

### Implementation for User Story 1

- [x] T008 [P] [US1] Implement `GridView` in `src/ui/components/GridView.tsx` (horizontal/vertical lines + intersection dots using constants)
- [x] T009 [US1] Implement `BoardView` skeleton in `src/ui/components/BoardView.tsx` (SVG root with viewBox, renders GridView only for now)

**Checkpoint**: At this point, `bun run dev` shows an empty 7×7 grid. User Story 1 is independently testable.

---

## Phase 4: User Story 2 — Render Coins with Face Labels (Priority: P1)

**Goal**: Render each coin as a labeled circle at the correct grid intersection

**Independent Test**: Provide a `GameState` with heads at A1 and tails at B2; assert the SVG contains two circles at the correct coordinates labeled "H" and "T"

### Tests for User Story 2

- [x] T010 [P] [US2] Write `CoinView.test.tsx` asserting a single coin renders a circle at the correct SVG coordinates with the correct text label
- [x] T011 [P] [US2] Update existing `BoardView.test.tsx` (from T007) to assert a GameState with multiple coins renders the correct count of CoinView elements
- [x] T029 [P] [US2] Write reactive removal test: render `BoardView` with a coin, then re-render with the same `GameState` minus that coin, assert the circle is absent and no phantom elements remain

### Implementation for User Story 2

- [x] T012 [P] [US2] Implement `CoinView` in `src/ui/components/CoinView.tsx` (SVG `<g>` with `<circle>` + `<text>` label "H"/"T")
- [x] T013 [US2] Update `BoardView` in `src/ui/components/BoardView.tsx` to map `GameState.coins` values to `CoinView` instances (rendered above GridView in z-order)

**Checkpoint**: At this point, coins render correctly. User Story 2 is independently testable.

---

## Phase 5: User Story 3 — Render Edges as Line Segments (Priority: P1)

**Goal**: Render each JOIN edge as a straight line segment between the two coin positions

**Independent Test**: Provide a `GameState` with an edge from A1 to A2; assert the SVG contains a line element connecting the correct two coordinates

### Tests for User Story 3

- [x] T014 [P] [US3] Write `EdgeView.test.tsx` asserting a single edge renders a line from the correct start coordinate to the correct end coordinate
- [x] T015 [P] [US3] Update existing `BoardView.test.tsx` to assert edges are rendered below coins (z-order check)
- [x] T027 [P] [US3] Write `BoardView.test.tsx` test asserting crossing edges (e.g., A1↔G7 and A7↔G1) are both rendered without structural omission

### Implementation for User Story 3

- [x] T016 [P] [US3] Implement `EdgeView` in `src/ui/components/EdgeView.tsx` (SVG `<line>` from mapped start to mapped end)
- [x] T017 [US3] Update `BoardView` in `src/ui/components/BoardView.tsx` to map `GameState.edges` to `EdgeView` instances (rendered between GridView and CoinView in z-order)

**Checkpoint**: At this point, edges render between coins. User Story 3 is independently testable.

---

## Phase 6: User Story 4 — Dev Page Integration (Priority: P2)

**Goal**: A developer page where any `GameState` JSON can be pasted and rendered immediately

**Independent Test**: Navigate to dev page, paste a JSON `GameState` from `src/core/__tests__/session.test.ts`, and visually confirm the board matches

### Implementation for User Story 4

- [x] T018 [US4] Implement `gameStateToJson` and `jsonToGameState` serialization helpers in `src/ui/pages/DevPage.tsx` (handles `Map` → array-of-pairs → `Map` round-trip)
- [x] T019 [US4] Implement `DevPage` component in `src/ui/pages/DevPage.tsx` (textarea left, `BoardView` right, empty board by default, reactive re-render on paste)
- [x] T020 [US4] Wire `DevPage` into `src/ui/App.tsx` replacing the current interactive placeholder board
- [x] T021 [US4] Add sample `GameState` JSON presets (empty board, a few coins, a small cycle) as buttons in `DevPage` for quick testing

**Checkpoint**: At this point, the dev page is functional. User Story 4 is independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Visual polish, performance validation, and cross-story cleanup

- [x] T022 [P] Add dev page layout styles in `src/ui/App.css` (side-by-side flex layout, textarea sizing, board container)
- [x] T023 [P] Add a "Max Density" button to `DevPage` that fills all 49 positions and renders all legal edges; log render timing to console
- [x] T028 [P] Write automated performance test in `src/ui/components/__tests__/BoardView.test.tsx` asserting max-density board (49 coins + all legal edges) mounts in under 100ms
- [x] T024 Run full quality gate: `bun run lint && bun run typecheck && bun run test:run` — fix any issues
- [x] T025 Validate `quickstart.md` by pasting a real `GameState` from `src/core/__tests__/session.test.ts` into the dev page and confirming visual correctness
- [x] T026 [P] Verify no new exports are needed in `src/core/index.ts` for the UI layer; if any are needed, add them

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational phase completion
  - US1, US2, US3 can proceed in parallel after Foundation (different components)
  - US4 depends on US1–US3 being complete (needs full BoardView)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — Depends on US1 only for BoardView integration (the CoinView component itself is independent)
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) — Depends on US1 only for BoardView integration (the EdgeView component itself is independent)
- **User Story 4 (P2)**: Depends on US1–US3 being complete — needs full BoardView with grid, coins, and edges

### Within Each User Story

- Tests (if included) should be written first, then implementation
- Components are independent and can be implemented in parallel (GridView, CoinView, EdgeView are separate files)
- BoardView integration happens after each sub-component is ready

### Parallel Opportunities

- T001, T002, T003 (Setup) can run in parallel
- T004, T005 (Foundational) can run in parallel
- T008, T012 (component implementations) can run in parallel after Foundation
- T006, T010, T014 (tests) can run in parallel after their respective components exist
- T022, T023 (Polish) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch GridView implementation and tests together:
Task: "Implement GridView in src/ui/components/GridView.tsx"
Task: "Write GridView test in src/ui/components/__tests__/GridView.test.tsx"

# Then integrate into BoardView:
Task: "Implement BoardView skeleton in src/ui/components/BoardView.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (directory structure, aliases, test deps)
2. Complete Phase 2: Foundational (coordinates, constants)
3. Complete Phase 3: User Story 1 (empty grid renders)
4. **STOP and VALIDATE**: `bun run dev` shows clean 7×7 grid

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Empty grid renders → Validate
3. Add User Story 2 → Coins appear with labels → Validate
4. Add User Story 3 → Edges connect coins → Validate
5. Add User Story 4 → Dev page enables paste-and-render → Validate (this is the sprint exit criteria)
6. Polish → Performance check, lint, typecheck, tests pass

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (GridView + BoardView skeleton)
   - Developer B: US2 (CoinView)
   - Developer C: US3 (EdgeView)
3. All three converge on BoardView integration
4. Developer A or D: US4 (DevPage)
5. Team: Polish together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- The renderer must never modify the input `GameState` (immutable prop)
- All components are presentational — no hooks, no state, no side effects beyond SVG rendering
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently
