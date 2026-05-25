import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  deserializeSession,
  deserializeState,
  serializeSession,
  serializeState,
} from "../../serialization";
import { createSession, step } from "../../session";
import type { GameSession } from "../../session";
import { createInitialState, placeCoin } from "../../state";

/** Drive a session through a sequence of PLACE moves to reach a non-trivial state. */
function sessionFromMoves(positions: ReadonlyArray<[number, number]>): GameSession {
  let session = createSession({ firstPlayer: "HEADS" });
  for (const [row, col] of positions) {
    const result = step(session, { type: "PLACE", position: { row, col }, face: "heads" });
    if (result.kind === "ok") session = result.session;
  }
  return session;
}

const movesArb = fc.array(
  fc.tuple(fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 })),
  { maxLength: 12 },
);

describe("serialization — state", () => {
  it("round-trips the genesis state losslessly", () => {
    const state = createInitialState("HEADS");
    const restored = deserializeState(serializeState(state));
    expect(restored).toEqual(state);
  });

  it("round-trips a mid-game state (coins + edges) losslessly", () => {
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 1, col: 1 }, "tails");
    const restored = deserializeState(serializeState(state));
    expect(restored).toEqual(state);
    expect(restored?.coins).toBeInstanceOf(Map);
  });

  it("produces JSON with no Map artifacts (coins is an array of entries)", () => {
    let state = createInitialState("HEADS");
    state = placeCoin(state, { row: 2, col: 3 }, "heads");
    const parsed = JSON.parse(serializeState(state));
    expect(Array.isArray(parsed.coins)).toBe(true);
  });

  it("returns null on malformed JSON", () => {
    expect(deserializeState("{not json")).toBeNull();
  });

  it("any reachable state round-trips losslessly (property)", () => {
    fc.assert(
      fc.property(movesArb, (positions) => {
        const state = sessionFromMoves(positions).state;
        const restored = deserializeState(serializeState(state));
        expect(restored).toEqual(state);
      }),
    );
  });
});

describe("serialization — session", () => {
  it("round-trips a session (state + history + terminal/winner) losslessly", () => {
    const session = sessionFromMoves([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
    const restored = deserializeSession(serializeSession(session));
    expect(restored).toEqual(session);
    expect(restored?.state.coins).toBeInstanceOf(Map);
  });

  it("returns null on malformed JSON", () => {
    expect(deserializeSession("nope")).toBeNull();
  });

  it("any reachable session round-trips losslessly (property)", () => {
    fc.assert(
      fc.property(movesArb, (positions) => {
        const session = sessionFromMoves(positions);
        const restored = deserializeSession(serializeSession(session));
        expect(restored).toEqual(session);
      }),
    );
  });
});
