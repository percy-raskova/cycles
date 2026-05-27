# Quickstart: Game-Theoretic (Strategic) Bot

Audience: a developer implementing, tuning, or debugging the Strategic bot.
Prereqs: repo cloned, `bun install` done. All commands run from `cycles/`.

---

## Run the bot in the app

```bash
bun run dev          # start Vite dev server
```

Open the app → **New Game** → Opponent: **Strategic** → pick your role → **Start Game**.
The bot moves after the configured delay (default 2,000 ms). "Greedy" is no longer in
the selector (it remains in the engine for tournaments).

## Run the bot from the CLI

```bash
bun run cli          # interactive CLI game (engine-only, no React)
```

## Use the bot programmatically

```ts
import { strategicBot, inspectTopMoves, createInitialState } from "@core";

const state = createInitialState("HEADS");
const move = strategicBot(state);          // legal, deterministic Move

// Inspect why it chose what it chose:
const top5 = inspectTopMoves(state, 5);
for (const c of top5) {
  console.log(c.totalScore, c.move, c.breakdown);
  // breakdown: { deltaSigma: {raw, weighted}, boundaryPlacement: {...}, ... }
}
```

`strategicBot` and `inspectTopMoves` are pure: they never mutate `state` and never
perform IO. The same `state` always yields the same result.

---

## Tune the heuristic weights (the Q3 hand-tuning loop)

1. Edit constants in `src/core/bots/strategic/weights.ts` (start from the documented
   defaults; see `research.md` R8).
2. Re-run the win-rate tournament against Greedy:
   ```bash
   bun run test:run -- strategic-tournament
   ```
3. Read the printed win rate. Target: `Strategic / (Strategic + Greedy) ≥ 0.55`
   (SC-001). Adjust weights, repeat. Leave `W_SIGMA` (the exact margin) dominant and the
   ordering weights (`deltaSigma`, `cycleClose`) near identity; tune the softer leaf
   positional weights (`boundary`, `centerAvoid`, `tempo`) first.
4. When satisfied, commit the final constants. They are the bot's permanent tuning.

> The bot does **not** learn across games — tuning is a manual developer loop, and the
> committed constants are the only thing that changes behavior.

## Tune search/perf knobs

In `weights.ts`: `K_BEAM` (interior beam width), `EXHAUSTIVE_LEAF_LIMIT` (endgame
switch), `SEARCH_DEPTH` (fixed at 3 per spec), `DEFAULT_DEADLINE_MS`. Verify perf after
any change:

```bash
bun run test:run -- bot-perf      # asserts <100ms avg, <2000ms worst per move
```

---

## Run the test suite (TDD order)

```bash
bun run test:run -- strategic-heuristics   # 1. per-heuristic units (write/fail first)
bun run test:run -- strategic-search       # 2. minimax / alpha-beta / forced-pass / endgame / timeout
bun run test:run -- strategic-bot          # 3. end-to-end: legal, deterministic, tie-break, fallback
bun run test:run -- strategic-inspect      # 4. inspectTopMoves ranking + no-mutation
bun run test:run -- strategic-tournament   # 5. SC-001 win rate, SC-003 smoke (zero crashes)
bun run test:run -- strategic-safety       # 6. SC-003 full 10,000-game safety gate (long-running)
bun run test:run -- SetupScreen            # 7. UI: "Strategic" present, "Greedy" absent

bun run test:coverage                      # confirm src/core ≥ 90%
bun run typecheck && bun run lint          # gates: tsc + Biome (complexity ≤ 15)
```

---

## Acceptance checklist (maps to spec Success Criteria)

- [ ] **SC-001**: `strategic-tournament` shows Strategic ≥ 55% of decisive games vs Greedy.
- [ ] **SC-002**: `bot-perf` shows < 100 ms avg, < 2,000 ms worst per move.
- [ ] **SC-003**: tournament/self-play shows `crashes === 0` (⇒ zero illegal moves).
- [ ] **SC-004**: each of the five heuristics is a named function in
      `src/core/bots/strategic/heuristics.ts`, locatable in < 30 s.
- [ ] **FR-001**: setup screen offers Human/Random/Strategic; no "Greedy".
- [ ] **FR-011**: `inspectTopMoves(state, n)` returns ranked breakdowns without mutation.

## Where things live

| Concern | File |
|---------|------|
| Bot entry + fallbacks | `src/core/bots/strategic/index.ts` |
| σ margin & per-move Δσ | `src/core/bots/strategic/sigma.ts` |
| 3-ply alpha–beta search, endgame, timeout | `src/core/bots/strategic/search.ts` |
| Weighted-sum leaf eval + Greedy fallback | `src/core/bots/strategic/evaluate.ts` |
| Named heuristics (the five principles) | `src/core/bots/strategic/heuristics.ts` |
| Tie-break + move ordering | `src/core/bots/strategic/move-order.ts` |
| Tunable weights/knobs | `src/core/bots/strategic/weights.ts` |
| Public exports + `BotStrategy` union | `src/core/bots/index.ts` |
| UI selector + dispatch | `src/ui/components/SetupScreen.tsx`, `src/ui/hooks/useBotGame.ts`, `src/ui/types/setup.ts` |
