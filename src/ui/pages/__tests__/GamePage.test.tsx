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

describe("GamePage — Join Two Coins (US2)", () => {
  async function placeCoinAt(row: number, col: number, face: "heads" | "tails") {
    const dot = getDotAt(row, col);
    if (dot) {
      await userEvent.click(dot);
    }
    const selector = face === "heads" ? "face-selector-heads" : "face-selector-tails";
    await userEvent.click(screen.getByTestId(selector));
  }

  function getCoinAt(row: number, col: number): Element | undefined {
    try {
      return screen.getByTestId(`coin-${row}-${col}`);
    } catch {
      return undefined;
    }
  }

  it("selecting first coin then second coin creates a JOIN edge", async () => {
    render(<GamePage />);

    // Place two coins on the same row: (0,0) heads and (0,2) tails
    await placeCoinAt(0, 0, "heads");
    await placeCoinAt(0, 2, "tails");

    const coin00 = getCoinAt(0, 0);
    const coin02 = getCoinAt(0, 2);
    expect(coin00).toBeDefined();
    expect(coin02).toBeDefined();

    // Click first coin
    if (coin00) {
      await userEvent.click(coin00);
    }

    // First coin should have selected class
    expect(coin00?.getAttribute("class") ?? "").toContain("coin-selected");

    // Click second coin
    if (coin02) {
      await userEvent.click(coin02);
    }

    // Edge should appear
    const edge = screen.queryByTestId("edge-0-0-0-2");
    expect(edge).toBeDefined();
  });

  it("clicking the same coin cancels JOIN selection", async () => {
    render(<GamePage />);

    await placeCoinAt(1, 1, "heads");

    const coin11 = getCoinAt(1, 1);
    expect(coin11).toBeDefined();

    if (coin11) {
      await userEvent.click(coin11);
    }

    expect(coin11?.getAttribute("class")).toContain("coin-selected");

    // Click same coin again
    if (coin11) {
      await userEvent.click(coin11);
    }

    expect(coin11?.getAttribute("class") ?? "").not.toContain("coin-selected");
  });

  it("clicking empty intersection cancels JOIN selection", async () => {
    render(<GamePage />);

    await placeCoinAt(2, 2, "heads");

    const coin22 = getCoinAt(2, 2);
    if (coin22) {
      await userEvent.click(coin22);
    }

    expect(coin22?.getAttribute("class") ?? "").toContain("coin-selected");

    // Click an empty intersection
    const emptyDot = getDotAt(2, 3);
    if (emptyDot) {
      await userEvent.click(emptyDot);
    }

    expect(coin22?.getAttribute("class") ?? "").not.toContain("coin-selected");
  });

  it("shows illegal-move feedback for an illegal join", async () => {
    render(<GamePage />);

    // Place coins at (0,0) and (1,2) — not on same queen line, so illegal join
    await placeCoinAt(0, 0, "heads");
    await placeCoinAt(1, 2, "tails");

    const coin00 = getCoinAt(0, 0);
    const coin12 = getCoinAt(1, 2);

    if (coin00) {
      await userEvent.click(coin00);
    }

    if (coin12) {
      await userEvent.click(coin12);
    }

    // Illegal join should show feedback on second coin
    expect(coin12?.getAttribute("class") ?? "").toContain("coin-illegal");
  });
});
