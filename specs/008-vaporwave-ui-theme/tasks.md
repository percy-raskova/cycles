# Tasks: Vaporwave Win95 UI Theme and Repository Credit

**Input**: Design documents from `specs/008-vaporwave-ui-theme/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/ui-components.md, research.md

**Tests**: Tests are explicitly requested in the feature specification (FR-018 visual regression, FR-015 WCAG compliance, SC-012 snapshot states). Test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project — adjust based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and prepare project infrastructure

- [X] T001 Add `vite-plugin-pwa` to `package.json` devDependencies and configure in `vite.config.ts`
- [X] T002 Add `@vitest/browser` to `package.json` devDependencies for visual regression testing
- [X] T003 [P] Add Google Fonts links (VT323, Space Mono) to `index.html` in `<head>`
- [X] T004 [P] Add `public/icons/` directory with PWA icons (192x192 PNG, 512x512 PNG, SVG). Design: stylized "C" letter in fuchsia (#ff00ff) on dark navy (#0a0a1a) background, consistent with the vaporwave palette.
- [X] T005 [P] Add `meta name="theme-color"` and `meta name="background-color"` to `index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core theme system and reusable components that MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create `src/ui/theme.css` with CSS custom properties for the 12-token vaporwave palette
- [X] T007 [P] Create `src/ui/components/Button.tsx` with Win95 beveled styling and variants (`default`, `primary`, `close`, `reset`, `undo`)
- [X] T008 [P] Import `theme.css` and set base styles (background, font-family, color) in `src/ui/App.css`
- [X] T009 [P] Add `aria-label` attributes to existing interactive elements: `MenuBar` buttons (`?` → "Open Help", `⚙` → "Open Settings"), `BoardView` intersection dots (`aria-label="Empty intersection at row {r}, column {c}"`), `FaceSelector` buttons ("Choose Heads", "Choose Tails"), `GameOverPanel` "New Game" button, and any modal open triggers.
- [X] T009a [P] Add `color-scheme: dark` to `src/ui/theme.css` and an explicit `@media (prefers-color-scheme: light)` override that forces dark palette, preventing OS light mode from flashing unstyled light content.

**Checkpoint**: Foundation ready — theme variables exist, Button component is usable, base styles are set, dark mode is locked

---

## Phase 3: User Story 1 - Repository Credit (Priority: P1) 🎯 MVP

**Goal**: Add a persistent, clickable Codeberg repository link to the game page

**Independent Test**: Load the game page and verify the link to `https://codeberg.org/percy-raskova/cycles` is visible and clickable

### Tests for User Story 1

- [X] T010 [P] [US1] Add test in `src/ui/components/__tests__/MenuBar.test.tsx` asserting repository link is present and has correct `href`
- [X] T011 [P] [US1] Add Codeberg repository anchor to `src/ui/components/MenuBar.tsx` with `target="_blank"` and `rel="noopener noreferrer"`
- [X] T012 [P] [US1] Style repository link in `src/ui/App.css` to match vaporwave palette (teal color, underline on hover)

**Checkpoint**: At this point, the repository link should be visible, clickable, and open the correct URL

---

## Phase 4: User Story 2 - Retro Desktop Aesthetic (Priority: P1) 🎯 MVP

**Goal**: Apply the vaporwave fuchsia orchid Win95 theme to the entire UI

**Independent Test**: Visually inspect the rendered page and verify all components use the theme palette and Win95 beveled borders

### Tests for User Story 2

- [X] T013 [P] [US2] Add visual regression snapshot test for initial load state in `tests/visual/initial-load.test.tsx`
- [X] T014 [P] [US2] Add visual regression snapshot test for face selector open state in `tests/visual/face-selector.test.tsx`

### Implementation for User Story 2

