// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GridView } from "../GridView";

describe("GridView", () => {
  it("renders 7 horizontal lines, 7 vertical lines, and 49 intersection dots", () => {
    render(<GridView gridSize={7} cellSize={100} margin={50} />);

    const grid = screen.getByTestId("grid-view");
    expect(grid).toBeDefined();

    const lines = grid.querySelectorAll("line");
    expect(lines.length).toBe(14); // 7 horizontal + 7 vertical

    const dots = grid.querySelectorAll("circle");
    expect(dots.length).toBe(49);
  });

  it("renders grid lines with correct orchid palette", () => {
    render(<GridView gridSize={7} cellSize={100} margin={50} />);

    const grid = screen.getByTestId("grid-view");
    const lines = grid.querySelectorAll("line");
    const dots = grid.querySelectorAll("circle");

    for (const line of lines) {
      expect(line.getAttribute("stroke")).toBe("#F5E6F5");
      expect(line.getAttribute("stroke-width")).toBe("1");
    }

    for (const dot of dots) {
      expect(dot.getAttribute("fill")).toBe("#C8A2C8");
      expect(dot.getAttribute("r")).toBe("3");
    }
  });
});
