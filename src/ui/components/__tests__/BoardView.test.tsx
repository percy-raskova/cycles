// @vitest-environment jsdom
import { createInitialState, placeCoin } from "@core";
import type { GameState } from "@core/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BoardView } from "../BoardView";

function renderBoardView(state: GameState) {
  return render(
    <BoardView
      state={state}
      selectedCoin={null}
      hoveredPosition={null}
      previewEdge={null}
      legalPlacements={new Set()}
      flippingCoins={new Set()}
      illegalMoveCoin={null}
      highlightedCoins={new Set()}
    />,
  );
}

function makeMaxDensityState() {
  let state = createInitialState();
  // Place all 12 coins (TOTAL_COINS)
  const positions: Array<{ row: number; col: number }> = [];
  let face: "heads" | "tails" = "heads";
  for (let i = 0; i < 12; i++) {
    const row = Math.floor(i / 7);
    const col = i % 7;
    state = placeCoin(state, { row, col }, face);
    positions.push({ row, col });
    face = face === "heads" ? "tails" : "heads";
  }
  // Add many edges between placed coins
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const from = positions[i];
      const to = positions[j];
      if (from !== undefined && to !== undefined) {
        state = {
          ...state,
          edges: [...state.edges, { from, to }],
        };
      }
    }
  }
  return state;
}

describe("BoardView — empty state", () => {
  it("renders an SVG with the correct viewBox", () => {
    const state = createInitialState();
    renderBoardView(state);

    const svg = screen.getByTestId("board-view");
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.getAttribute("viewBox")).toBe("0 0 800 800");
  });

  it("renders GridView but no CoinView or EdgeView elements for empty state", () => {
    const state = createInitialState();
    renderBoardView(state);

    const grid = screen.getByTestId("grid-view");
    expect(grid).toBeDefined();

    const svg = screen.getByTestId("board-view");
    const circles = svg.querySelectorAll("circle");
    const coinCircles = Array.from(circles).filter(
      (c) => c.getAttribute("r") !== "3", // exclude grid dots
    );
    expect(coinCircles.length).toBe(0);

    const lines = svg.querySelectorAll("line");
    const gridLines = Array.from(lines).filter(
      (l) => l.getAttribute("stroke") === "var(--color-lavender)",
    );
    expect(gridLines.length).toBe(14);

    const edgeLines = Array.from(lines).filter(
      (l) => l.getAttribute("stroke") === "var(--color-magenta)",
    );
    expect(edgeLines.length).toBe(0);
  });
});

describe("BoardView — with coins", () => {
  it("renders the correct count of CoinView elements", () => {
    let state = createInitialState();
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 1, col: 1 }, "tails");
    state = placeCoin(state, { row: 2, col: 2 }, "heads");

    renderBoardView(state);

    const coin0 = screen.getByTestId("coin-0-0");
    const coin1 = screen.getByTestId("coin-1-1");
    const coin2 = screen.getByTestId("coin-2-2");
    expect(coin0).toBeDefined();
    expect(coin1).toBeDefined();
    expect(coin2).toBeDefined();

    // Verify labels
    expect(coin0.querySelector("text")?.textContent).toBe("H");
    expect(coin1.querySelector("text")?.textContent).toBe("T");
    expect(coin2.querySelector("text")?.textContent).toBe("H");
  });

  it("removes a coin on re-render without phantom elements", () => {
    let stateWithCoin = createInitialState();
    stateWithCoin = placeCoin(stateWithCoin, { row: 0, col: 0 }, "heads");

    const { rerender } = renderBoardView(stateWithCoin);
    expect(screen.getByTestId("coin-0-0")).toBeDefined();

    const stateWithoutCoin = createInitialState();
    rerender(
      <BoardView
        state={stateWithoutCoin}
        selectedCoin={null}
        hoveredPosition={null}
        previewEdge={null}
        legalPlacements={new Set()}
        flippingCoins={new Set()}
        illegalMoveCoin={null}
        highlightedCoins={new Set()}
      />,
    );

    expect(screen.queryByTestId("coin-0-0")).toBeNull();

    const svg = screen.getByTestId("board-view");
    const coinCircles = Array.from(svg.querySelectorAll("circle")).filter(
      (c) => c.getAttribute("r") !== "3",
    );
    expect(coinCircles.length).toBe(0);
  });
});

describe("BoardView — with edges", () => {
  it("renders edges below coins in z-order (DOM order)", () => {
    let state = createInitialState();
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 0, col: 1 }, "tails");
    state = {
      ...state,
      edges: [{ from: { row: 0, col: 0 }, to: { row: 0, col: 1 } }],
    };

    renderBoardView(state);

    const svg = screen.getByTestId("board-view");
    const children = Array.from(svg.children);

    // GridView should be present and come before edges and coins
    const gridIndex = children.findIndex((el) => el.getAttribute("data-testid") === "grid-view");
    expect(gridIndex).toBeGreaterThan(-1);

    // Edge should come before coin in DOM order (z-order: grid < edges < coins)
    const edgeIndex = children.findIndex((el) => el.getAttribute("data-testid") === "edge-0-0-0-1");
    const coinIndex = children.findIndex((el) => el.getAttribute("data-testid") === "coin-0-0");
    expect(edgeIndex).toBeGreaterThan(-1);
    expect(coinIndex).toBeGreaterThan(-1);
    expect(edgeIndex).toBeLessThan(coinIndex);
  });

  it("renders crossing edges without structural omission", () => {
    let state = createInitialState();
    state = placeCoin(state, { row: 0, col: 0 }, "heads");
    state = placeCoin(state, { row: 6, col: 6 }, "tails");
    state = placeCoin(state, { row: 0, col: 6 }, "heads");
    state = placeCoin(state, { row: 6, col: 0 }, "tails");
    state = {
      ...state,
      edges: [
        { from: { row: 0, col: 0 }, to: { row: 6, col: 6 } },
        { from: { row: 0, col: 6 }, to: { row: 6, col: 0 } },
      ],
    };

    renderBoardView(state);

    const edge1 = screen.getByTestId("edge-0-0-6-6");
    const edge2 = screen.getByTestId("edge-0-6-6-0");
    expect(edge1).toBeDefined();
    expect(edge2).toBeDefined();

    // Both edges should have the correct magenta stroke
    expect(edge1.getAttribute("stroke")).toBe("var(--color-magenta)");
    expect(edge2.getAttribute("stroke")).toBe("var(--color-magenta)");
  });
});

describe("BoardView — preview edge", () => {
  it("renders preview line when previewEdge prop is provided", () => {
    const state = createInitialState();
    render(
      <BoardView
        state={state}
        selectedCoin={null}
        hoveredPosition={null}
        previewEdge={{ from: { row: 0, col: 0 }, to: { row: 1, col: 1 } }}
        legalPlacements={new Set()}
        flippingCoins={new Set()}
        illegalMoveCoin={null}
        highlightedCoins={new Set()}
      />,
    );

    const previewLine = screen.getByTestId("preview-edge");
    expect(previewLine).toBeDefined();
    expect(previewLine.getAttribute("class")).toContain("preview-line");
  });
});

describe("BoardView — performance", () => {
  it("renders max-density board in under 100ms", () => {
    const state = makeMaxDensityState();
    const start = performance.now();
    renderBoardView(state);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
