# Contract: Strategic Bot Public API

The Strategic bot's external interface is its exported functions from
`src/core/bots/index.ts` (re-exported by `src/core/index.ts` / the `@core` alias).
This is the contract consumed by the UI (`useBotGame.ts`), the CLI, the tournament
harness, and developer tooling.

---

## C1 — `strategicBot: BotFunction`

```ts
import type { BotFunction } from "@core";
export const strategicBot: BotFunction; // (state: GameState) => Move
```

### Preconditions
- `state` is a valid `GameState` (`isValidState(state) === true`).
- `state` has at least one legal move (`allLegalMoves(state).length > 0`).
  The bot is never invoked on a forced-pass state; the session auto-passes (see
  `session.step`). If called on a no-legal-move state, behavior is to throw
  `"No legal moves available"` (matches `greedyBot`).

### Postconditions
- Returns a `Move` that is a member of `allLegalMoves(state)` — **always legal**.
- Never mutates `state` (Constitution VI; property-tested).
- **Deterministic**: identical `state` ⇒ identical `Move` across runs/platforms
  (FR-002), given the default config with a non-binding deadline.
- Returns a `PLACE` or `JOIN` only — never a `PASS` (PASS is engine-forced, never a
  bot choice; spec 003).

### Behavioral guarantees
| Requirement | Guarantee |
|-------------|-----------|
| FR-002 | Pure, synchronous, deterministic; tie-break = cycle-JOIN ≺ non-cycle-JOIN ≺ PLACE, then smallest position key. |
| FR-003 | Evaluates both faces at each empty position; picks higher-scoring face. |
| FR-004 | Non-cycle JOIN scored by Δσ algebra (+2 preferred, −2 avoided unless forced, 0 neutral). |
| FR-005 | 3-ply alpha–beta negamax; root full-width, interior beam K=`K_BEAM` (Q6); **state-based** leaf `v(state)` (Q7); cycle close = `Δσ_close + v(successor)` emerges from backup (no double count). |
| FR-006 | Defers JOINs for tempo when neither side has a +2 non-cycle JOIN and a PLACE remains (a leaf `tempo` term). |
| FR-007 | Leaf state-terms combined via fixed-weight sum; max backed-up value selected. |
| FR-008 | Falls back to `greedyBot(state)` when all root candidates' leaf scores are zero (evaluated once at the root). |
| Edge: timeout (Q8) | **Only when caller injects `now`**: on `now() >= deadlineAt`, returns best fully-evaluated root move; if none, `greedyBot(state)`. With no clock injected, no timeout — deterministic. |
| Edge: small endgame | If estimated remaining leaves ≤ `EXHAUSTIVE_LEAF_LIMIT`, plays exhaustively-optimal move. |

### Contract tests (must exist, must initially fail — TDD)
- `strategic-bot.test.ts`:
  - returns a member of `allLegalMoves` for 1,000 random reachable states (property).
  - identical output on repeated calls with the same state (determinism property).
  - does not mutate input state (deep-equality property).
  - throws `"No legal moves available"` on an empty-legal-move state.
  - tie-break ordering matches FR-002 on hand-crafted equal-score states.
  - all-zero-heuristic state ⇒ output equals `greedyBot(state)` (FR-008).
- `strategic-search.test.ts`:
  - depth-3 value matches a reference plain-minimax on small fixtures **with the beam disabled (`K=∞`)** (sound alpha–beta check); with `K=K_BEAM` the *selected root move* is still legal and the root stays full-width.
  - state-based leaf `v(state)`: a cycle-closing move's backed-up value equals `Δσ_close + v(successor)` and Δσ is **not** double-counted (assert against a hand-built fixture).
  - forced-pass nodes do not decrement depth (fixture with a player having no moves).
  - terminal detection at `passCount >= 2`.
  - **no-clock determinism**: with `now` omitted, repeated calls are byte-identical; injecting a generous clock (deadline never reached) yields the same move (Q8 / R4).
  - exhaustive switch fires below threshold and returns optimal move on a solved tiny fixture.

---

## C2 — `inspectTopMoves(state, n): readonly InspectedMove[]`

```ts
export function inspectTopMoves(
  state: GameState,
  n: number,
): readonly InspectedMove[];

interface InspectedMove {
  readonly move: Move;
  readonly totalScore: number;
  readonly breakdown: Readonly<Record<string, { raw: number; weighted: number }>>;
}
```

### Preconditions
- `state` valid; `n >= 0`.

### Postconditions
- Returns up to `min(n, candidateCount)` entries, sorted by the FR-002 comparator
  (highest `totalScore` first, then tie-break).
- Each entry's `breakdown` keys are the named heuristics that fired; values give raw
  (pre-weight) and weighted contributions.
- **Never mutates `state`** (FR-011, R9; property-tested via deep equality).
- `n === 0` ⇒ empty array; `n` larger than candidate count ⇒ all candidates.

### Contract tests
- `strategic-inspect.test.ts`:
  - length = `min(n, candidates)`.
  - sorted by `totalScore` descending then comparator.
  - `breakdown` weighted = raw × configured weight for each heuristic.
  - input state deep-equal before and after (no mutation).
  - the top entry's move equals `strategicBot(state)` when the deadline is non-binding
    (consistency between selection and inspection).

---

## C3 — Registry & type surface (`src/core/bots/index.ts`)

```ts
export type BotStrategy = "random" | "greedy" | "strategic"; // "strategic" ADDED
export { strategicBot, inspectTopMoves } from "./strategic";
```

- `greedy` stays in the engine union (tournament + fallback). It is removed only from
  the **UI** `BotStrategyUI` (`src/ui/types/setup.ts`), not from core.

---

## C4 — UI selector contract (`SetupScreen.tsx`, FR-001 / FR-009)

- The opponent radiogroup offers exactly: **Human, Random, Strategic**. "Greedy" is
  absent.
- The "Strategic" radio: `role="radio"`, `aria-checked` reflects selection,
  `aria-label="Strategic bot opponent"`, visible text label "Strategic", touch target
  ≥ 44×44 CSS px, visible keyboard focus — identical affordances to existing options.
- `getBotFunction("strategic")` returns `strategicBot`; `getBotFunction("greedy")` is
  no longer reachable from the UI (removed from `BotStrategyUI`).

### Contract test (`SetupScreen.test.tsx`)
- "Strategic" option is present and selectable; selecting it and starting a game yields
  `opponent: "strategic"` in `GameSetupOptions`.
- "Greedy" option is **absent** from the rendered radiogroup.
