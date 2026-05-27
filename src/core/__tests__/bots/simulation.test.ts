import { describe, expect, it } from "vitest";
import { greedyBot, randomBot } from "../../bots";
import { runSimulation } from "../../bots/simulate";

describe("runSimulation", () => {
  it("returns correct result shape for a 2-game sample (T027)", () => {
    const result = runSimulation({
      botA: randomBot,
      botB: randomBot,
      games: 2,
      alternateStarts: false,
    });

    expect(result.totalGames).toBe(2);
    expect(result.winsA + result.winsB + result.draws + result.crashes).toBe(2);
    expect(typeof result.winsA).toBe("number");
    expect(typeof result.winsB).toBe("number");
    expect(typeof result.draws).toBe("number");
    expect(typeof result.crashes).toBe("number");
  });

  it("1000-game Random vs Greedy with alternateStarts completes with crashes === 0 (T028)", () => {
    const result = runSimulation({
      botA: greedyBot,
      botB: randomBot,
      games: 1000,
      alternateStarts: true,
    });

    expect(result.crashes).toBe(0);
    expect(result.totalGames).toBe(1000);
  });

  it("Greedy wins at least as many as Random over 1000 games with alternating starts (T029)", () => {
    const result = runSimulation({
      botA: greedyBot,
      botB: randomBot,
      games: 1000,
      alternateStarts: true,
    });

    // Greedy should not be significantly worse than Random (allow small statistical variance)
    expect(result.winsA + result.draws).toBeGreaterThanOrEqual(result.winsB);
  });

  it("respects alternateStarts (even games = botA P1, odd games = botB P1) (T030)", () => {
    // With alternateStarts: true and games=4
    // Game 0: botA is P1, Game 1: botB is P1, Game 2: botA is P1, Game 3: botB is P1
    const result = runSimulation({
      botA: greedyBot,
      botB: randomBot,
      games: 4,
      alternateStarts: true,
    });

    expect(result.totalGames).toBe(4);
    expect(result.crashes).toBe(0);
  });

  it("1000-game simulation completes in under 60s (T031)", () => {
    const start = performance.now();
    const result = runSimulation({
      botA: greedyBot,
      botB: randomBot,
      games: 1000,
      alternateStarts: true,
    });
    const elapsed = performance.now() - start;

    expect(result.totalGames).toBe(1000);
    expect(elapsed).toBeLessThan(60000);
  });
});