- [X] T015 [P] [US2] Apply dark navy background (`--color-bg`) and surface colors to `src/ui/App.css` and `src/ui/App.tsx`
- [X] T016 [P] [US2] Recolor game board in `src/ui/components/GridView.tsx`: grid lines in lavender, dots in orchid
- [X] T017 [P] [US2] Recolor coins in `src/ui/components/CoinView.tsx`: heads in fuchsia, tails in hot-pink, with face labels
- [X] T018 [P] [US2] Recolor edges in `src/ui/components/EdgeView.tsx`: magenta or orchid stroke
- [X] T019 [P] [US2] Apply Win95 beveled borders to all existing buttons in `src/ui/components/` (FaceSelector, GameOverPanel, etc.)
- [X] T020 [P] [US2] Apply retro typefaces to headings and body text via `src/ui/App.css` (VT323 for display, Space Mono for body)
- [X] T021 [P] [US2] Style `src/ui/components/TurnIndicator.tsx` with theme colors and beveled panel
- [X] T022 [P] [US2] Style `src/ui/components/GameOverPanel.tsx` with theme colors and beveled panel
- [X] T023 [P] [US2] Style `src/ui/components/FaceSelector.tsx` with Win95 window chrome
- [X] T023a [P] [US2] Add integration test in `src/ui/pages/__tests__/GamePage.test.tsx` verifying that coins can still be placed and joined after theme CSS is fully applied (FR-010: theme must not interfere with game interaction)

**Checkpoint**: At this point, the entire UI should reflect the vaporwave Win95 theme with no unstyled elements and all interactions remain functional

---

## Phase 5: User Story 3 - Reset and Undo Moves (Priority: P1) 🎯 MVP

**Goal**: Add Reset and Undo buttons with distinct visual styles and correct game behavior

**Independent Test**: Play a game, make moves, click Undo to revert, click Reset to restart, verify buttons are visually distinct

### Tests for User Story 3

- [ ] T024 [P] [US3] Add undo test in `src/core/__tests__/session.test.ts`: place a coin, undo, verify board is empty
- [ ] T025 [P] [US3] Add undo-after-join test: join two coins, undo, verify edge removed and coins restored
- [ ] T026 [P] [US3] Add undo-cycle-closure test: close a cycle, undo, verify flipped coins restored
- [ ] T027 [P] [US3] Add reset test: place coins, reset, verify empty board and disabled undo
- [ ] T027a [P] [US3] Add property-based test in `src/core/__tests__/invariants.test.ts` using `fast-check`: for any session with moves, `undo(session)` returns a new object reference and does not mutate the input session (Constitution Principle VI: Immutability by Default)

### Implementation for User Story 3

- [ ] T028 [P] [US3] Add move history array to `src/core/session.ts` and update `createSession` to track moves
- [ ] T029 [P] [US3] Implement `undo(session)` in `src/core/session.ts` that replays all moves except the last one
- [ ] T030 [P] [US3] Implement `reset()` in `src/core/session.ts` that returns a fresh initial session
- [ ] T031 [P] [US3] Export `canUndo(session)` helper from `src/core/session.ts` (true when history is non-empty)
- [ ] T032 [P] [US3] Create `src/ui/components/ResetButton.tsx` with `variant="reset"` (hot-pink/magenta, circular-arrow icon)
- [ ] T033 [P] [US3] Create `src/ui/components/UndoButton.tsx` with `variant="undo"` (teal/orchid, back-arrow icon)
- [ ] T034 [US3] Integrate Reset and Undo buttons into `src/ui/components/MenuBar.tsx` with `onClick` handlers calling engine

**Checkpoint**: At this point, Reset and Undo should be fully functional, visually distinct, and correctly disabled/enabled

---

## Phase 6: User Story 4 - Window-Style Dialogs (Priority: P2)

**Goal**: Style modal dialogs as floating Win95 desktop windows with title bars and close controls

**Independent Test**: Open each modal (Help, Settings, About) and verify window chrome, title bar, and close behavior

### Tests for User Story 4

- [ ] T035 [P] [US4] Add visual regression snapshot test for Help modal open state in `tests/visual/help-modal.test.tsx`
- [ ] T036 [P] [US4] Add visual regression snapshot test for Settings modal open state in `tests/visual/settings-modal.test.tsx`

