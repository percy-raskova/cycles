---
description: "Task list for Game-Theoretic (Strategic) Bot"
---

# Tasks: Game-Theoretic Bot

**Input**: Design documents from `/specs/011-game-theoretic-bot/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: REQUIRED. Constitution II (Test-First Discipline) mandates a failing test
before any change to `src/core/`, ≥90% coverage, and `fast-check` property tests for
invariants. Test tasks therefore appear FIRST in every phase and MUST fail before the
matching implementation task begins.

**Organization**: Tasks are grouped by user story (US1 P1, US2 P2, US3 P3) for
independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (omitted for Setup, Foundational, Polish)
- All paths are repository-root-relative (`cycles/`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the bot module skeleton and shared type/constant surface so the
package type-checks before logic lands.

- [x] T001 Create directory `src/core/bots/strategic/` with empty skeleton files: `index.ts`, `types.ts`, `sigma.ts`, `move-order.ts`, `heuristics.ts`, `evaluate.ts`, `search.ts`, `weights.ts` (each exporting a `// TODO` placeholder so imports resolve).
- [x] T002 [P] Define internal types in `src/core/bots/strategic/types.ts`: `StrategicBotConfig`, `HeuristicWeights`, `MoveContext`, `ScoredMove`, `HeuristicContribution`, `SearchResult`, `InspectedMove` per `data-model.md` (all `readonly`).
- [x] T003 [P] Define and export tunable constants + default `HeuristicWeights` in `src/core/bots/strategic/weights.ts` (leaf terms `W_SIGMA=1.0`, `W_BOUNDARY`, `W_CENTER_AVOID`, `W_TEMPO`; ordering terms `W_DELTA_SIGMA`, `W_CYCLE_CLOSE`; knobs `K_BEAM=12`, `EXHAUSTIVE_LEAF_LIMIT=200`, `SEARCH_DEPTH=3`, `DEFAULT_DEADLINE_MS=2000`) with the provenance comments from `research.md` R8. Note in-file which weights are leaf vs ordering (Q7).

**Checkpoint**: Skeleton compiles (`bun run typecheck` green) with placeholder exports.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure shared primitives every story depends on: the σ margin, the
move-context builder, and the deterministic comparator. No game-theoretic "principle"
lives here yet.

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete.

- [x] T004 [P] Write failing unit tests for σ + Δσ in `src/core/__tests__/behavior/strategic-sigma.test.ts`: `sigma(state) === scoreForPlayer(state,"HEADS") − scoreForPlayer(state,"TAILS")`; non-cycle JOIN Δσ ∈ {−2,0,+2} matches endpoint faces; cycle-close swing equals `2(t−h)` of the enclosed region (use a hand-built cycle fixture); side-to-move perspective sign-flips for TAILS. (Property test: Δσ === `sigma(applyMove(s,m)) − sigma(s)`.)
- [x] T005 Implement `src/core/bots/strategic/sigma.ts`: `sigma(state)`, `signedSigma(state, player)`, and `moveDeltaSigma(state, move)` (uses `findCycle`/`coinsInsideCycle` for cycle closes) to pass T004.
- [x] T006 [P] Write failing unit tests for the comparator in `src/core/__tests__/behavior/strategic-move-order.test.ts`: ordering is score-desc, then cycle-JOIN ≺ non-cycle-JOIN ≺ PLACE, then smallest `positionKey` (JOIN sorted-pair key; PLACE position then `heads`<`tails`) — covering FR-002 exactly with hand-crafted equal-score moves.
- [x] T007 Implement `src/core/bots/strategic/move-order.ts`: `moveTypeRank(state, move)` (cycle via `findCycle`), `orderKey(move)` (via `positionKey`), and `compareScoredMoves(a, b)` comparator to pass T006.
- [x] T008 Implement `buildMoveContext(state, move)` in `src/core/bots/strategic/move-order.ts` (or a small `context.ts`): computes `successor = applyMove(state, move)` once, `isCycleClose`, `deltaSigma`, `player`. (Covered indirectly by T004/T006 fixtures; no separate test file.)

