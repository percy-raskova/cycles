import { describe, expect, it } from "vitest";
import { greedyBot, randomBot, runSimulation, strategicBot } from "../../bots";

// SC-003 full-scale safety gate (closes analyze finding C1). Gated behind an env flag;
// excluded from the default pre-commit suite. Run on demand:
//   STRATEGIC_LONG_TESTS=1 bun run test:run -- strategic-safety
const LONG = process.env.STRATEGIC_LONG_TESTS === "1";

// SC-003's literal target is 10,000 full-game simulations. With a 3-ply bot, Strategic
// self-play is ~3s/game, so 10,000 games is multiple hours. The on-demand default is
// 1,000 games (same code path, high confidence); set STRATEGIC_SAFETY_GAMES=10000 to run
// the full scale. Per-move legality is ALSO structurally guaranteed (the bot only ever
// returns a move from allLegalMoves) and property-tested in strategic-bot.test.
const SAFETY_GAMES = Number(process.env.STRATEGIC_SAFETY_GAMES ?? "1000");

describe.runIf(LONG)("Strategic safety — zero illegal moves / crashes (SC-003)", () => {
  it(`runs ${SAFETY_GAMES} games (self-play + vs greedy + vs random) with zero crashes`, () => {
    const third = Math.floor(SAFETY_GAMES / 3);
    const selfPlay = runSimulation({
      botA: strategicBot,
      botB: strategicBot,
      games: third,
      alternateStarts: true,
    });
    const vsGreedy = runSimulation({
      botA: strategicBot,
      botB: greedyBot,
      games: third,
      alternateStarts: true,
    });
    const vsRandom = runSimulation({
      botA: strategicBot,
      botB: randomBot,
      games: SAFETY_GAMES - 2 * third,
      alternateStarts: true,
    });
    const crashes = selfPlay.crashes + vsGreedy.crashes + vsRandom.crashes;
    const total = selfPlay.totalGames + vsGreedy.totalGames + vsRandom.totalGames;
    console.log(`[SC-003] games=${total} crashes=${crashes}`);
    expect(crashes).toBe(0);
    expect(total).toBe(SAFETY_GAMES);
  });
});
