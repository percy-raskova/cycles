import { describe, expect, it } from "vitest";
import { type GamePageState, gamePageReducer, initialGamePageState } from "../gamePageReducer";

const SELECTING_SECOND: GamePageState = {
  ...initialGamePageState,
  phase: { kind: "SELECTING_SECOND_COIN", first: { row: 1, col: 1 } },
  hovered: { row: 2, col: 2 },
};

describe("gamePageReducer", () => {
  it("starts idle with everything cleared", () => {
    expect(initialGamePageState).toEqual({
      phase: { kind: "IDLE" },
      hovered: null,
      illegalMoveCoin: null,
      notice: null,
    });
  });

  it("HOVER sets the hovered position", () => {
    const next = gamePageReducer(initialGamePageState, {
      type: "HOVER",
      position: { row: 3, col: 4 },
    });
    expect(next.hovered).toEqual({ row: 3, col: 4 });
  });

  it("HOVER on the same cell returns state unchanged (reference equality)", () => {
    const seeded = gamePageReducer(initialGamePageState, {
      type: "HOVER",
      position: { row: 3, col: 4 },
    });
    const again = gamePageReducer(seeded, { type: "HOVER", position: { row: 3, col: 4 } });
    expect(again).toBe(seeded);
  });

  it("SELECT_INTERSECTION enters SELECTING_FACE with the position", () => {
    const next = gamePageReducer(initialGamePageState, {
      type: "SELECT_INTERSECTION",
      position: { row: 0, col: 0 },
    });
    expect(next.phase).toEqual({ kind: "SELECTING_FACE", position: { row: 0, col: 0 } });
  });

  it("BEGIN_JOIN enters SELECTING_SECOND_COIN with the first coin", () => {
    const next = gamePageReducer(initialGamePageState, {
      type: "BEGIN_JOIN",
      first: { row: 1, col: 1 },
    });
    expect(next.phase).toEqual({ kind: "SELECTING_SECOND_COIN", first: { row: 1, col: 1 } });
  });

  it("CANCEL_PHASE returns to IDLE", () => {
    const next = gamePageReducer(SELECTING_SECOND, { type: "CANCEL_PHASE" });
    expect(next.phase).toEqual({ kind: "IDLE" });
  });

  it("CANCEL_PHASE when already IDLE is a no-op (reference equality)", () => {
    const again = gamePageReducer(initialGamePageState, { type: "CANCEL_PHASE" });
    expect(again).toBe(initialGamePageState);
  });

  it("ILLEGAL_MOVE flags the coin WITHOUT leaving the join phase", () => {
    const next = gamePageReducer(SELECTING_SECOND, {
      type: "ILLEGAL_MOVE",
      position: { row: 2, col: 2 },
    });
    expect(next.illegalMoveCoin).toEqual({ row: 2, col: 2 });
    expect(next.phase).toEqual({ kind: "SELECTING_SECOND_COIN", first: { row: 1, col: 1 } });
  });

  it("CLEAR_ILLEGAL removes the flag", () => {
    const flagged: GamePageState = { ...initialGamePageState, illegalMoveCoin: { row: 2, col: 2 } };
    expect(gamePageReducer(flagged, { type: "CLEAR_ILLEGAL" }).illegalMoveCoin).toBeNull();
  });

  it("SET_NOTICE sets and clears the notice", () => {
    const set = gamePageReducer(initialGamePageState, { type: "SET_NOTICE", notice: "hi" });
    expect(set.notice).toBe("hi");
    expect(gamePageReducer(set, { type: "SET_NOTICE", notice: null }).notice).toBeNull();
  });

  it("RESET_UI clears phase/illegal/notice but PRESERVES hovered (rewind semantics)", () => {
    const messy: GamePageState = {
      phase: { kind: "SELECTING_FACE", position: { row: 0, col: 0 } },
      hovered: { row: 5, col: 5 },
      illegalMoveCoin: { row: 1, col: 1 },
      notice: "passing",
    };
    const next = gamePageReducer(messy, { type: "RESET_UI" });
    expect(next.phase).toEqual({ kind: "IDLE" });
    expect(next.illegalMoveCoin).toBeNull();
    expect(next.notice).toBeNull();
    expect(next.hovered).toEqual({ row: 5, col: 5 });
  });
});
