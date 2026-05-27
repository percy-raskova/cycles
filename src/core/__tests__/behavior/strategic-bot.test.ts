import { describe, expect, it } from "vitest";
import { greedyBot } from "../../bots/greedy";
import { allLegalMoves } from "../../bots/legal-moves";
import { createStrategicBot, inspectTopMoves, strategicBot } from "../../bots/strategic";
import { DEFAULT_CONFIG } from "../../bots/strategic/weights";
import { applyMove } from "../../move";
import { createInitialState, placeCoin } from "../../state";
import type { GameState } from "../../types";

/** Build a reachable state with a random number (4..12) of placed coins. */
function buildRandomState(): GameState {
  let state = createInitialState(Math.random() > 0.5 ? "HEADS" : "TAILS");
  const target = 4 + Math.floor(Math.random() * 9);
  for (let c = 0; c < target; c++) {
    const places = allLegalMoves(state).filter((m) => m.type === "PLACE");
    if (places.length === 0) break;
    const move = places[Math.floor(Math.random() * places.length)];
    if (!move) break;
    state = applyMove(state, move);
  }
  return state;
}

describe("strategicBot — legality & purity (T011)", () => {
  it("never returns an illegal move across many random reachable states (FR-002)", () => {
    for (let i = 0; i < 30; i++) {
      const state = buildRandomState();
      if (allLegalMoves(state).length === 0) continue;
      const move = strategicBot(state);
      expect(() => applyMove(state, move)).not.toThrow();
    }
  });

  it("is deterministic: same state ⇒ same move", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 1, col: 1 }, "heads");
    s = placeCoin(s, { row: 5, col: 5 }, "tails");
    s = placeCoin(s, { row: 2, col: 4 }, "heads");
    expect(strategicBot(s)).toEqual(strategicBot(s));
  });

  it("does not mutate the input state", () => {
    const state = buildRandomState();
    if (allLegalMoves(state).length === 0) return;
    const coinsBefore = new Map(state.coins);
    const edgesBefore = [...state.edges];
    strategicBot(state);
    expect(state.coins).toEqual(coinsBefore);
    expect(state.edges).toEqual(edgesBefore);
  });

  it('throws "No legal moves available" on a state with no legal moves', () => {
    const noMoves: GameState = {
      coins: new Map([["0,0", { position: { row: 0, col: 0 }, face: "heads" }]]),
      edges: [],
      currentPlayer: "HEADS",
      coinsRemaining: 0,
      passCount: 0,
      lastAction: null,
    };
    expect(() => strategicBot(noMoves)).toThrow("No legal moves available");
  });
});

describe("strategicBot — selection consistency & FR-002 tie-break (T011)", () => {
  it("chosen move equals inspectTopMoves(state, 1)[0] (shared comparator, FR-002)", () => {
    // T006 proves compareScoredMoves implements FR-002; this proves the bot uses it.
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads");
    s = placeCoin(s, { row: 6, col: 6 }, "tails");
    const top = inspectTopMoves(s, 1);
    expect(top.length).toBe(1);
    expect(strategicBot(s)).toEqual(top[0]?.move);
  });

  it("opens with a deterministic PLACE of its own face (Q4 self-face default)", () => {
    // The exact opening cell depends on the tunable weights/beam; the stable claims are
    // that the opening is deterministic and places the bot's OWN face (heads for HEADS).
    // The precise tie-break ordering is covered by the comparator test (T006).
    const first = strategicBot(createInitialState("HEADS"));
    const second = strategicBot(createInitialState("HEADS"));
    expect(first).toEqual(second);
    expect(first.type).toBe("PLACE");
    if (first.type === "PLACE") {
      expect(first.face).toBe("heads");
    }
  });
});

describe("strategicBot — fallbacks (FR-008, R4) (T011)", () => {
  it("falls back to greedyBot when every root heuristic score is zero (FR-008)", () => {
    // Phase-II, σ=0, both coins on ring cells (no boundary/center), single MIXED join
    // → every breakdown term is zero, triggering the Greedy fallback.
    const state: GameState = {
      coins: new Map([
        ["1,1", { position: { row: 1, col: 1 }, face: "heads" }],
        ["1,3", { position: { row: 1, col: 3 }, face: "tails" }],
      ]),
      edges: [],
      currentPlayer: "HEADS",
      coinsRemaining: 0,
      passCount: 0,
      lastAction: null,
    };
    const inspected = inspectTopMoves(state, 5);
    expect(inspected.length).toBe(1);
    const allZero = Object.values(inspected[0]?.breakdown ?? {}).every((c) => c.raw === 0);
    expect(allZero).toBe(true);
    expect(strategicBot(state)).toEqual(greedyBot(state));
  });

  it("falls back to greedyBot when an injected deadline elapses before any root move (R4)", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads");
    s = placeCoin(s, { row: 0, col: 2 }, "tails");
    // now() is already past the deadline (deadlineMs = 0) → searchRoot returns nothing.
    const impatient = createStrategicBot({
      ...DEFAULT_CONFIG,
      now: () => 1e9,
      deadlineMs: 0,
    });
    expect(impatient(s)).toEqual(greedyBot(s));
  });

  it("an internal deadline cutoff mid-search still returns a legal move (R4)", () => {
    let s = createInitialState("HEADS");
    s = placeCoin(s, { row: 0, col: 0 }, "heads");
    s = placeCoin(s, { row: 6, col: 6 }, "tails");
    s = placeCoin(s, { row: 3, col: 3 }, "heads");
    // A stateful clock that advances each read; with a tiny budget the deadline trips
    // partway through the search (inside negamax/expand), exercising the cutoff path.
    let t = 0;
    const bot = createStrategicBot({ ...DEFAULT_CONFIG, now: () => t++, deadlineMs: 3 });
    const move = bot(s);
    expect(() => applyMove(s, move)).not.toThrow();
  });
});
