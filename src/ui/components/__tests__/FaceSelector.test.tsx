// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { positionToSvg } from "@ui/lib/coordinates";
import { describe, expect, it, vi } from "vitest";
import { FaceSelector } from "../FaceSelector";

describe("FaceSelector", () => {
  it("renders H and T buttons", () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(<FaceSelector position={{ row: 1, col: 1 }} onSelect={onSelect} onCancel={onCancel} />);

    expect(screen.getByTestId("face-selector-1-1")).toBeDefined();
    expect(screen.getByTestId("face-selector-heads")).toBeDefined();
    expect(screen.getByTestId("face-selector-tails")).toBeDefined();
    expect(screen.getByTestId("face-selector-backdrop")).toBeDefined();
  });

  it("positions the panel relative to the intersection's SVG coordinates", () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    const position = { row: 2, col: 3 };
    const { x, y } = positionToSvg(position);

    render(<FaceSelector position={position} onSelect={onSelect} onCancel={onCancel} />);

    const panel = screen.getByTestId("face-selector-2-3") as HTMLElement;
    expect(panel.style.left).toBe(`${x - 45}px`);
    expect(panel.style.top).toBe(`${y - 55}px`);
  });

  it("calls onSelect with heads when H button clicked", async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(<FaceSelector position={{ row: 1, col: 1 }} onSelect={onSelect} onCancel={onCancel} />);

    await userEvent.click(screen.getByTestId("face-selector-heads"));
    expect(onSelect).toHaveBeenCalledWith("heads");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onSelect with tails when T button clicked", async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(<FaceSelector position={{ row: 1, col: 1 }} onSelect={onSelect} onCancel={onCancel} />);

    await userEvent.click(screen.getByTestId("face-selector-tails"));
    expect(onSelect).toHaveBeenCalledWith("tails");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when backdrop clicked", async () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    render(<FaceSelector position={{ row: 1, col: 1 }} onSelect={onSelect} onCancel={onCancel} />);

    await userEvent.click(screen.getByTestId("face-selector-backdrop"));
    expect(onCancel).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
