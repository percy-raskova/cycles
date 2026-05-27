# Research: Baseline Bot Design Decisions

**Feature**: Baseline AI Opponents  
**Date**: 2026-05-25

## Decision 1: Bot Function Signature

**Question**: Should the bot function receive the player explicitly, or infer it from `GameState.currentPlayer`?

**Decision**: `(state: GameState) => Move` — infer player from `state.currentPlayer`.

**Rationale**:
- The spec requires stateless functions. Requiring the caller to pass a redundant `player` argument adds surface area for mismatch bugs (e.g., caller passes HEADS but state says TAILS).
- The existing engine already uses `currentPlayer` as the canonical turn indicator. Aligning the bot with this convention minimizes API divergence.
- Future MCTS bots will also need to evaluate hypothetical states where `currentPlayer` may differ from the root state's player; passing state alone is the cleanest abstraction.

**Alternatives considered**:
- `(state: GameState, player: Player) => Move` — rejected: redundant and error-prone.
- `(session: GameSession) => Move` — rejected: bots don't need history; passing history tempts stateful implementations.

---

## Decision 2: Greedy Score Evaluation Helper

**Question**: How does Greedy compute "score delta" when `computeFinalScore` returns absolute counts for both players?

**Decision**: Add a lightweight `scoreForPlayer(state: GameState, player: Player): number` helper in `src/core/`.

**Rationale**:
- `computeFinalScore` is designed for terminal scoring, not mid-game evaluation. It iterates all coins and returns both heads and tails counts.
- Greedy needs to know: "if I make this move, how many coins show my face?" It does not need the opponent's absolute count.
- A dedicated `scoreForPlayer` helper is O(n) over coins (same as `computeFinalScore`) but returns a single scalar, making the Greedy evaluation loop cleaner and more self-documenting.
- The helper is independently testable and reusable for future bots (MCTS, minimax).

**Implementation sketch**:
```typescript
export function scoreForPlayer(state: GameState, player: Player): number {
  const targetFace = player === "HEADS" ? "heads" : "tails";
  let count = 0;
  for (const coin of state.coins.values()) {
    if (coin.face === targetFace) count++;
  }
  return count;
}
```

**Alternatives considered**:
- Reuse `computeFinalScore` and extract the relevant field — rejected: slightly more verbose and less intention-revealing inside a hot evaluation loop.
- Pre-compute score deltas from move semantics (placement always +1, join depends on cycle) — rejected: too complex; simulating the move with `applyMove` is the single source of truth for rule fidelity.

---

## Decision 3: Simulation Runner Location & API

**Question**: Should the 1000-game simulation be a test-only utility, a CLI script, or a reusable core module?

**Decision**: A reusable core module `src/core/bots/simulate.ts` exporting `runSimulation(config)`, plus a lightweight CLI wrapper if needed later.

**Rationale**:
- The spec requires the simulation harness as a first-class deliverable (FR-008). Making it test-only would under-deliver.
- A pure core function keeps the harness engine-pure and independently testable. A CLI wrapper (if added later) is a thin I/O layer.
- The simulation function accepts two `BotFunction` instances, a game count, and an `alternateStarts` flag. It returns aggregated results. This makes it trivial to test Random vs Greedy, Greedy vs Greedy, or future MCTS vs Random.

**API sketch**:
```typescript
export interface SimulationConfig {
  readonly botA: BotFunction;
  readonly botB: BotFunction;
  readonly games: number;
  readonly alternateStarts: boolean;
}

export interface SimulationResult {
  readonly winsA: number;
  readonly winsB: number;
  readonly draws: number;
  readonly crashes: number;
  readonly totalGames: number;
}

export function runSimulation(config: SimulationConfig): SimulationResult;
```

**Alternatives considered**:
- Inline the simulation in a test file — rejected: not reusable for future MCTS benchmarking.
- Make it a Vite/Node script in `scripts/` — rejected: scripts can't import from `src/core/` easily without build-step coupling; a core module is cleaner.

---

## Decision 4: Bot Turn Timing in the UI

**Question**: When the bot's turn arrives, should it move instantly or with a delay?

**Decision**: The bot function is synchronous and returns instantly. The UI hook (`useBotGame.ts`) adds a 300ms minimum delay via `useEffect` + `setTimeout` for perceived human-like pacing. Tests bypass the delay by invoking the core function directly.

**Rationale**:
- Instant moves feel jarring to human players. A short delay preserves game rhythm.
- 300ms is below human reaction-time thresholds so it doesn't feel sluggish, but sufficient to signal "the opponent is thinking."
- The delay is a UI concern only; the core bot has no concept of time.
- Tests must not depend on real timers. Core bot tests invoke the function directly. UI hook tests mock `setTimeout` or use Vitest's `vi.useFakeTimers()`.

**Alternatives considered**:
- No delay — rejected: poor UX, feels like a glitch.
- Random delay 200–800ms — rejected: adds non-determinism to UI tests without meaningful UX benefit.
- Animating a "thinking" indicator — rejected: out of scope for this feature; can be added later without architectural changes.

---

## Decision 5: Game Setup UI Flow

**Question**: How does a player start a game against a bot? Replace the existing instant-start flow, or add a setup screen?

**Decision**: Add a `SetupScreen` component shown before the game starts. The existing `App.tsx` flow is preserved for direct navigation (e.g., URL hash `/play` can still start a default local-2P game).

**Rationale**:
- The current app starts a session immediately on mount. There is no natural place to inject opponent selection without restructuring the root component.
- A `SetupScreen` allows choosing opponent type (Human / Random / Greedy) and, for bot opponents, player role (P1 HEADS or P2 TAILS).
- Once setup is confirmed, the session is created with the chosen `firstPlayer` and the game board is rendered.
- The setup screen reuses existing visual patterns: modal-like centered card, `Button` component, accessible form controls.

**Alternatives considered**:
- In-game menu to switch opponent mid-match — rejected: violates spec scope and would require mid-game state migration.
- Separate routes (`/play/human`, `/play/random`) — rejected: over-engineered; the app is a single-window SPA without a router.
