// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GridView } from "../GridView";

describe("GridView", () => {
  it("renders 7 horizontal lines, 7 vertical lines, and 49 intersection dots", () => {
    render(
      <GridView
        gridSize={7}
        cellSize={100}
        margin={50}
        hoveredPosition={null}
        legalPlacements={new Set()}
      />,
    );

    const grid = screen.getByTestId("grid-view");
    expect(grid).toBeDefined();

    const lines = grid.querySelectorAll("line");
    expect(lines.length).toBe(14); // 7 horizontal + 7 vertical

    const dots = grid.querySelectorAll("circle");
    expect(dots.length).toBe(49);
  });

  it("renders grid lines with correct orchid palette", () => {
    render(
      <GridView
        gridSize={7}
        cellSize={100}
        margin={50}
        hoveredPosition={null}
        legalPlacements={new Set()}
      />,
    );

    const grid = screen.getByTestId("grid-view");
    const lines = grid.querySelectorAll("line");
    const dots = grid.querySelectorAll("circle");

    for (const line of lines) {
      expect(line.getAttribute("stroke")).toBe("var(--color-lavender)");
      expect(line.getAttribute("stroke-width")).toBe("1");
    }

    for (const dot of dots) {
      expect(dot.getAttribute("fill")).toBe("var(--color-orchid)");
      expect(dot.getAttribute("r")).toBe("3");
    }
  });

  it("calls onIntersectionClick with correct position when a dot is clicked", async () => {
    const onIntersectionClick = vi.fn();
    render(
      <GridView
        gridSize={7}
        cellSize={100}
        margin={50}
        hoveredPosition={null}
        legalPlacements={new Set()}
        onIntersectionClick={onIntersectionClick}
      />,
    );

    const grid = screen.getByTestId("grid-view");
    const dots = grid.querySelectorAll("circle");
    // Click the dot at row=1, col=1 -> cx=150, cy=150
    const targetDot = Array.from(dots).find(
      (c) => c.getAttribute("cx") === "150" && c.getAttribute("cy") === "150",
    );
    expect(targetDot).toBeDefined();
    if (targetDot) {
      await userEvent.click(targetDot);
    }

    expect(onIntersectionClick).toHaveBeenCalledTimes(1);
    expect(onIntersectionClick).toHaveBeenCalledWith({ row: 1, col: 1 });
  });

  it("highlights legal placement dots with larger radius", () => {
    render(
      <GridView
        gridSize={7}
        cellSize={100}
        margin={50}
        hoveredPosition={{ row: 0, col: 0 }}
        legalPlacements={new Set(["0,0"])}
      />,
    );

    const grid = screen.getByTestId("grid-view");
    const dots = Array.from(grid.querySelectorAll("circle"));
    const legalDot = dots.find(
      (c) => c.getAttribute("cx") === "50" && c.getAttribute("cy") === "50",
    );
    expect(legalDot).toBeDefined();
    expect(legalDot?.getAttribute("r")).toBe("6");
    expect(legalDot?.getAttribute("class")).toContain("grid-dot-legal");
  });
});
