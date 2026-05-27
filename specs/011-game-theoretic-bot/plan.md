# Implementation Plan: Game-Theoretic Bot

**Branch**: `011-game-theoretic-bot` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-game-theoretic-bot/spec.md`

## Summary

Replace the UI-selectable "Greedy" AI with a new "Strategic" bot that applies the
game-theoretic analysis in `cycles-game-theory.md`. The Strategic bot is a pure,
synchronous, deterministic `GameState → Move` function that evaluates candidate
moves with a 3-ply alpha–beta minimax search whose leaf evaluation is a
weighted-sum heuristic suite (boundary-preference and center-avoidance for PLACEs,
Δσ algebra for non-cycle JOINs, `Δσ_close + v(successor)` for cycle closes, and
tempo/parity reasoning). It switches to exhaustive search in small endgames
(≤ 200 leaf nodes), times out to the best-found move (default 2,000 ms), and falls
back to Greedy one-move maximization when no heuristic is non-neutral. A new
`inspectTopMoves(state, n)` export exposes ranked candidates with per-heuristic
breakdowns. The Greedy bot is retained in `src/core/bots/` for tournament
regression but removed from the setup-screen selector.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict mode: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
**Primary Dependencies**: None new. Reuses `@core` engine (`applyMove`, `allLegalMoves`, `findCycle`, `coinsInsideCycle`, `scoreForPlayer`, session/simulate). React 18 + Vite for the UI selector change only.
**Storage**: N/A (stateless, in-memory)
**Testing**: Vitest 2.x with `fast-check` for property tests; existing `runSimulation` harness for tournament validation. Tests live in `src/core/__tests__/behavior/` and `src/core/__tests__/bots/`.
**Target Platform**: Browser (Cloudflare Pages SPA) + Node CLI; engine is platform-agnostic pure TS.
**Project Type**: Single project — pure engine module (`src/core/`) consumed by a thin React UI (`src/ui/`).
**Performance Goals**: < 100 ms average per move, < 2,000 ms worst case (SC-002) on a mid-range dev machine. Worst case is bounded by the move-timeout fallback.
**Constraints**: Engine purity (no DOM/React/IO in `src/core/`); full immutability; deterministic output for a fixed state; zero illegal moves / crashes across 10,000 games (SC-003); per-function cognitive complexity ≤ 15 (Biome gate).
**Scale/Scope**: Board = 7×7, ≤ 12 coins, ≤ 30 planar edges, ≤ 42 moves per game. Move branching factor up to ~110 early (≤ 49 PLACE positions × 2 faces + legal JOINs). New code ≈ one bot module split across focused files + UI selector edit.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|-----------|-------|
| I. Engine Purity | ✅ PASS | Strategic bot lives in `src/core/bots/strategic/`; pure functions, no framework deps. **The move timeout uses an injected clock `now?: () => number` (DI), never `performance`/`Date` in core** — so the engine stays time-free and platform-agnostic; the UI supplies `performance.now()` (research R4 / Q8). UI change is a thin selector edit only. |
| II. Test-First Discipline | ✅ PASS | Each heuristic + minimax + tie-break + timeout written test-first. ≥90% coverage on `src/core/`. Property tests for "never illegal", "deterministic", "Δσ algebra". |
| III. UI/Engine Separation | ✅ PASS | Bot logic is engine-side; UI only adds a `"strategic"` radio and dispatches via `getBotFunction`. No game logic added to UI. |
| IV. Pre-Commit Quality Gates | ✅ PASS | Biome + `tsc --noEmit` + Vitest all run pre-commit. Complexity ≤ 15 drives the file split (search loop, leaf eval, each heuristic isolated). |
| V. Accessibility by Default | ✅ PASS | FR-009: new "Strategic" radio keeps ≥44×44 targets, visible focus, text label (not color-only) — matches existing setup options. |
| VI. Immutability by Default | ✅ PASS | Search clones via existing immutable `applyMove`; no in-place mutation. No-clock default path is referentially transparent (same state ⇒ same move). `inspectTopMoves` must not mutate state (asserted by property test). |
| VII. Canonical Rules Fidelity | ✅ PASS | Bot only *reads* rules via `allLegalMoves`/`applyMove`; introduces no new rules. `cycles-game-theory.md` is heuristic guidance, not a rules change. Δσ derivations cross-checked against `cycles-spec.md` flip semantics. |

**No violations.** Complexity Tracking section omitted (nothing to justify).

**Key engine finding feeding the design**: `scoreForPlayer(state, player)` returns the
*count of the player's own face only*, not σ = heads − tails. The game-theoretic Δσ
algebra in `cycles-game-theory.md` is defined on σ = heads − tails. The Strategic bot
therefore computes a dedicated signed margin
`sigma(state) = scoreForPlayer(state, "HEADS") − scoreForPlayer(state, "TAILS")`
rather than reusing Greedy's own-face delta. This is documented in research.md.

## Project Structure

### Documentation (this feature)

```text
specs/011-game-theoretic-bot/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 — decisions: σ margin, search shape, perf, tie-break
├── data-model.md        # Phase 1 — entities: StrategicBot, HeuristicEvaluator, weights, search node
├── quickstart.md        # Phase 1 — how to run, tune weights, run tournament, inspect moves
├── contracts/
│   ├── strategic-bot.md     # BotFunction + inspectTopMoves API contract
│   └── tournament.md        # head-to-head tournament contract (existing runSimulation reuse)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/core/
├── bots/
│   ├── index.ts                 # EDIT: BotStrategy += "strategic"; export strategicBot, inspectTopMoves
│   ├── greedy.ts                # KEEP (tournament + leaf/zero-heuristic fallback)
│   ├── random.ts                # KEEP
│   ├── legal-moves.ts           # KEEP (allLegalMoves reused)
│   ├── simulate.ts              # KEEP (tournament harness reused; see contracts/tournament.md)
│   └── strategic/               # NEW — bot split into focused, complexity≤15 files
│       ├── index.ts             # strategicBot entry, inspectTopMoves, orchestration + fallbacks
│       ├── sigma.ts             # sigma(state) signed margin + per-move Δσ helpers
│       ├── search.ts            # 3-ply alpha–beta minimax, forced-pass handling, exhaustive endgame switch, timeout cutoff
│       ├── evaluate.ts          # weighted-sum leaf evaluator (combines heuristics) + Greedy fallback
│       ├── heuristics.ts        # named evaluators: boundary, center-avoidance, deltaSigma, cycleClose, tempo
│       ├── move-order.ts        # deterministic tie-break comparator + alpha–beta move ordering
│       └── weights.ts           # exported tunable weight constants (documented)
└── __tests__/
    ├── behavior/
    │   ├── strategic-heuristics.test.ts   # NEW — per-heuristic unit tests (T-heuristics)
    │   ├── strategic-search.test.ts       # NEW — minimax/alpha-beta/forced-pass/endgame/timeout
    │   ├── strategic-bot.test.ts          # NEW — end-to-end: legal, deterministic, tie-break, fallback
    │   ├── strategic-inspect.test.ts      # NEW — inspectTopMoves ranking + no-mutation
    │   └── bot-perf.test.ts               # EDIT — add Strategic move-time budget (<100ms avg / <2000ms worst)
    └── bots/
        └── strategic-tournament.test.ts   # NEW — Strategic vs Greedy 1000-game win-rate (SC-001)

src/ui/
├── types/setup.ts               # EDIT: BotStrategyUI = "random" | "strategic" (drop "greedy")
├── hooks/useBotGame.ts          # EDIT: getBotFunction maps "strategic" → strategicBot; replace yieldingGreedyBot path
├── components/SetupScreen.tsx   # EDIT: replace "Greedy" radio with "Strategic"
└── components/__tests__/SetupScreen.test.tsx  # EDIT: assert "Strategic" present, "Greedy" absent
```

**Structure Decision**: Single-project layout. The bot is implemented as a directory
`src/core/bots/strategic/` (not a single file) so that each game-theoretic principle
maps to its own named, independently testable function — satisfying FR-003–FR-008,
SC-004 (developer locates each of the five heuristic categories in <30s), and the
Biome cognitive-complexity ≤ 15 gate. The UI touch is intentionally minimal (selector
label + dispatch), preserving UI/Engine separation. The Greedy bot is retained
in-tree for tournament comparison and as the documented zero-heuristic fallback.

## Complexity Tracking

> No constitutional violations. Section intentionally empty.
