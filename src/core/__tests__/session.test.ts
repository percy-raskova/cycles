import { describe, expect, it } from "vitest";
import { computeFinalScore, createSession, getTurnPrompt, hasLegalMoves, step } from "../session";
import type { GameSession } from "../session";
import { joinCoins, legalJoins, placeCoin } from "../state";
import type { GameState, Move } from "../types";

function exhaustJoins(state: GameState): GameState {
  let current = state;
  for (let safety = 0; safety < 1000; safety++) {
    const joins = legalJoins(current);
    if (joins.length === 0) break;
    const pair = joins[0];
    if (!pair) break;
    const [a, b] = pair;
    current = joinCoins(current, a, b);
  }
  return current;
}

function placeAllCoins(state: GameState): GameState {
  let current = state;
  let count = 0;
  for (let row = 0; row < 7 && count < 12; row++) {
    for (let col = 0; col < 7 && count < 12; col++) {
      current = placeCoin(current, { row, col }, count % 2 === 0 ? "heads" : "tails");
      count++;
    }
  }
  return current;
}

describe("createSession", () => {
  it("uses explicit first player when provided", () => {
    const session = createSession({ firstPlayer: "TAILS" });
    expect(session.state.currentPlayer).toBe("TAILS");
    expect(session.isTerminal).toBe(false);
    expect(session.history).toHaveLength(0);
    expect(session.winner).toBeNull();
  });

  it("uses seeded rng to pick first player deterministically", () => {
    const alwaysHeads = () => 0.1;
    const session = createSession({ rng: alwaysHeads });
    expect(session.state.currentPlayer).toBe("HEADS");

    const alwaysTails = () => 0.9;
    const session2 = createSession({ rng: alwaysTails });
    expect(session2.state.currentPlayer).toBe("TAILS");
  });

  it("picks a valid player at random when no options given", () => {
    const session = createSession();
    expect(["HEADS", "TAILS"]).toContain(session.state.currentPlayer);
  });
});

describe("hasLegalMoves", () => {
  it("returns true on a fresh board (placements available)", () => {
    const session = createSession();
    expect(hasLegalMoves(session)).toBe(true);
  });

  it("returns true when coins remain but no joins yet", () => {
    const session = createSession();
    const state = placeCoin(session.state, { row: 0, col: 0 }, "heads");
    expect(hasLegalMoves({ ...session, state })).toBe(true);
  });

  it("returns false when supply exhausted and no joins possible", () => {
    // Place all coins, then exhaustively draw every legal edge
    const state = exhaustJoins(placeAllCoins(createSession().state));
    const session: GameSession = {
      ...createSession(),
      state,
    };
    expect(state.coinsRemaining).toBe(0);
    expect(hasLegalMoves(session)).toBe(false);
  });
});

describe("computeFinalScore", () => {
  it("returns 0-0 draw on empty board", () => {
    const session = createSession();
    const score = computeFinalScore(session);
    expect(score.heads).toBe(0);
    expect(score.tails).toBe(0);
    expect(score.winner).toBe("draw");
  });

  it("counts heads and tails correctly", () => {
    let state = createSession().state;
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 1 }, "heads");
    state = placeCoin(state, { row: 0, col: 2 }, "tails");
    const session: GameSession = { ...createSession(), state };
    const score = computeFinalScore(session);
    expect(score.heads).toBe(2);
    expect(score.tails).toBe(1);
    expect(score.winner).toBe("HEADS");
  });

  it("declares draw when counts are equal", () => {
    let state = createSession().state;
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 1 }, "tails");
    const session: GameSession = { ...createSession(), state };
    const score = computeFinalScore(session);
    expect(score.winner).toBe("draw");
  });
});

describe("step", () => {
  it("applies a PLACE move and alternates player", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    const move: Move = { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" };
    const result = step(session, move);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.session.state.currentPlayer).toBe("TAILS");
    expect(result.session.state.coins.has("0,0")).toBe(true);
    expect(result.session.history).toHaveLength(1);
    expect(result.session.isTerminal).toBe(false);
  });

  it("returns error for invalid PLACE", () => {
    const session = createSession();
    const move: Move = { type: "PLACE", position: { row: 10, col: 0 }, face: "heads" };
    const result = step(session, move);
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.error).toContain("Invalid");
  });

  it("rejects PASS when legal moves exist", () => {
    const session = createSession();
    const move: Move = { type: "PASS" };
    const result = step(session, move);
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.error).toContain("Cannot pass");
  });

  it("forces a pass when no legal moves exist", () => {
    const state = exhaustJoins(placeAllCoins(createSession({ firstPlayer: "HEADS" }).state));
    const session: GameSession = { ...createSession({ firstPlayer: "HEADS" }), state };

    const result = step(session, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.session.state.lastAction).toBe("PASS");
    expect(result.session.state.currentPlayer).toBe("TAILS");
  });

  it("ends game after two consecutive forced passes", () => {
    // Construct a state where neither player has legal moves
    const state = exhaustJoins(placeAllCoins(createSession().state));
    const session: GameSession = { ...createSession(), state };

    // HEADS has no legal moves → forced pass
    const r1 = step(session, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
    expect(r1.kind).toBe("ok");
    if (r1.kind !== "ok") return;
    expect(r1.session.isTerminal).toBe(false);
    expect(r1.session.state.passCount).toBe(1);

    // TAILS has no legal moves → forced pass
    const r2 = step(r1.session, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
    expect(r2.kind).toBe("ok");
    if (r2.kind !== "ok") return;
    expect(r2.session.isTerminal).toBe(true);
    expect(r2.session.state.passCount).toBe(2);
    expect(r2.session.winner).toBeDefined();
  });

  it("returns error when game is already terminal", () => {
    const terminalSession: GameSession = {
      ...createSession(),
      isTerminal: true,
      winner: "draw",
    };
    const result = step(terminalSession, { type: "PASS" });
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.error).toContain("already over");
  });

  it("resets pass count after a non-pass move", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    const s1 = step(session, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
    expect(s1.kind).toBe("ok");
    if (s1.kind !== "ok") return;
    expect(s1.session.state.passCount).toBe(0);
  });
});

