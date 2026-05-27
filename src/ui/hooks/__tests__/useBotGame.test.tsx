import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBotGame } from "../useBotGame";

describe("useBotGame", () => {
  it("auto-invokes Random bot on bot's turn with delayMs=0 (T013)", async () => {
    const { result } = renderHook(() =>
      useBotGame({
        opponent: "random",
        playerRole: "HEADS",
        humanFirst: false,
        botDelayMs: 0,
      }),
    );

    // HEADS is the human, TAILS is the bot.
    // humanFirst=false means bot (TAILS) goes first.
    // Note: bot move fires synchronously with delayMs=0.

    await waitFor(() => {
      // After bot move, current player should be HEADS (human's turn)
      expect(result.current.session.state.currentPlayer).toBe("HEADS");
    });

    // Bot should have made a move (either PLACE or JOIN)
    expect(result.current.session.history.length).toBeGreaterThan(0);
  });

  it("does not auto-invoke when opponent is human", () => {
    const { result } = renderHook(() =>
      useBotGame({
        opponent: "human",
        playerRole: "HEADS",
        humanFirst: true,
        botDelayMs: 0,
      }),
    );

    const initialHistoryLength = result.current.session.history.length;
    expect(initialHistoryLength).toBe(0);

    // No timers needed for human opponent; just ensure history stays 0
    expect(result.current.session.history.length).toBe(0);
  });

  it("respects playerRole assignment", async () => {
    const { result } = renderHook(() =>
      useBotGame({
        opponent: "random",
        playerRole: "TAILS",
        humanFirst: true,
        botDelayMs: 0,
      }),
    );

    // TAILS is the human, HEADS is the bot.
    // humanFirst=true means human (TAILS) moves first.
    expect(result.current.session.state.currentPlayer).toBe("TAILS");
    expect(result.current.session.history.length).toBe(0);

    // Human makes a move
    act(() => {
      result.current.applyMove({
        type: "PLACE",
        position: { row: 0, col: 0 },
        face: "tails",
      });
    });

    // Now it's HEADS (bot) turn
    await waitFor(() => {
      expect(result.current.session.state.currentPlayer).toBe("TAILS");
    });

    expect(result.current.session.history.length).toBeGreaterThan(1);
  });

  it("auto-invokes Strategic bot on bot's turn (T023)", async () => {
    const { result } = renderHook(() =>
      useBotGame({
        opponent: "strategic",
        playerRole: "HEADS",
        humanFirst: false,
        botDelayMs: 0,
      }),
    );

    // Bot (TAILS) goes first.
    await waitFor(() => {
      expect(result.current.session.state.currentPlayer).toBe("HEADS");
    });

    expect(result.current.session.history.length).toBeGreaterThan(0);
  });
});