**Checkpoint**: σ, Δσ, comparator, and context builder are tested and green. Heuristics can now be written against them.

---

## Phase 3: User Story 1 — Select Strategic Opponent (Priority: P1) 🎯 MVP

**Goal**: A player can select "Strategic" and play a complete game in which the bot
makes only legal, deterministic moves consistent with the documented heuristics.

**Independent Test**: New game → Opponent "Strategic" → play to terminal → bot never
made an illegal move or crashed; repeated identical states yield identical moves.

### Tests for User Story 1 (write FIRST, must FAIL)

- [x] T009 [P] [US1] Write failing per-heuristic tests in `src/core/__tests__/behavior/strategic-heuristics.test.ts`. **Leaf (state) evaluators** (Q7): `sigmaTerm` (= signed σ); `boundarySafety` (+ for own coins on corners/edges, FR-003); `centerExposure` (− for own coins in rows/cols 2–4, FR-003); `tempo` (+ when neither side has a +2 non-cycle JOIN and a PLACE remains, FR-006). **Move-ordering evaluators**: `deltaSigma` (+2/0/−2, FR-004); `cycleClose` (`2(t−h)` swing, FR-005). Each a named export; assert leaf evaluators take a state and ordering evaluators take a `MoveContext`.
- [x] T010 [P] [US1] Write failing search tests in `src/core/__tests__/behavior/strategic-search.test.ts`: depth-3 negamax value matches a reference plain-minimax on small fixtures **with beam disabled (`K=∞`)** (sound α–β); with `K=K_BEAM` the selected root move is legal and the root is full-width; **state-based leaf** — a cycle-close move's backed-up value equals `Δσ_close + v(successor)` with NO Δσ double count (Q7 fixture); forced-pass node does NOT decrement depth (player-with-no-moves fixture); terminal at `passCount>=2` returns the signed-σ leaf; exhaustive switch fires when estimated leaves ≤ `EXHAUSTIVE_LEAF_LIMIT` and returns the optimal move on a solved tiny fixture; **no-clock determinism** — identical result on repeat with `now` omitted, and same move when a generous injected clock never hits the deadline (Q8/R4).
- [x] T011 [P] [US1] Write failing end-to-end bot tests in `src/core/__tests__/behavior/strategic-bot.test.ts`: property — returned move ∈ `allLegalMoves(state)` over 1,000 random reachable states (FR-002); determinism property (same state ⇒ same move); no-mutation property (deep-equal state before/after); throws `"No legal moves available"` on empty-legal state; tie-break matches FR-002 on equal-score fixtures; all-zero-heuristic state ⇒ output `=== greedyBot(state)` (FR-008).
- [x] T012 [P] [US1] Write failing UI selector test in `src/ui/components/__tests__/SetupScreen.test.tsx`: "Strategic" radio present, selectable, `aria-label="Strategic bot opponent"`, yields `opponent:"strategic"` on start; "Greedy" radio absent (FR-001, FR-009).

### Implementation for User Story 1