describe("getTurnPrompt", () => {
  it("includes player name and coins remaining", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    expect(getTurnPrompt(session)).toBe("HEADS to move — 12 coins remain");
  });

  it("updates after a move", () => {
    const result = step(createSession({ firstPlayer: "HEADS" }), {
      type: "PLACE",
      position: { row: 0, col: 0 },
      face: "heads",
    });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(getTurnPrompt(result.session)).toBe("TAILS to move — 11 coins remain");
  });
});

describe("session property tests", () => {
  it("maintains coin count invariant after any sequence of moves", () => {
    let session = createSession({ firstPlayer: "HEADS" });
    const moves: Move[] = [
      { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" },
      { type: "PLACE", position: { row: 0, col: 1 }, face: "tails" },
      { type: "PLACE", position: { row: 1, col: 0 }, face: "heads" },
      { type: "PLACE", position: { row: 1, col: 1 }, face: "tails" },
    ];

    for (const move of moves) {
      const result = step(session, move);
      if (result.kind !== "ok") continue;
      session = result.session;
      expect(session.state.coins.size + session.state.coinsRemaining).toBe(12);
    }
  });

  it("terminal state never reverses", () => {
    const state = exhaustJoins(placeAllCoins(createSession({ firstPlayer: "HEADS" }).state));
    const session = { ...createSession({ firstPlayer: "HEADS" }), state };

    const r1 = step(session, { type: "PASS" });
    expect(r1.kind).toBe("ok");
    if (r1.kind !== "ok") return;

    const r2 = step(r1.session, { type: "PASS" });
    expect(r2.kind).toBe("ok");
    if (r2.kind !== "ok") return;
    expect(r2.session.isTerminal).toBe(true);

    const r3 = step(r2.session, { type: "PASS" });
    expect(r3.kind).toBe("error");
  });

  it("pass count stays within valid range", () => {
    // After two passes, game ends, so passCount should never exceed 2
    const state = exhaustJoins(placeAllCoins(createSession({ firstPlayer: "HEADS" }).state));
    const session = { ...createSession({ firstPlayer: "HEADS" }), state };

    const r1 = step(session, { type: "PASS" });
    if (r1.kind === "ok") {
      expect(r1.session.state.passCount).toBeLessThanOrEqual(2);
    }
  });
});

describe("session performance", () => {
  it("computes final score 100 times in under 1 second", () => {
    const state = placeAllCoins(createSession({ firstPlayer: "HEADS" }).state);
    const session = { ...createSession({ firstPlayer: "HEADS" }), state };

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      computeFinalScore(session);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});

import fc from "fast-check";

describe("session fast-check properties", () => {
  it("coin count invariant holds after any sequence of legal placements", () => {
    const posArb = fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 }));
    const faceArb = fc.constantFrom<"heads" | "tails">("heads", "tails");

    fc.assert(
      fc.property(fc.array(fc.tuple(posArb, faceArb), { maxLength: 15 }), (moves) => {
        let session = createSession({ firstPlayer: "HEADS" });
        for (const [[row, col], face] of moves) {
          const result = step(session, { type: "PLACE", position: { row, col }, face });
          if (result.kind !== "ok") continue;
          session = result.session;
        }
        return session.state.coins.size + session.state.coinsRemaining === 12;
      }),
      { numRuns: 200 },
    );
  });

  it("terminal flag implies passCount >= 2", () => {
    const posArb = fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 }));
    const faceArb = fc.constantFrom<"heads" | "tails">("heads", "tails");

    fc.assert(
      fc.property(fc.array(fc.tuple(posArb, faceArb), { maxLength: 15 }), (moves) => {
        let session = createSession({ firstPlayer: "HEADS" });
        for (const [[row, col], face] of moves) {
          const result = step(session, { type: "PLACE", position: { row, col }, face });
          if (result.kind !== "ok") continue;
          session = result.session;
        }
        return !session.isTerminal || session.state.passCount >= 2;
      }),
      { numRuns: 200 },
    );
  });
});
