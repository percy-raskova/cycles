// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GameOverPanel } from "../GameOverPanel";

describe("GameOverPanel", () => {
  it("renders final score and winner", () => {
    const onNewGame = vi.fn();
    render(<GameOverPanel score={{ heads: 7, tails: 5, winner: "HEADS" }} onNewGame={onNewGame} />);

    expect(screen.getByTestId("game-over-panel")).toBeDefined();
    expect(screen.getByTestId("game-over-heads").textContent).toContain("7");
    expect(screen.getByTestId("game-over-tails").textContent).toContain("5");
    expect(screen.getByTestId("game-over-winner").textContent).toContain("HEADS wins!");
  });

  it("renders draw when winner is draw", () => {
    const onNewGame = vi.fn();
    render(<GameOverPanel score={{ heads: 6, tails: 6, winner: "draw" }} onNewGame={onNewGame} />);

    expect(screen.getByTestId("game-over-winner").textContent).toContain("draw");
  });

  it("uses a native <dialog> element for semantic accessibility", () => {
    const onNewGame = vi.fn();
    const { container } = render(
      <GameOverPanel score={{ heads: 7, tails: 5, winner: "HEADS" }} onNewGame={onNewGame} />,
    );

    const dialog = container.querySelector("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog?.classList.contains("panel")).toBe(true);
  });

  it("applies Win95 chrome classes to the panel", () => {
    const onNewGame = vi.fn();
    const { container } = render(
      <GameOverPanel score={{ heads: 7, tails: 5, winner: "HEADS" }} onNewGame={onNewGame} />,
    );

    expect(container.querySelector(".game-over")).toBeTruthy();
    expect(container.querySelector(".gobar")).toBeTruthy();
    expect(container.querySelector(".gobody")).toBeTruthy();
    expect(container.querySelector(".winner")).toBeTruthy();
    expect(container.querySelector(".actions")).toBeTruthy();
  });

  it("calls onNewGame when New Game button is clicked", async () => {
    const onNewGame = vi.fn();
    render(<GameOverPanel score={{ heads: 7, tails: 5, winner: "HEADS" }} onNewGame={onNewGame} />);

    await userEvent.click(screen.getByTestId("game-over-new-game"));
    expect(onNewGame).toHaveBeenCalled();
  });
});
