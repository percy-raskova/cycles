import { describe, expect, it } from "vitest";
import { greedyBot, runSimulation, strategicBot } from "../../bots";

// The full SC-001/SC-003 runs are slow (the Strategic bot searches 3 plies per move),
// so they are gated behind an env flag and excluded from the default pre-commit suite.
// Run them on demand:  STRATEGIC_LONG_TESTS=1 bun run test:run -- strategic-tournament
const LONG = process.env.STRATEGIC_LONG_TESTS === "1";

/**
 * Aggregate Strategic's wins across BOTH color assignments. `runSimulation` buckets
 * wins by FACE (botA always plays HEADS) and `alternateStarts` only alternates the
 * first mover — so to measure color-independent skill we run both assignments and sum
 * (contracts/tournament.md T1). The shared harness is used as-is (DRY).
 */
function duel(games: number): {
  strategicWins: number;
  greedyWins: number;
  draws: number;
  crashes: number;
  total: number;
} {
  const half = Math.floor(games / 2);
  const stratHeads = runSimulation({
    botA: strategicBot,
    botB: greedyBot,
    games: half,
    alternateStarts: true,
  });
  const stratTails = runSimulation({
    botA: greedyBot,
    botB: strategicBot,
    games: games - half,
    alternateStarts: true,
  });
  return {
    strategicWins: stratHeads.winsA + stratTails.winsB,
    greedyWins: stratHeads.winsB + stratTails.winsA,
    draws: stratHeads.draws + stratTails.draws,
    crashes: stratHeads.crashes + stratTails.crashes,
    total: games,
  };
}

describe("Strategic vs Greedy tournament", () => {
  it("small sample: zero crashes, results well-formed (T021 / SC-003 smoke)", () => {
    const r = duel(8);
    expect(r.crashes).toBe(0); // SC-003 smoke; full win-rate claim is the gated SC-001 test
    expect(r.strategicWins + r.greedyWins + r.draws).toBe(8);
  });

  it("is deterministic: identical aggregate on re-run (FR-002 / T4)", () => {
    expect(duel(2)).toEqual(duel(2));
  });

  it.runIf(LONG)("1000 games: Strategic wins ≥55% of decisive games (SC-001)", () => {
    const r = duel(1000);
    expect(r.crashes).toBe(0);
    const decisive = r.strategicWins + r.greedyWins;
    console.log(
      `[SC-001] strategic=${r.strategicWins} greedy=${r.greedyWins} draws=${r.draws} ` +
        `rate=${((r.strategicWins / decisive) * 100).toFixed(1)}%`,
    );
    expect(r.strategicWins - r.greedyWins).toBeGreaterThan(0);
    expect(r.strategicWins / decisive).toBeGreaterThanOrEqual(0.55);
  });
});
