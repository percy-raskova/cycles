// @vitest-environment jsdom
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeBlockedBoardState } from "./helpers/fixtures";
import { renderGame } from "./helpers/render-game";

describe("Game Flow (US1)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("a blocked board reaches terminal state via auto-pass", async () => {
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

    // First auto-pass after 1s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Second auto-pass after another 1s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    // Terminal state reached
    expect(screen.getByTestId("game-over-panel")).toBeDefined();

    // Score is a draw (6 heads, 6 tails in blocked board)
    expect(screen.getByTestId("game-over-heads").textContent).toContain("6");
    expect(screen.getByTestId("game-over-tails").textContent).toContain("6");
    expect(screen.getByTestId("game-over-winner").textContent).toBe("It's a draw!");
  });

  it("New Game button resets to initial state", async () => {
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

    // Reach terminal state via two auto-passes (1s each)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.getByTestId("game-over-panel")).toBeDefined();

    // Click New Game (use fireEvent because fake timers are active)
    fireEvent.click(screen.getByTestId("game-over-new-game"));

    // GameOverPanel should be gone
    expect(screen.queryByTestId("game-over-panel")).toBeNull();

    // TurnIndicator should show 12 coins remain
    expect(screen.getByTestId("turn-indicator-remaining").textContent).toBe("12 coins remain");

    // Board should be empty
    const board = screen.getByTestId("board-view");
    expect(board.querySelectorAll('[data-testid^="coin-"]').length).toBe(0);

    // No face selector active
    expect(screen.queryByTestId("face-selector-backdrop")).toBeNull();
  });
});
