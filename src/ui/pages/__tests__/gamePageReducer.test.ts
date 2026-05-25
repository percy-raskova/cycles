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
      animation: null,
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

  it("MOVE_RESOLVED with flips goes IDLE and starts an animation", () => {
    const flipped = new Set(["0,0", "1,1"]);
    const next = gamePageReducer(SELECTING_SECOND, { type: "MOVE_RESOLVED", flipped });
    expect(next.phase).toEqual({ kind: "IDLE" });
    expect(next.animation).toEqual({ flipping: flipped });
  });

  it("MOVE_RESOLVED with no flips goes IDLE with no animation", () => {
    const next = gamePageReducer(SELECTING_SECOND, { type: "MOVE_RESOLVED", flipped: new Set() });
    expect(next.phase).toEqual({ kind: "IDLE" });
    expect(next.animation).toBeNull();
  });

  it("ANIMATION_END clears the animation", () => {
    const animating: GamePageState = {
      ...initialGamePageState,
      animation: { flipping: new Set(["0,0"]) },
    };
    expect(gamePageReducer(animating, { type: "ANIMATION_END" }).animation).toBeNull();
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

  it("RESET_UI clears phase/illegal/animation/notice but PRESERVES hovered (rewind semantics)", () => {
    const messy: GamePageState = {
      phase: { kind: "SELECTING_FACE", position: { row: 0, col: 0 } },
      hovered: { row: 5, col: 5 },
      illegalMoveCoin: { row: 1, col: 1 },
      animation: { flipping: new Set(["0,0"]) },
      notice: "passing",
    };
    const next = gamePageReducer(messy, { type: "RESET_UI" });
    expect(next.phase).toEqual({ kind: "IDLE" });
    expect(next.illegalMoveCoin).toBeNull();
    expect(next.animation).toBeNull();
    expect(next.notice).toBeNull();
    expect(next.hovered).toEqual({ row: 5, col: 5 });
  });
});
