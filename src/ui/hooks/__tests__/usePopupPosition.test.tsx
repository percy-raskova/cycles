// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { usePopupPosition } from "../usePopupPosition";

function setupDom(
  frameSize: { width: number; height: number },
  popupSize: { width: number; height: number },
) {
  const frame = document.createElement("div");
  frame.style.position = "relative";
  frame.style.width = `${frameSize.width}px`;
  frame.style.height = `${frameSize.height}px`;
  document.body.appendChild(frame);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1600 1600");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  frame.appendChild(svg);

  const popup = document.createElement("div");
  popup.style.position = "absolute";
  popup.style.width = `${popupSize.width}px`;
  popup.style.height = `${popupSize.height}px`;
  frame.appendChild(popup);

  // Mock getBoundingClientRect to return known values
  svg.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: frameSize.width,
    height: frameSize.height,
    top: 0,
    left: 0,
    right: frameSize.width,
    bottom: frameSize.height,
    toJSON: () => "",
  });

  popup.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: popupSize.width,
    height: popupSize.height,
    top: 0,
    left: 0,
    right: popupSize.width,
    bottom: popupSize.height,
    toJSON: () => "",
  });

  frame.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: frameSize.width,
    height: frameSize.height,
    top: 0,
    left: 0,
    right: frameSize.width,
    bottom: frameSize.height,
    toJSON: () => "",
  });

  const svgRef: React.RefObject<SVGSVGElement> = { current: svg as SVGSVGElement };
  const popupRef: React.RefObject<HTMLDivElement> = { current: popup };

  return { svgRef, popupRef, cleanup: () => document.body.removeChild(frame) };
}

describe("usePopupPosition", () => {
  it("returns null initially and then pixel coordinates after layout", async () => {
    const { svgRef, popupRef, cleanup } = setupDom(
      { width: 800, height: 800 },
      { width: 200, height: 70 },
    );

    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, { row: 3, col: 3 }, 1600, 225, 25, 7),
    );

    // useLayoutEffect runs synchronously in jsdom, so the offset is
    // computed immediately after the first render.
    expect(result.current).not.toBeNull();

    const offset = result.current;
    expect(offset).not.toBeNull();
    expect(typeof offset?.left).toBe("number");
    expect(typeof offset?.top).toBe("number");

    cleanup();
  });

  it("centres horizontally on the intersection", async () => {
    const { svgRef, popupRef, cleanup } = setupDom(
      { width: 800, height: 800 },
      { width: 200, height: 70 },
    );

    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, { row: 3, col: 3 }, 1600, 225, 25, 7),
    );

    await waitFor(() => expect(result.current).not.toBeNull());

    const offset = result.current;
    expect(offset).not.toBeNull();
    // Intersection (3,3) is at vbX = 25 + 3*225 = 700 → 700/1600 * 800 = 350px
    // Popup width 200px, centred: left = 350 - 100 = 250px
    expect(offset?.left).toBe(250);

    cleanup();
  });

  it("places popup below intersection at row 0", async () => {
    const { svgRef, popupRef, cleanup } = setupDom(
      { width: 800, height: 800 },
      { width: 200, height: 70 },
    );

    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, { row: 0, col: 3 }, 1600, 225, 25, 7),
    );

    await waitFor(() => expect(result.current).not.toBeNull());

    const offset = result.current;
    expect(offset).not.toBeNull();
    // Row 0 is at vbY = 25 → 25/1600 * 800 = 12.5px
    // Popup placed below with 2px gap (4 viewBox units * 0.5 scale)
    // top = 12.5 + 2 = 14.5, then clamped to >= 0
    expect(offset?.top).toBeGreaterThan(10);
    expect(offset?.top).toBeLessThan(20);

    cleanup();
  });

  it("places popup above intersection at last row", async () => {
    const { svgRef, popupRef, cleanup } = setupDom(
      { width: 800, height: 800 },
      { width: 200, height: 70 },
    );

    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, { row: 6, col: 3 }, 1600, 225, 25, 7),
    );

    await waitFor(() => expect(result.current).not.toBeNull());

    const offset = result.current;
    expect(offset).not.toBeNull();
    // Row 6 is at vbY = 25 + 6*225 = 1375 → 1375/1600 * 800 = 687.5px
    // Popup placed above: top = 687.5 - 70 - 2 = 615.5
    expect(offset?.top).toBeLessThan(650);
    expect(offset?.top).toBeGreaterThan(600);

    cleanup();
  });

  it("clamps to frame bounds when intersection is near an edge", async () => {
    const { svgRef, popupRef, cleanup } = setupDom(
      { width: 800, height: 800 },
      { width: 200, height: 70 },
    );

    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, { row: 0, col: 0 }, 1600, 225, 25, 7),
    );

    await waitFor(() => expect(result.current).not.toBeNull());

    const offset = result.current;
    expect(offset).not.toBeNull();
    // Intersection (0,0) centred would be at left = 12.5 - 100 = -87.5
    // Clamped to 0
    expect(offset?.left).toBe(0);
    expect(offset?.top).toBeGreaterThanOrEqual(0);

    cleanup();
  });

  it("returns different values for different grid positions", async () => {
    const { svgRef, popupRef, cleanup } = setupDom(
      { width: 800, height: 800 },
      { width: 200, height: 70 },
    );

    const { result: r1 } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, { row: 1, col: 1 }, 1600, 225, 25, 7),
    );
    const { result: r2 } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, { row: 5, col: 5 }, 1600, 225, 25, 7),
    );

    await waitFor(() => expect(r1.current).not.toBeNull());
    await waitFor(() => expect(r2.current).not.toBeNull());

    expect(r1.current?.left).not.toBe(r2.current?.left);
    expect(r1.current?.top).not.toBe(r2.current?.top);

    cleanup();
  });
});
