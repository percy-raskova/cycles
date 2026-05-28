// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  makeBlockedBoardState,
  makeFullBoardNoEdgesState,
  makeJoinablePairState,
} from "./helpers/fixtures";
import { renderGame } from "./helpers/render-game";
import { getCoinAt, getDotAt, getFaceSelector, placeCoinAt } from "./helpers/selectors";

describe("Move Validation (US2)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects placing a coin on an occupied intersection", async () => {
    const state = makeJoinablePairState();
    const { user } = renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    const playerBefore = screen.getByTestId("turn-indicator-player").textContent;

    // Try to place on occupied (0,0)
    const dot = getDotAt(0, 0);
    await user.click(dot);

    // Face selector should not appear for occupied intersection
    expect(getFaceSelector(0, 0)).toBeNull();

    // Player should not have switched
    expect(screen.getByTestId("turn-indicator-player").textContent).toBe(playerBefore);
  });

  it("rejects joining coins not on a queen line and shows illegal feedback", async () => {
    const { user } = renderGame();

    // Place two coins not on a queen line: (0,0) and (1,2)
    await placeCoinAt(user, 0, 0, "heads");
    await placeCoinAt(user, 1, 2, "tails");

    const coin00 = getCoinAt(0, 0);
    const coin12 = getCoinAt(1, 2);

    await user.click(coin00);
    await user.click(coin12);

    // Illegal feedback should be on second coin
    expect(coin12.classList.contains("coin-illegal")).toBe(true);

    // No edge should be created
    expect(screen.queryByTestId("edge-0-0-1-2")).toBeNull();
    expect(screen.queryByTestId("edge-1-2-0-0")).toBeNull();
  });

  it("does not auto-pass when legal moves exist", async () => {
    vi.useFakeTimers();
    const state = makeJoinablePairState();
    renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    const playerBefore = screen.getByTestId("turn-indicator-player").textContent;

    // Advance timers well past auto-pass delay
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // No notice should appear
    expect(screen.queryByTestId("turn-indicator-notice")).toBeNull();

    // Player should not have changed
    expect(screen.getByTestId("turn-indicator-player").textContent).toBe(playerBefore);
  });

  it("auto-passes when no legal moves exist and reaches terminal after two passes", async () => {
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

    // Notice should be visible immediately
    expect(screen.getByTestId("turn-indicator-notice")).toBeDefined();
    expect(screen.getByTestId("turn-indicator-notice").textContent).toContain("passing");

    // Advance past first auto-pass delay — player switches, new notice appears
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.getByTestId("turn-indicator-player").textContent).not.toBe(playerBefore);
    expect(screen.getByTestId("turn-indicator-notice")).toBeDefined();

    // Advance past second auto-pass delay — game reaches terminal
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.queryByTestId("turn-indicator")).toBeNull();
    expect(screen.getByTestId("game-over-panel")).toBeDefined();
  });

  it("rejects placing a coin when all 12 coins are already placed", async () => {
    const state = makeFullBoardNoEdgesState();
    const { user } = renderGame({
      initialSession: {
        state,
        history: [],
        isTerminal: false,
        winner: null,
      },
    });

    const board = screen.getByTestId("board-view");
    const coinCountBefore = board.querySelectorAll('[data-testid^="coin-"]').length;
    expect(coinCountBefore).toBe(12);

    const playerBefore = screen.getByTestId("turn-indicator-player").textContent;

    // Click an empty intersection (5,5 is empty in row-major fill)
    const dot = getDotAt(5, 5);
    await user.click(dot);

    // Face selector appears (UI doesn't know board is full)
    expect(getFaceSelector(5, 5)).not.toBeNull();

    await user.click(screen.getByTestId("face-selector-heads"));

    // Face selector should close
    expect(getFaceSelector(5, 5)).toBeNull();

    // No new coin should appear
    const coinCountAfter = board.querySelectorAll('[data-testid^="coin-"]').length;
    expect(coinCountAfter).toBe(12);

    // Player should not have switched
    expect(screen.getByTestId("turn-indicator-player").textContent).toBe(playerBefore);
  });

  it("pressing Escape cancels the face selector", async () => {
    const { user } = renderGame();

    const dot = getDotAt(2, 2);
    await user.click(dot);

    expect(getFaceSelector(2, 2)).not.toBeNull();

    await user.keyboard("{Escape}");

    expect(getFaceSelector(2, 2)).toBeNull();
  });
});
