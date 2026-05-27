import { describe, expect, it } from "vitest";
import type { GameSession } from "../../session";
import { canUndo, createSession, getTurnPrompt, reset, step, undo } from "../../session";
import { joinCoins, legalJoins, placeCoin } from "../../state";
import type { Move } from "../../types";

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

function placeAllCoins(state: GameSession["state"]): GameSession["state"] {
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

describe("Session lifecycle", () => {
  describe("createSession", () => {
    it("uses explicit first player when provided", () => {
      const session = createSession({ firstPlayer: "TAILS" });
      expect(session.state.currentPlayer).toBe("TAILS");
      expect(session.isTerminal).toBe(false);
      expect(session.history).toHaveLength(0);
      expect(session.winner).toBeNull();
    });

    it("defaults to TAILS as first player when no options given", () => {
      const session = createSession();
      expect(session.state.currentPlayer).toBe("TAILS");
    });

    it("allows firstPlayer to be overridden via options", () => {
      const session = createSession({ firstPlayer: "HEADS" });
      expect(session.state.currentPlayer).toBe("HEADS");

      const session2 = createSession({ firstPlayer: "TAILS" });
      expect(session2.state.currentPlayer).toBe("TAILS");
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

  describe("undo", () => {
    it("returns empty board after undoing a single PLACE", () => {
      const session = createSession({ firstPlayer: "HEADS" });
      const placed = step(session, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      expect(placed.kind).toBe("ok");
      if (placed.kind !== "ok") return;

      const undone = undo(placed.session);
      expect(undone.state.coins.size).toBe(0);
      expect(undone.state.edges).toHaveLength(0);
      expect(undone.history).toHaveLength(0);
      expect(canUndo(undone)).toBe(false);
    });

    it("restores board after undoing a JOIN", () => {
      let session = createSession({ firstPlayer: "HEADS" });

      const r1 = step(session, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      expect(r1.kind).toBe("ok");
      if (r1.kind !== "ok") return;
      session = r1.session;

      const r2 = step(session, { type: "PLACE", position: { row: 0, col: 2 }, face: "tails" });
      expect(r2.kind).toBe("ok");
      if (r2.kind !== "ok") return;
      session = r2.session;

      const r3 = step(session, { type: "JOIN", a: { row: 0, col: 0 }, b: { row: 0, col: 2 } });
      expect(r3.kind).toBe("ok");
      if (r3.kind !== "ok") return;
      session = r3.session;

      expect(session.state.edges).toHaveLength(1);

      const undone = undo(session);
      expect(undone.state.edges).toHaveLength(0);
      expect(undone.state.coins.size).toBe(2);
      expect(canUndo(undone)).toBe(true);
    });

    it("restores flipped coins after undoing a cycle-closing JOIN", () => {
      const session = buildCycleSession();

      const facesAfter3Joins = {
        "0,0": session.state.coins.get("0,0")?.face,
        "0,2": session.state.coins.get("0,2")?.face,
        "2,2": session.state.coins.get("2,2")?.face,
        "2,0": session.state.coins.get("2,0")?.face,
      };

      const closeResult = step(session, {
        type: "JOIN",
        a: { row: 2, col: 0 },
        b: { row: 0, col: 0 },
      });
      expect(closeResult.kind).toBe("ok");
      if (closeResult.kind !== "ok") return;
      const closedSession = closeResult.session;

      expect(closedSession.state.coins.get("0,0")?.face).toBe("heads");
      expect(closedSession.state.coins.get("2,0")?.face).toBe("tails");

      const undone = undo(closedSession);
      expect(undone.state.coins.get("0,0")?.face).toBe(facesAfter3Joins["0,0"]);
      expect(undone.state.coins.get("0,2")?.face).toBe(facesAfter3Joins["0,2"]);
      expect(undone.state.coins.get("2,2")?.face).toBe(facesAfter3Joins["2,2"]);
      expect(undone.state.coins.get("2,0")?.face).toBe(facesAfter3Joins["2,0"]);
      expect(undone.state.edges).toHaveLength(3);
    });
  });

  describe("reset", () => {
    it("returns empty board and disables undo after reset", () => {
      let session = createSession({ firstPlayer: "HEADS" });
      const result = step(session, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
      expect(result.kind).toBe("ok");
      if (result.kind !== "ok") return;
      session = result.session;

      expect(session.state.coins.size).toBe(1);
      expect(canUndo(session)).toBe(true);

      const fresh = reset();
      expect(fresh.state.coins.size).toBe(0);
      expect(fresh.state.edges).toHaveLength(0);
      expect(fresh.history).toHaveLength(0);
      expect(canUndo(fresh)).toBe(false);
    });
  });

  describe("invariants", () => {
    it("maintains coin count after any sequence of moves", () => {
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
      const state = exhaustJoins(placeAllCoins(createSession({ firstPlayer: "HEADS" }).state));
      const session = { ...createSession({ firstPlayer: "HEADS" }), state };

      const r1 = step(session, { type: "PASS" });
      if (r1.kind === "ok") {
        expect(r1.session.state.passCount).toBeLessThanOrEqual(2);
      }
    });
  });
});

function buildCycleSession(): GameSession {
  let session = createSession({ firstPlayer: "HEADS" });

  const positions = [
    { row: 0, col: 0, face: "heads" as const },
    { row: 0, col: 2, face: "heads" as const },
    { row: 2, col: 2, face: "tails" as const },
    { row: 2, col: 0, face: "tails" as const },
  ];

  for (const { row, col, face } of positions) {
    const result = step(session, { type: "PLACE", position: { row, col }, face });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return session;
    session = result.session;
  }

  const edges = [
    { a: { row: 0, col: 0 }, b: { row: 0, col: 2 } },
    { a: { row: 0, col: 2 }, b: { row: 2, col: 2 } },
    { a: { row: 2, col: 2 }, b: { row: 2, col: 0 } },
  ];

  for (const { a, b } of edges) {
    const result = step(session, { type: "JOIN", a, b });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return session;
    session = result.session;
  }

  return session;
}
