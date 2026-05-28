// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeBlockedBoardState, makeOneLegalMoveState } from "./helpers/fixtures";
import { renderGame } from "./helpers/render-game";

describe("Auto-Pass (US4)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("displays a notice when no legal moves exist", async () => {
    vi.useFakeTimers();
    const state = makeBlockedBoardState();
    renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    expect(screen.getByTestId("turn-indicator-notice")).toBeDefined();
    expect(screen.getByTestId("turn-indicator-notice").textContent).toContain("passing");
  });

  it("switches turn after auto-pass delay and reaches terminal after second pass", async () => {
    vi.useFakeTimers();
    const state = makeBlockedBoardState();
    renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    const playerBefore = screen.getByTestId("turn-indicator-player").textContent;

    // First auto-pass: player switches, notice updates for new player
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.getByTestId("turn-indicator-player").textContent).not.toBe(playerBefore);
    expect(screen.getByTestId("turn-indicator-notice")).toBeDefined();

    // Second auto-pass: game reaches terminal state
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.queryByTestId("turn-indicator")).toBeNull();
    expect(screen.getByTestId("game-over-panel")).toBeDefined();
  });

  it("does not auto-pass when in terminal state", async () => {
    vi.useFakeTimers();
    const state = makeBlockedBoardState();
    // Construct a terminal session manually
    const terminalSession = {
      state: {
        ...state,
        passCount: 2,
        currentPlayer: state.currentPlayer === "HEADS" ? "TAILS" : "HEADS",
      },
      history: [],
      isTerminal: true,
      winner: "draw" as const,
    };

    renderGame({ initialSession: terminalSession });

    // GameOverPanel should be visible
    expect(screen.getByTestId("game-over-panel")).toBeDefined();

    // TurnIndicator should be hidden
    expect(screen.queryByTestId("turn-indicator")).toBeNull();

    // No notice should appear even after timer advance
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByTestId("turn-indicator-notice")).toBeNull();
  });

  it("does not auto-pass when exactly one legal move remains", async () => {
    vi.useFakeTimers();
    const state = makeOneLegalMoveState();
    renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    // No notice should appear because there is 1 legal move
    expect(screen.queryByTestId("turn-indicator-notice")).toBeNull();

    // Advance well past auto-pass delay
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Still no auto-pass
    expect(screen.queryByTestId("turn-indicator-notice")).toBeNull();
  });
});