### Implementation for User Story 4

- [ ] T037 [P] [US4] Style `src/ui/components/Modal.tsx` with Win95 window chrome: beveled outer frame, title bar at top
- [ ] T038 [P] [US4] Add title bar close button ("X") to `src/ui/components/Modal.tsx` positioned right
- [ ] T039 [US4] Verify `src/ui/components/Modal.tsx` dismisses via close button, click-outside, and Escape key

**Checkpoint**: At this point, all modals should look and behave like Win95 windows

---

## Phase 7: User Story 5 - Responsive + PWA (Priority: P1) 🎯 MVP

**Goal**: Make the game fully responsive and installable as a PWA

**Independent Test**: Render at 320px, 375px, 768px, 1024px, 1920px; verify no horizontal scroll; install as PWA on mobile

### Tests for User Story 5

- [ ] T040 [P] [US5] Add responsive layout test: verify board fits within 375px viewport in `src/ui/pages/__tests__/GamePage.test.tsx`
- [ ] T041 [P] [US5] Add touch target size test: verify all buttons and intersections are ≥44px in `src/ui/pages/__tests__/GamePage.test.tsx`

### Implementation for User Story 5

- [ ] T042 [P] [US5] Add responsive breakpoints to `src/ui/App.css` for 320px, 375px, 768px, 1024px, 1920px
- [ ] T043 [P] [US5] Scale game board proportionally using `vmin` sizing in `src/ui/pages/GamePage.tsx`
- [ ] T044 [P] [US5] Configure `vite-plugin-pwa` in `vite.config.ts` with manifest fields (name, icons, display, theme_color, background_color)
- [ ] T045 [P] [US5] Ensure all touch targets (buttons, grid intersections, coins) are ≥44×44 CSS pixels in `src/ui/App.css`
- [ ] T046 [P] [US5] Add `@media (orientation: portrait)` and `(orientation: landscape)` adjustments in `src/ui/App.css`

**Checkpoint**: At this point, the game should be fully responsive and PWA-installable

---

## Phase 8: User Story 6 - Accessibility (Priority: P1) 🎯 MVP

**Goal**: Ensure WCAG 2.1 AA compliance, dark mode default, keyboard navigation, and screen reader support

**Independent Test**: Run Axe-core audit, verify keyboard Tab navigation, check contrast ratios, test with screen reader

### Tests for User Story 6

- [ ] T047 [P] [US6] Add Axe-core accessibility audit test in `tests/a11y/accessibility.test.ts`
- [ ] T048 [P] [US6] Add keyboard navigation test in `src/ui/pages/__tests__/GamePage.test.tsx`: Tab through all interactive elements

### Implementation for User Story 6

- [ ] T049 [P] [US6] Verify all text/background color pairs in `src/ui/theme.css` meet WCAG 2.1 AA contrast (4.5:1 body, 3:1 UI). **Depends on**: T015–T023 (US2 theme colors finalized).
- [ ] T050 [P] [US6] Add color-independent indicators to `src/ui/components/CoinView.tsx`: face label text (H/T) in addition to color
- [ ] T051 [P] [US6] Add visible focus indicators (2px solid `--color-fuchsia` outline) to all interactive elements in `src/ui/App.css`
- [ ] T052 [P] [US6] Add `role` and `aria-label` attributes to game board in `src/ui/components/BoardView.tsx` or `src/ui/pages/GamePage.tsx`
- [ ] T053 [P] [US6] Ensure modal dialogs in `src/ui/components/Modal.tsx` have `aria-modal="true"` and `aria-labelledby`

**Checkpoint**: At this point, the game should pass WCAG 2.1 AA, be fully keyboard-navigable, and screen-reader friendly

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, visual regression, cross-browser parity, and documentation