- [x] T013 [US1] Implement the named heuristic evaluators in `src/core/bots/strategic/heuristics.ts`: **leaf (state)** `sigmaTerm`, `boundarySafety`, `centerExposure`, `tempo` as pure `(state, player) => number`; **ordering (move)** `deltaSigma`, `cycleClose` as pure `(MoveContext) => number`. Each a named export with a comment citing its `cycles-game-theory.md` section (SC-004). Pass T009. (Depends on T005, T008.)
- [x] T014 [US1] Implement the **state-based** weighted-sum leaf evaluator in `src/core/bots/strategic/evaluate.ts`: `leafValue(state, player, weights) => number` summing only the leaf terms `W_SIGMA·sigmaTerm + W_BOUNDARY·boundarySafety + W_CENTER_AVOID·centerExposure + W_TEMPO·tempo` (Q7 — no Δσ re-added, FR-005/FR-007); plus `staticMoveScore(ctx, weights)` for ordering/fallback (uses `deltaSigma`/`cycleClose`); plus root all-zero detection signalling the Greedy fallback (FR-008). (Depends on T013, T003.)
- [x] T015 [US1] Implement 3-ply alpha–beta negamax in `src/core/bots/strategic/search.ts` (note inline: negamax = minimax for zero-sum σ, D1): leaf = `leafValue(state)`; forced-pass handling without depth decrement (R5); terminal at `passCount>=2`; root full-width, **interior beam `K_BEAM`** (Q6); exhaustive-switch estimator + unbounded search below `EXHAUSTIVE_LEAF_LIMIT` (R7); **injected-clock** deadline — accepts `now?: () => number` + `deadlineMs`, computes `deadlineAt` once, cuts off on `now() >= deadlineAt`; with `now` omitted runs with no time dependence (Q8/R4, NO `performance`/`Date` import). Returns `{value,bestMove,completed}`. Pass T010. (Depends on T014, T007, T005.)
- [x] T016 [US1] Implement `strategicBot` entry + orchestration in `src/core/bots/strategic/index.ts`: build root candidates, run search (or exhaustive), apply timeout fallback (best-found → else `greedyBot`) **only when a clock is injected**, apply root all-zero-heuristic fallback to `greedyBot` (FR-008, decided once at root), final selection via `compareScoredMoves` (FR-002). The default export is pure (no clock). Pass T011. (Depends on T015, T014, T007.)
- [x] T017 [US1] Wire exports in `src/core/bots/index.ts`: add `"strategic"` to `BotStrategy` union; `export { strategicBot } from "./strategic"`. Confirm `@core` re-export surfaces it. (Depends on T016.)
- [x] T018 [P] [US1] Update `src/ui/types/setup.ts`: `BotStrategyUI = "random" | "strategic"` (drop `"greedy"`). (Depends on T017.)
- [x] T019 [US1] Update `src/ui/components/SetupScreen.tsx`: replace the "Greedy" radio with "Strategic" (icon + label "Strategic", `aria-label="Strategic bot opponent"`, ≥44×44 target, visible focus). Pass T012. (Depends on T018.)
- [x] T020 [US1] Update `src/ui/hooks/useBotGame.ts`: `getBotFunction("strategic") => strategicBot`; remove the `"greedy"` branch and the `yieldingGreedyBot` greedy-specific path. Call `strategicBot` with the UI-injected timeout config `{ now: () => performance.now(), deadlineMs: 2000 }` (Q8 — `performance` lives here in the UI layer, not in core) synchronously inside the existing delay timer for now; async wrapper deferred to Polish pending perf data (R10). (Depends on T017, T018.)

**Checkpoint**: MVP — Strategic bot is selectable and plays legal, deterministic games end-to-end. US1 tests green.

---

## Phase 4: User Story 2 — Measurable Improvement Over Greedy (Priority: P2)

**Goal**: Strategic demonstrably beats Greedy head-to-head and never crashes / makes
illegal moves.

**Independent Test**: 1,000-game tournament (alternating starts, both color configs
aggregated) → Strategic wins > losses, ≥55% of decisive games, zero crashes.

### Tests for User Story 2 (write FIRST, must FAIL)

- [x] T021 [P] [US2] Write failing tournament test in `src/core/__tests__/bots/strategic-tournament.test.ts` using existing `runSimulation`: run both color configs (`{botA:strategic,botB:greedy}` and `{botA:greedy,botB:strategic}`), aggregate Strategic wins `S` and Greedy wins `G`; assert `S − G > 0` and `S/(S+G) ≥ 0.55` (SC-001); assert `crashes === 0` across the run (SC-003); assert re-run with same config is byte-identical (FR-002 / T4). Follow the long-running-test convention from `simulation.test.ts` (T031).
- [x] T022 [P] [US2] Extend `src/core/__tests__/behavior/bot-perf.test.ts` with Strategic move-time budget: average `< 100 ms`, worst case `< 2,000 ms` per move over a representative state sample (SC-002).

