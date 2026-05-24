// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EdgeView } from "../EdgeView";

describe("EdgeView", () => {
  it("renders a line from the correct start to end coordinates", () => {
    const edge = {
      from: { row: 0, col: 0 },
      to: { row: 0, col: 1 },
    };
    render(<EdgeView edge={edge} />);

    const line = screen.getByTestId("edge-0-0-0-1");
    expect(line.getAttribute("x1")).toBe("25");
    expect(line.getAttribute("y1")).toBe("25");
    expect(line.getAttribute("x2")).toBe("250");
    expect(line.getAttribute("y2")).toBe("25");
    expect(line.getAttribute("stroke")).toBe("var(--color-magenta)");
    expect(line.getAttribute("stroke-width")).toBe("2");
  });

  it("renders diagonal edges correctly", () => {
    const edge = {
      from: { row: 0, col: 0 },
      to: { row: 6, col: 6 },
    };
    render(<EdgeView edge={edge} />);

    const line = screen.getByTestId("edge-0-0-6-6");
    expect(line.getAttribute("x1")).toBe("25");
    expect(line.getAttribute("y1")).toBe("25");
    expect(line.getAttribute("x2")).toBe("1375");
    expect(line.getAttribute("y2")).toBe("1375");
  });
});
