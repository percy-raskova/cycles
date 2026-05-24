import { describe, expect, it } from "vitest";
import { makeBlockedBoardState } from "../../../../tests/fixtures/board-states";
import { computeFinalScore, createSession, hasLegalMoves, step } from "../../session";
import type { GameSession } from "../../session";
import { joinCoins, legalJoins, placeCoin } from "../../state";

describe("Terminal conditions", () => {
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
      const state = exhaustJoins(placeAllCoins(createSession().state));
      const session: GameSession = { ...createSession(), state };
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
      const result = step(session, {
        type: "PLACE",
        position: { row: 0, col: 0 },
        face: "heads",
      });
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      expect(result.session.state.currentPlayer).toBe("TAILS");
      expect(result.session.state.coins.has("0,0")).toBe(true);
      expect(result.session.history).toHaveLength(1);
      expect(result.session.isTerminal).toBe(false);
    });

    it("returns error for invalid PLACE", () => {
      const session = createSession();
      const result = step(session, {
        type: "PLACE",
        position: { row: 10, col: 0 },
        face: "heads",
      });
      expect(result.kind).toBe("error");
      if (result.kind !== "error") return;
      expect(result.error).toContain("Invalid");
    });

    it("rejects PASS when legal moves exist", () => {
      const session = createSession();
      const result = step(session, { type: "PASS" });
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
      const state = exhaustJoins(placeAllCoins(createSession().state));
      const session: GameSession = { ...createSession(), state };

      const r1 = step(session, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      expect(r1.kind).toBe("ok");
      if (r1.kind !== "ok") return;
      expect(r1.session.isTerminal).toBe(false);
      expect(r1.session.state.passCount).toBe(1);

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

  describe("terminal and auto-pass edge cases", () => {
    it("ends game after two consecutive forced passes", () => {
      const state = buildBlocked3x4Board(createSession({ firstPlayer: "HEADS" }).state);
      let session: GameSession = { ...createSession({ firstPlayer: "HEADS" }), state };
      expect(hasLegalMoves(session)).toBe(false);

      const pass1 = step(session, { type: "PASS" });
      expect(pass1.kind).toBe("ok");
      if (pass1.kind !== "ok") return;
      session = pass1.session;
      expect(session.isTerminal).toBe(false);
      expect(session.state.passCount).toBe(1);

      const pass2 = step(session, { type: "PASS" });
      expect(pass2.kind).toBe("ok");
      if (pass2.kind !== "ok") return;
      session = pass2.session;
      expect(session.isTerminal).toBe(true);
      expect(session.state.passCount).toBe(2);
      expect(session.winner).not.toBeNull();
    });

    it("no auto-pass when exactly one legal move remains", () => {
      let session = createSession({ firstPlayer: "HEADS" });
      let state = session.state;
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      state = placeCoin(state, { row: 0, col: 2 }, "tails");
      session = { ...session, state };

      expect(hasLegalMoves(session)).toBe(true);
      expect(session.isTerminal).toBe(false);
    });

    it("accurate final score computation", () => {
      let session = createSession({ firstPlayer: "HEADS" });
      let state = session.state;
      for (let i = 0; i < 6; i++) {
        state = placeCoin(state, { row: 0, col: i }, i % 2 === 0 ? "heads" : "tails");
      }
      for (let i = 0; i < 6; i++) {
        state = placeCoin(state, { row: 1, col: i }, i % 2 === 0 ? "heads" : "tails");
      }

      session = { ...session, state };
      const score = computeFinalScore(session);
      expect(score.heads).toBe(6);
      expect(score.tails).toBe(6);
      expect(score.winner).toBe("draw");
    });

    it("draw outcome when heads === tails", () => {
      let session = createSession({ firstPlayer: "HEADS" });
      let state = session.state;
      for (let i = 0; i < 6; i++) {
        state = placeCoin(state, { row: i % 7, col: Math.floor(i / 7) }, "heads");
      }
      for (let i = 0; i < 6; i++) {
        state = placeCoin(state, { row: (i + 6) % 7, col: Math.floor((i + 6) / 7) }, "tails");
      }

      session = { ...session, state };
      const score = computeFinalScore(session);
      expect(score.heads).toBe(6);
      expect(score.tails).toBe(6);
      expect(score.winner).toBe("draw");
    });

    it("zero-degree coin retains face in final score", () => {
      let session = createSession({ firstPlayer: "HEADS" });
      let state = session.state;
      state = placeCoin(state, { row: 0, col: 0 }, "heads");
      for (let i = 1; i < 12; i++) {
        state = placeCoin(state, { row: i % 7, col: Math.floor(i / 7) }, "tails");
      }

      session = { ...session, state };
      const score = computeFinalScore(session);
      expect(score.heads).toBe(1);
      expect(score.tails).toBe(11);
      expect(session.state.coins.get("0,0")?.face).toBe("heads");
    });

    it("blocked board reaches terminal after two passes", () => {
      let session = createSession({ firstPlayer: "HEADS" });
      const state = makeBlockedBoardState();

      session = { ...session, state };
      expect(legalJoins(session.state)).toHaveLength(0);
      expect(hasLegalMoves(session)).toBe(false);

      const pass1 = step(session, { type: "PASS" });
      expect(pass1.kind).toBe("ok");
      if (pass1.kind !== "ok") return;
      session = pass1.session;

      const pass2 = step(session, { type: "PASS" });
      expect(pass2.kind).toBe("ok");
      if (pass2.kind !== "ok") return;
      session = pass2.session;

      expect(session.isTerminal).toBe(true);
    });
  });

  describe("performance", () => {
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
});

function placeAllCoins(state: GameSession["state"]): GameSession["state"] {
  let current = state;
  for (let i = 0; i < 12; i++) {
    current = placeCoin(
      current,
      { row: i % 7, col: Math.floor(i / 7) },
      i % 2 === 0 ? "heads" : "tails",
    );
  }
  return current;
}

function exhaustJoins(state: GameSession["state"]): GameSession["state"] {
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

function buildBlocked3x4Board(state: GameSession["state"]): GameSession["state"] {
  let current = state;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      current = placeCoin(current, { row, col }, (row + col) % 2 === 0 ? "heads" : "tails");
    }
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      current = joinCoins(current, { row, col }, { row, col: col + 1 });
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      current = joinCoins(current, { row, col }, { row: row + 1, col });
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      current = joinCoins(current, { row, col }, { row: row + 1, col: col + 1 });
    }
  }
  return current;
}
