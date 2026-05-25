// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FaceSelector } from "../FaceSelector";

function createMockSvgRef(rect?: Partial<DOMRect>): React.RefObject<SVGSVGElement> {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: 800,
      height: 800,
      right: 800,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
      ...rect,
    }) as DOMRect;
  return { current: svg as SVGSVGElement };
}

describe("FaceSelector", () => {
  it("renders H and T buttons", () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(
      <FaceSelector
        position={{ row: 1, col: 1 }}
        onSelect={onSelect}
        onCancel={onCancel}
        svgRef={createMockSvgRef()}
      />,
    );

    expect(screen.getByTestId("face-selector-1-1")).toBeDefined();
    expect(screen.getByTestId("face-selector-heads")).toBeDefined();
    expect(screen.getByTestId("face-selector-tails")).toBeDefined();
    expect(screen.getByTestId("face-selector-backdrop")).toBeDefined();
  });

  it("positions the panel relative to the rendered SVG", () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    const position = { row: 2, col: 3 };

    const frame = document.createElement("div");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.getBoundingClientRect = () =>
      ({
        left: 100,
        top: 100,
        width: 800,
        height: 800,
        right: 900,
        bottom: 900,
        x: 100,
        y: 100,
        toJSON: () => {},
      }) as DOMRect;
    frame.getBoundingClientRect = () =>
      ({
        left: 100,
        top: 100,
        width: 800,
        height: 800,
        right: 900,
        bottom: 900,
        x: 100,
        y: 100,
        toJSON: () => {},
      }) as DOMRect;
    frame.appendChild(svg);
    document.body.appendChild(frame);

    const svgRef = { current: svg as SVGSVGElement };

    render(
      <FaceSelector position={position} onSelect={onSelect} onCancel={onCancel} svgRef={svgRef} />,
    );

    const panel = screen.getByTestId("face-selector-2-3") as HTMLElement;
    // VIEWBOX_SIZE = 1625, svgX = 25 + 3*225 = 700, svgY = 25 + 2*225 = 475
    // left = (700/1625)*800 = 344.615..., top = (475/1625)*800 = 233.846...
    expect(panel.style.left).toBe("344.61538461538464px");
    expect(panel.style.top).toBe("233.84615384615387px");

    document.body.removeChild(frame);
  });

  it("calls onSelect with heads when H button clicked", async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(
      <FaceSelector
        position={{ row: 1, col: 1 }}
        onSelect={onSelect}
        onCancel={onCancel}
        svgRef={createMockSvgRef()}
      />,
    );

    await userEvent.click(screen.getByTestId("face-selector-heads"));
    expect(onSelect).toHaveBeenCalledWith("heads");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onSelect with tails when T button clicked", async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(
      <FaceSelector
        position={{ row: 1, col: 1 }}
        onSelect={onSelect}
        onCancel={onCancel}
        svgRef={createMockSvgRef()}
      />,
    );

    await userEvent.click(screen.getByTestId("face-selector-tails"));
    expect(onSelect).toHaveBeenCalledWith("tails");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when backdrop clicked", async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(
      <FaceSelector
        position={{ row: 1, col: 1 }}
        onSelect={onSelect}
        onCancel={onCancel}
        svgRef={createMockSvgRef()}
      />,
    );

    await userEvent.click(screen.getByTestId("face-selector-backdrop"));
    expect(onCancel).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
