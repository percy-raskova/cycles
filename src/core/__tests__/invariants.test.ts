import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createSession, step, undo } from "../session";
import type { GameSession } from "../session";
import { createInitialState, placeCoin } from "../state";

describe("property-based invariants", () => {
  it("coin count never exceeds 12", () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 })), {
          maxLength: 20,
        }),
        (positions) => {
          let game = createInitialState();
          for (const [row, col] of positions) {
            if (game.coinsRemaining <= 0) break;
            const key = `${row},${col}`;
            if (game.coins.has(key)) continue;
            game = placeCoin(game, { row, col }, "heads");
          }
          return game.coins.size <= 12;
        },
      ),
    );
  });

  it("coinsRemaining + placedCoins always equals 12", () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 })), {
          maxLength: 20,
        }),
        (positions) => {
          let game = createInitialState();
          for (const [row, col] of positions) {
            if (game.coinsRemaining <= 0) break;
            const key = `${row},${col}`;
            if (game.coins.has(key)) continue;
            game = placeCoin(game, { row, col }, "heads");
          }
          return game.coins.size + game.coinsRemaining === 12;
        },
      ),
    );
  });

  it("undo returns a new object reference and does not mutate the input session", () => {
    function runMoves(positions: Array<[number, number]>) {
      let session = createSession({ firstPlayer: "HEADS" });
      for (const [row, col] of positions) {
        const result = step(session, { type: "PLACE", position: { row, col }, face: "heads" });
        if (result.kind !== "ok") continue;
        session = result.session;
      }
      return session;
    }

    function verifyImmutability(session: GameSession) {
      if (session.history.length === 0) return true;

      const beforeState = session.state;
      const beforeHistory = session.history;
      const undone = undo(session);

      const newReference = undone !== session && undone.state !== beforeState;
      const notMutated =
        session.state === beforeState &&
        session.history === beforeHistory &&
        session.history.length === beforeHistory.length;

      return newReference && notMutated;
    }

    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 })), {
          maxLength: 15,
        }),
        (positions) => verifyImmutability(runMoves(positions)),
      ),
    );
  });
});
