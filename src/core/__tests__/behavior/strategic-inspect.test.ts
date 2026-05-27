import { describe, expect, it } from "vitest";
import { allLegalMoves } from "../../bots/legal-moves";
import { inspectTopMoves, strategicBot } from "../../bots/strategic";
import { DEFAULT_WEIGHTS } from "../../bots/strategic/weights";
import { createInitialState, placeCoin } from "../../state";
import type { GameState } from "../../types";

const WEIGHT_OF: Record<string, number> = {
  sigmaTerm: DEFAULT_WEIGHTS.sigma,
  boundary: DEFAULT_WEIGHTS.boundary,
  centerAvoid: DEFAULT_WEIGHTS.centerAvoid,
  tempo: DEFAULT_WEIGHTS.tempo,
  deltaSigma: DEFAULT_WEIGHTS.deltaSigma,
  cycleClose: DEFAULT_WEIGHTS.cycleClose,
};

function midGame(): GameState {
  let s = createInitialState("HEADS");
  s = placeCoin(s, { row: 0, col: 0 }, "heads");
  s = placeCoin(s, { row: 0, col: 2 }, "tails");
  s = placeCoin(s, { row: 3, col: 3 }, "heads");
  s = placeCoin(s, { row: 6, col: 6 }, "tails");
  return s;
}

describe("inspectTopMoves (FR-011) (T025)", () => {
  it("returns min(n, candidateCount) entries", () => {
    const s = midGame();
    const total = allLegalMoves(s).length;
    expect(inspectTopMoves(s, 3).length).toBe(3);
    expect(inspectTopMoves(s, total + 50).length).toBe(total);
  });

  it("returns [] for n = 0", () => {
    expect(inspectTopMoves(midGame(), 0)).toEqual([]);
  });

  it("is sorted by totalScore descending", () => {
    const top = inspectTopMoves(midGame(), 50);
    for (let i = 1; i < top.length; i++) {
      expect((top[i - 1]?.totalScore ?? 0) >= (top[i]?.totalScore ?? 0)).toBe(true);
    }
  });

  it("each breakdown entry has weighted === raw × weight", () => {
    const top = inspectTopMoves(midGame(), 10);
    for (const entry of top) {
      for (const [name, contribution] of Object.entries(entry.breakdown)) {
        expect(contribution.weighted).toBeCloseTo(contribution.raw * (WEIGHT_OF[name] ?? 0), 9);
      }
    }
  });

  it("does not mutate the input state (R9)", () => {
    const s = midGame();
    const coinsBefore = new Map(s.coins);
    const edgesBefore = [...s.edges];
    inspectTopMoves(s, 5);
    expect(s.coins).toEqual(coinsBefore);
    expect(s.edges).toEqual(edgesBefore);
  });

  it("top entry's move equals strategicBot(state) (C2 consistency)", () => {
    const s = midGame();
    expect(inspectTopMoves(s, 1)[0]?.move).toEqual(strategicBot(s));
  });
});
