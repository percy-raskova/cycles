import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBotGame } from "../useBotGame";

describe("useBotGame (driver-backed)", () => {
  it("auto-plays the Random bot on its turn (T013)", async () => {
    const { result } = renderHook(() =>
      useBotGame({ opponent: "random", playerRole: "HEADS", humanFirst: false, botDelayMs: 0 }),
    );

    // Human is HEADS; bot (TAILS) moves first, then it becomes the human's turn.
    await waitFor(() => {
      expect(result.current.session.state.currentPlayer).toBe("HEADS");
    });
    expect(result.current.session.history.length).toBeGreaterThan(0);
  });

  it("does not move when the opponent is human (hot-seat waits for input)", async () => {
    const { result } = renderHook(() =>
      useBotGame({ opponent: "human", playerRole: "HEADS", humanFirst: true, botDelayMs: 0 }),
    );

    await act(async () => {}); // let the mount effect + driver start settle
    expect(result.current.session.history.length).toBe(0);
  });

  it("routes submitMove to the current player, then the bot replies (T013)", async () => {
    const { result } = renderHook(() =>
      useBotGame({ opponent: "random", playerRole: "TAILS", humanFirst: true, botDelayMs: 0 }),
    );

    // Human is TAILS and moves first.
    expect(result.current.session.state.currentPlayer).toBe("TAILS");
    expect(result.current.session.history.length).toBe(0);

    await act(async () => {
      result.current.submitMove({ type: "PLACE", position: { row: 0, col: 0 }, face: "tails" });
    });

    // After the human move, the bot (HEADS) replies and it becomes TAILS again.
    await waitFor(() => {
      expect(result.current.session.state.currentPlayer).toBe("TAILS");
    });
    expect(result.current.session.history.length).toBeGreaterThan(1);
  });

  it("auto-plays the Strategic bot on its turn (T023)", async () => {
    const { result } = renderHook(() =>
      useBotGame({ opponent: "strategic", playerRole: "HEADS", humanFirst: false, botDelayMs: 0 }),
    );

    await waitFor(() => {
      expect(result.current.session.state.currentPlayer).toBe("HEADS");
    });
    expect(result.current.session.history.length).toBeGreaterThan(0);
  });
});