### Implementation for User Story 2

- [x] T023 [US2] Hand-tuning loop (Q3): iterate the constants in `src/core/bots/strategic/weights.ts` against T021 until SC-001 passes; document the committed final values and rationale in the file header. (Depends on T021.)
- [x] T024 [US2] If T022 fails, tune `K_BEAM` / `EXHAUSTIVE_LEAF_LIMIT` in `weights.ts` (and verify the root-full-width assumption holds for the selected move) until SC-002 passes without regressing SC-001 (re-run T021). Record the verified decision (research IC-3): the beam proved unsound in the placement phase and was replaced by **adaptive full-width depth** (`K_BEAM` defaults to ∞); perf is avg ~19ms / worst ~44ms unloaded. (Depends on T022, T023.)

**Checkpoint**: SC-001 and SC-002 green with committed weights/knobs; SC-003 smoke-covered by T021's `crashes === 0` (full 10,000-game gate is T034 in Polish, run after tuning).

---

## Phase 5: User Story 3 — Heuristic Transparency for Developers (Priority: P3)

**Goal**: A developer can query ranked candidate moves with per-heuristic score
breakdowns and locate each heuristic principle in the source.

**Independent Test**: Call `inspectTopMoves(state, n)` → ranked list with per-heuristic
breakdowns, no state mutation; each of the five named heuristics (`boundarySafety`,
`centerExposure`, `tempo`, `deltaSigma`, `cycleClose`) is findable in < 30 s.

### Tests for User Story 3 (write FIRST, must FAIL)

- [x] T025 [P] [US3] Write failing tests in `src/core/__tests__/behavior/strategic-inspect.test.ts`: returns `min(n, candidates)` entries sorted by `totalScore` desc then FR-002 comparator; each `breakdown[h] = {raw, weighted}` with `weighted === raw × weight`; input state deep-equal before/after (no mutation, FR-011/R9); `n===0` ⇒ `[]`; top entry's move `=== strategicBot(state)` under non-binding deadline.

### Implementation for User Story 3