- [ ] T054 [P] Verify all visual regression snapshot reference images exist in `tests/__snapshots__/` for: initial load, face selector, Help modal, Settings modal, game over panel. Confirm snapshot generation has been run at least once and images are committed.
- [ ] T055 [P] Run Lighthouse PWA audit. Specific checks: (a) manifest is valid and served with correct `Content-Type`, (b) service worker is registered and controls the page, (c) icons are present at all declared sizes, (d) `theme-color` and `background-color` match manifest values, (e) HTTPS is active (Cloudflare Pages). Fix any category scoring below 90.
- [ ] T056 [P] Verify cross-browser rendering parity: compare Firefox and Chromium screenshots at 1280×720
- [ ] T057 Run full test suite (`bun run test:run`) and confirm all 179 existing tests pass with zero failures
- [ ] T058 Run `bun run lint` and `bun run typecheck` and confirm zero errors
- [ ] T059 Update `AGENTS.md` with any new operational notes (PWA testing, icon generation, visual regression workflow)
- [ ] T060 Build project (`bun run build`) and deploy to Cloudflare Pages (`wrangler pages deploy dist --project-name cycles-game --branch=main`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001–T005) — BLOCKS all user stories
- **User Stories (Phase 3–8)**: All depend on Foundational phase (T006–T009) completion
  - US1, US2, US3, US5, US6 are P1 and can proceed in parallel after Foundational
  - US4 (Dialogs) is P2 and depends on US2 (Theme) for styling consistency
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Repository Credit)**: Can start after Foundational — no dependencies on other stories
- **US2 (Retro Aesthetic)**: Can start after Foundational — no dependencies on other stories; serves as foundation for US4
- **US3 (Reset/Undo)**: Can start after Foundational — engine work (T028–T031) can run in parallel with UI work (T032–T034)
- **US4 (Window Dialogs)**: Can start after Foundational + US2 (Theme) — needs theme colors and Button component
- **US5 (Responsive/PWA)**: Can start after Foundational — layout work is independent; PWA config is independent
- **US6 (Accessibility)**: Best started after all UI stories are mostly complete — cross-cutting audit

### Within Each User Story

- Tests MUST be written and FAIL before implementation (where test tasks are specified)
- Engine models/services before UI integration (US3)
- Core styling before component-specific styling (US2)
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] (T003–T005) can run in parallel with T001–T002
- All Foundational tasks marked [P] (T007–T009) can run in parallel with T006
- US1 implementation (T011–T012) can run in parallel with US2 styling (T015–T023)
- US3 engine work (T028–T031) can run in parallel with US3 UI work (T032–T033)
- US5 responsive CSS (T042–T043) can run in parallel with US5 PWA config (T044)
- All US6 accessibility tasks (T049–T053) can run in parallel
- All Polish tasks marked [P] (T054–T056) can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all styling tasks for User Story 2 together:
Task: "Apply dark navy background in src/ui/App.css"
Task: "Recolor grid lines in src/ui/components/GridView.tsx"
Task: "Recolor coins in src/ui/components/CoinView.tsx"
Task: "Recolor edges in src/ui/components/EdgeView.tsx"
Task: "Style TurnIndicator in src/ui/components/TurnIndicator.tsx"
Task: "Style GameOverPanel in src/ui/components/GameOverPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Repository Credit)
4. Complete Phase 4: US2 (Retro Aesthetic)
5. Complete Phase 5: US3 (Reset/Undo)
6. **STOP and VALIDATE**: Theme, repository link, reset, and undo all work
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 + US3 → Core game with theme and controls → Deploy/Demo (MVP!)
3. Add US4 (Dialogs) → Themed modals → Deploy/Demo
4. Add US5 (Responsive/PWA) → Mobile-ready, installable → Deploy/Demo
5. Add US6 (Accessibility) → WCAG-compliant → Deploy/Demo
6. Polish → Visual regression, cross-browser, final build → Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Repository) + US2 (Theme styling)
   - Developer B: US3 (Reset/Undo engine + UI)
   - Developer C: US5 (Responsive CSS + PWA config)
3. Once US2 is done:
   - Developer A: US4 (Dialog styling)
   - Developer C: US6 (Accessibility audit + fixes)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
