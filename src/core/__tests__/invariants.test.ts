import fc from "fast-check";
import { describe, expect, it } from "vitest";
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
});
