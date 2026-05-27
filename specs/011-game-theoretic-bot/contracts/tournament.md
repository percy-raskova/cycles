# Contract: Head-to-Head Tournament (regression & validation)

This reuses the **existing** `runSimulation` harness in `src/core/bots/simulate.ts`
(FR-010). No new tournament code is required; this contract pins the inputs/outputs the
Strategic-bot validation depends on (SC-001, SC-003) and documents an assumption to
verify.

---

## T1 — `runSimulation(config): SimulationResult` (existing)

```ts
interface SimulationConfig {
  readonly botA: BotFunction;       // Strategic under test
  readonly botB: BotFunction;       // Greedy baseline
  readonly games: number;           // 1000 for SC-001
  readonly alternateStarts: boolean;// true for SC-001 (fair start parity)
}
interface SimulationResult {
  readonly winsA: number;
  readonly winsB: number;
  readonly draws: number;
  readonly crashes: number;
  readonly totalGames: number;
}
```

### Behavioral notes (from reading `simulate.ts`)
- `runSingleGame` maps **winner by face**: a `"HEADS"` win increments `winsA`, `"TAILS"`
  increments `winsB` — i.e. results are bucketed by *which face won*, **not by which
  bot played which face**. `alternateStarts` swaps the *starting player*, but `botA`
  always plays `HEADS` and `botB` always plays `TAILS` in `advanceGame`
  (`session.state.currentPlayer === "HEADS" ? botA : botB`).

> ⚠️ **Verification item for the tournament test, not a harness change.** Because the
> bot→face binding is fixed (botA=Heads, botB=Tails) while only the *first mover*
> alternates, "alternating starts" alternates tempo but not color. To measure a
> color-independent win rate for SC-001, the Strategic-vs-Greedy test SHOULD run two
> configurations and aggregate: (1) `botA=strategic, botB=greedy`, and
> (2) `botA=greedy, botB=strategic`, summing Strategic's wins across both. This must be
> done **in the test**, treating `runSimulation` as-is (DRY; do not modify the shared
> harness for a test concern). If a future need arises for bot-indexed (not face-indexed)
> results, propose a harness change separately under its own spec.

---

## T2 — SC-001 acceptance (win-rate)

**Test**: `strategic-tournament.test.ts`

- Run 1,000 games (or 2×500 across the two color configs in T1) with
  `alternateStarts: true`.
- Aggregate Strategic wins (`S`) and Greedy wins (`G`) across configs.
- **Assert** `S − G > 0` **and** `S / (S + G) >= 0.55` (decisive-game win rate).
- Mark the test with the project's long-running convention if 1,000 games exceed the
  default Vitest timeout; otherwise scale down to a statistically adequate N during dev
  and run the full 1,000 in a dedicated/perf test (mirrors existing
  `simulation.test.ts` T031 1000-game pattern).

## T3 — SC-003 acceptance (safety)

- Across the tournament (and a separate 10,000-game self/mixed run if feasible),
  **assert** `crashes === 0`. Since an illegal move surfaces as a `step` error →
  thrown in `advanceGame` → counted in `crashes`, `crashes === 0` simultaneously
  certifies "zero illegal moves" and "zero crashes".

## T4 — Determinism in tournaments

- With the default (non-binding-deadline) Strategic config, a fixed `firstPlayer`
  sequence yields a reproducible `SimulationResult` across runs (FR-002). The
  tournament test MAY assert byte-identical results on a re-run with the same config to
  guard against accidental nondeterminism (e.g. `Map` iteration order, `Date.now`).