- [x] T026 [US3] Implement `inspectTopMoves(state, n)` in `src/core/bots/strategic/index.ts` (or `inspect.ts`): for each candidate build a `MoveContext`, score it with the same root evaluation the bot uses (`leafValue(successor)` + ordering terms `staticMoveScore`), assemble per-heuristic `breakdown` ({raw, weighted}), sort via `compareScoredMoves`; return `readonly InspectedMove[]` without mutating state. Pass T025. (Depends on T016, T014, T007.)
- [x] T027 [US3] Export `inspectTopMoves` from `src/core/bots/index.ts` and verify it surfaces via `@core`. (Depends on T026.)
- [x] T028 [P] [US3] SC-004 transparency pass: ensure each of the five named heuristic evaluators in `heuristics.ts` — `boundarySafety`, `centerExposure`, `tempo`, `deltaSigma`, `cycleClose` (the `sigmaTerm` base margin is the score itself, not a tunable heuristic) — is an individually-named export with a one-line comment citing its `cycles-game-theory.md` section; no anonymous inline heuristics. (Depends on T013.)

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T029 [P] Run `bun run test:coverage`; ensure `src/core/` ≥ 90% (add edge-case tests for any uncovered branch in `strategic/`).
- [x] T030 Run `bun run typecheck` and `bun run lint`; resolve any Biome cognitive-complexity > 15 by extracting helpers (the file split should already keep functions small).
- [x] T031 R10 decision: from T022 timings, decide whether `useBotGame.ts` needs a chunked/async Strategic wrapper (mirroring the old `yieldingGreedyBot`) to avoid UI stall; DECISION: kept synchronous — measured ~19ms avg / ~44ms worst per move (well under the 2000ms UI timer), so no chunked/async wrapper is needed (research IC-3/R10).
- [x] T032 [P] Run `quickstart.md` validation end-to-end (dev server, CLI, programmatic snippet, tuning loop, full test suite) and tick its acceptance checklist (SC-001…SC-004, FR-001, FR-011).
- [x] T033 [P] Update `cycles-game-theory.md` "Future Enhancements" note (MCTS, transposition table, auto-tuning) per research R2/R3/R8 deferrals, so deferred items are recorded, not lost.
- [x] T034 [P] **SC-003 full-scale safety gate** (closes analyze finding C1): add a long-running test in `src/core/__tests__/bots/strategic-safety.test.ts` that runs **10,000 full games** via `runSimulation` (Strategic self-play + Strategic-vs-Greedy/Random mix) with the **final committed weights** and asserts `crashes === 0` (⇒ zero illegal moves AND zero crashes, SC-003). Gate it behind the long-running convention from `simulation.test.ts` (T031) so the default suite stays fast. Runs after tuning (T023/T024). (Depends on T023, T024, T016.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: no deps — start immediately.
- **Foundational (P2)**: depends on Setup — BLOCKS all user stories.
- **US1 (P3 phase)**: depends on Foundational. Delivers the MVP.
- **US2 (P4 phase)**: depends on US1 (needs a working `strategicBot`).
- **US3 (P5 phase)**: depends on US1 (needs `evaluate`/`heuristics`/comparator). Independent of US2.
- **Polish (P6)**: depends on all targeted stories.

### User Story Dependencies

- **US1 (P1)**: foundational only — self-contained MVP.
- **US2 (P2)**: builds on US1's bot; reuses existing `runSimulation` (no harness change).
- **US3 (P3)**: builds on US1's evaluator; independent of US2 — US2 and US3 can proceed in parallel once US1 is done.

### Within Each Story

- Test tasks first and MUST FAIL before the matching implementation task.
- Foundational primitives (sigma, move-order, context) before heuristics.
- Heuristics → evaluate → search → bot entry → registry export → UI.

### Parallel Opportunities

- Setup: T002, T003 in parallel (T001 first).
- Foundational: T004 ∥ T006 (different test files); T005 after T004, T007 after T006.
- US1 tests: T009 ∥ T010 ∥ T011 ∥ T012 (different files) — write all first.
- US1 impl is mostly sequential (shared files + dependency chain); T018 ∥ once T017 lands.
- US2 (T021 ∥ T022) and US3 (T025) test-writing can overlap once US1 is green.
- Polish: T029 ∥ T032 ∥ T033 ∥ T034.

---

## Parallel Example: User Story 1 (write tests together first)

```bash
# Launch all US1 test files in parallel (they must fail before implementation):
Task: "strategic-heuristics.test.ts — per-heuristic units (T009)"
Task: "strategic-search.test.ts — minimax/alpha-beta/forced-pass/endgame/timeout (T010)"
Task: "strategic-bot.test.ts — legal/deterministic/no-mutation/tie-break/fallback (T011)"
Task: "SetupScreen.test.tsx — Strategic present, Greedy absent (T012)"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1.
4. **STOP & VALIDATE**: select Strategic, play a full game, confirm zero illegal moves and determinism.
5. Ship the MVP.

### Incremental Delivery

1. Setup + Foundational → primitives ready.
2. US1 → playable Strategic opponent (MVP).
3. US2 → proven ≥55% win rate vs Greedy, zero crashes, within perf budget.
4. US3 → developer inspection API + transparency.
5. Polish → coverage, gates, perf-wrapper decision, docs.

---

## Notes

- [P] = different files, no incomplete dependency.
- TDD is mandatory (Constitution II): every `src/core/` change starts red.
- Greedy stays in `src/core/bots/` (tournament + FR-008 fallback); removed only from the UI selector.
- Critical correctness pivot: use `sigma` (heads − tails), NOT `scoreForPlayer`'s own-face count (research R1).
- Commit after each task or logical group (per project convention).
