// @vitest-environment jsdom
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeBlockedBoardState } from "./helpers/fixtures";
import { renderGame } from "./helpers/render-game";

describe("New Game Reset (US6)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resets all state after terminal state + New Game click", () => {
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
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("game-over-panel")).toBeDefined();

    // Click New Game (use fireEvent because fake timers are active)
    fireEvent.click(screen.getByTestId("game-over-new-game"));

    // GameOverPanel gone
    expect(screen.queryByTestId("game-over-panel")).toBeNull();

    // TurnIndicator visible with 12 coins
    expect(screen.getByTestId("turn-indicator-remaining").textContent).toBe("12 coins remain");

    // Board empty
    const board = screen.getByTestId("board-view");
    expect(board.querySelectorAll('[data-testid^="coin-"]').length).toBe(0);

    // No move phase active
    expect(screen.queryByTestId("face-selector-backdrop")).toBeNull();
  });
});
