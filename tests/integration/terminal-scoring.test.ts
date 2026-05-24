// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeBlockedBoardState } from "./helpers/fixtures";
import { renderGame } from "./helpers/render-game";

describe("Terminal Scoring", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows correct scores in GameOverPanel after terminal state", async () => {
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

    // Auto-pass twice to reach terminal
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("game-over-panel")).toBeDefined();
    expect(screen.getByTestId("game-over-heads").textContent).toContain("6");
    expect(screen.getByTestId("game-over-tails").textContent).toContain("6");
  });

  it("detects a draw", async () => {
    const state = makeBlockedBoardState(); // 6 heads, 6 tails
    renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: true,
        winner: "draw",
      },
    });

    expect(screen.getByTestId("game-over-panel")).toBeDefined();
    expect(screen.getByTestId("game-over-winner").textContent).toBe("It's a draw!");
  });
});
