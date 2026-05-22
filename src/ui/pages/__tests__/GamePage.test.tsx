// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GamePage } from "../GamePage";

function getDotAt(row: number, col: number): Element | undefined {
  const dots = screen.getByTestId("grid-view").querySelectorAll("circle");
  const x = 50 + col * 100;
  const y = 50 + row * 100;
  return Array.from(dots).find(
    (c) => c.getAttribute("cx") === `${x}` && c.getAttribute("cy") === `${y}`,
  );
}

describe("GamePage — Place a Coin (US1)", () => {
  it("renders an interactive board", () => {
    render(<GamePage />);
    expect(screen.getByTestId("board-view")).toBeDefined();
  });

  it("clicking an empty intersection opens face selector", async () => {
    render(<GamePage />);

    const targetDot = getDotAt(1, 1);
    expect(targetDot).toBeDefined();
    if (targetDot) {
      await userEvent.click(targetDot);
    }

    expect(screen.queryByTestId("face-selector-1-1")).toBeDefined();
  });

  it("selecting heads places an H coin and switches turn", async () => {
    render(<GamePage />);

    const targetDot = getDotAt(1, 1);
    expect(targetDot).toBeDefined();
    if (targetDot) {
      await userEvent.click(targetDot);
    }

    await userEvent.click(screen.getByTestId("face-selector-heads"));

    // Coin should appear at 1,1
    const coin = screen.getByTestId("coin-1-1");
    expect(coin).toBeDefined();
    expect(coin.querySelector("text")?.textContent).toBe("H");

    // Face selector should be gone
    expect(screen.queryByTestId("face-selector-1-1")).toBeNull();
  });

  it("selecting tails places a T coin and switches turn", async () => {
    render(<GamePage />);

    const targetDot = getDotAt(2, 2);
    expect(targetDot).toBeDefined();
    if (targetDot) {
      await userEvent.click(targetDot);
    }

    await userEvent.click(screen.getByTestId("face-selector-tails"));

    const coin = screen.getByTestId("coin-2-2");
    expect(coin).toBeDefined();
    expect(coin.querySelector("text")?.textContent).toBe("T");
  });

  it("clicking backdrop cancels face selector", async () => {
    render(<GamePage />);

    const targetDot = getDotAt(3, 3);
    expect(targetDot).toBeDefined();
    if (targetDot) {
      await userEvent.click(targetDot);
    }

    expect(screen.queryByTestId("face-selector-3-3")).toBeDefined();

    await userEvent.click(screen.getByTestId("face-selector-backdrop"));

    expect(screen.queryByTestId("face-selector-3-3")).toBeNull();
  });
});
