// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FaceSelector } from "../FaceSelector";

function createMockSvgRef(): React.RefObject<SVGSVGElement> {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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

  it("positions the panel inside the board frame", () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(
      <FaceSelector
        position={{ row: 2, col: 3 }}
        onSelect={onSelect}
        onCancel={onCancel}
        svgRef={createMockSvgRef()}
      />,
    );

    const panel = screen.getByTestId("face-selector-2-3") as HTMLElement;
    expect(panel.style.left).toBeTruthy();
    expect(panel.style.top).toBeTruthy();
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
