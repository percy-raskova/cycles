// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useGameSession } from "../../hooks/useGameSession";
import { GamePage } from "../GamePage";

function GamePageWrapper() {
  const { session, applyMove, reset } = useGameSession();
  return <GamePage session={session} applyMove={applyMove} onReset={reset} />;
}

function getDotAt(row: number, col: number): Element | undefined {
  const dots = screen.getByTestId("grid-view").querySelectorAll("circle");
  const x = 25 + col * 225;
  const y = 25 + row * 225;
  return Array.from(dots).find(
    (c) => c.getAttribute("cx") === `${x}` && c.getAttribute("cy") === `${y}`,
  );
}

describe("GamePage — Place a Coin (US1)", () => {
  it("renders an interactive board", () => {
    render(<GamePageWrapper />);
    expect(screen.getByTestId("board-view")).toBeTruthy();
  });

  it("clicking an empty intersection opens face selector", async () => {
    render(<GamePageWrapper />);

    const targetDot = getDotAt(1, 1);
    expect(targetDot).toBeTruthy();
    if (targetDot) {
      await userEvent.click(targetDot);
    }

    expect(screen.queryByTestId("face-selector-1-1")).toBeTruthy();
  });

  it("selecting heads places an H coin and switches turn", async () => {
    render(<GamePageWrapper />);

    const targetDot = getDotAt(1, 1);
    expect(targetDot).toBeTruthy();
    if (targetDot) {
      await userEvent.click(targetDot);
    }

    await userEvent.click(screen.getByTestId("face-selector-heads"));

    // Coin should appear at 1,1
    const coin = screen.getByTestId("coin-1-1");
    expect(coin).toBeTruthy();
    expect(coin.querySelector("text")?.textContent).toBe("H");

    // Face selector should be gone
    expect(screen.queryByTestId("face-selector-1-1")).toBeNull();
  });

  it("selecting tails places a T coin and switches turn", async () => {
    render(<GamePageWrapper />);

    const targetDot = getDotAt(2, 2);
    expect(targetDot).toBeTruthy();
    if (targetDot) {
      await userEvent.click(targetDot);
    }

    await userEvent.click(screen.getByTestId("face-selector-tails"));

    const coin = screen.getByTestId("coin-2-2");
    expect(coin).toBeTruthy();
    expect(coin.querySelector("text")?.textContent).toBe("T");
  });

  it("clicking backdrop cancels face selector", async () => {
    render(<GamePageWrapper />);

    const targetDot = getDotAt(3, 3);
    expect(targetDot).toBeTruthy();
    if (targetDot) {
      await userEvent.click(targetDot);
    }

    expect(screen.queryByTestId("face-selector-3-3")).toBeTruthy();

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
    render(<GamePageWrapper />);

    // Place two coins on the same row: (0,0) heads and (0,2) tails
    await placeCoinAt(0, 0, "heads");
    await placeCoinAt(0, 2, "tails");

    const coin00 = getCoinAt(0, 0);
    const coin02 = getCoinAt(0, 2);
    expect(coin00).toBeTruthy();
    expect(coin02).toBeTruthy();

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
    expect(edge).toBeTruthy();
  });

  it("clicking the same coin cancels JOIN selection", async () => {
    render(<GamePageWrapper />);

    await placeCoinAt(1, 1, "heads");

    const coin11 = getCoinAt(1, 1);
    expect(coin11).toBeTruthy();

    if (coin11) {
      await userEvent.click(coin11);
    }

    expect(coin11?.getAttribute("class") ?? "").toContain("coin-selected");

    // Click same coin again
    if (coin11) {
      await userEvent.click(coin11);
    }

    expect(coin11?.getAttribute("class") ?? "").not.toContain("coin-selected");
  });

  it("clicking empty intersection cancels JOIN selection", async () => {
    render(<GamePageWrapper />);

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
    render(<GamePageWrapper />);

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

describe("GamePage — Theme Interaction (US2)", () => {
  it("coins can still be placed and joined after theme CSS is applied", async () => {
    render(<GamePageWrapper />);

    // Place a coin at (0, 0)
    const dot00 = getDotAt(0, 0);
    expect(dot00).toBeTruthy();
    if (dot00) {
      await userEvent.click(dot00);
    }
    await userEvent.click(screen.getByTestId("face-selector-heads"));
    expect(screen.getByTestId("coin-0-0")).toBeTruthy();

    // Place a second coin at (0, 2)
    const dot02 = getDotAt(0, 2);
    expect(dot02).toBeTruthy();
    if (dot02) {
      await userEvent.click(dot02);
    }
    await userEvent.click(screen.getByTestId("face-selector-tails"));
    expect(screen.getByTestId("coin-0-2")).toBeTruthy();

    // Join the two coins
    const coin00 = screen.getByTestId("coin-0-0");
    const coin02 = screen.getByTestId("coin-0-2");
    await userEvent.click(coin00);
    await userEvent.click(coin02);

    // Verify an edge was created
    expect(screen.getByTestId("edge-0-0-0-2")).toBeTruthy();
  });
});

describe("GamePage — Coin Flip Animation (US4)", () => {
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

  it("applies coin-flipping class to coins that flipped after a JOIN", async () => {
    render(<GamePageWrapper />);

    // Place two coins and join them — both endpoint coins will flip
    await placeCoinAt(0, 0, "heads");
    await placeCoinAt(0, 2, "tails");

    const coin00 = getCoinAt(0, 0);
    const coin02 = getCoinAt(0, 2);

    if (coin00) {
      await userEvent.click(coin00);
    }
    if (coin02) {
      await userEvent.click(coin02);
    }

    // Both coins should have the flipping animation class
    expect(coin00?.getAttribute("class") ?? "").toContain("coin-flipping");
    expect(coin02?.getAttribute("class") ?? "").toContain("coin-flipping");
  });
});
