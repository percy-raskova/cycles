// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import { usePopupPosition } from "../usePopupPosition";

function parsePercent(value: string | number): number {
  if (typeof value === "number") return value;
  return Number.parseFloat(value.replace("%", ""));
}

describe("usePopupPosition (pure math, no DOM reads)", () => {
  it("returns percentage strings for left and top", () => {
    const svgRef: React.RefObject<SVGSVGElement> = { current: null };
    const popupRef: React.RefObject<HTMLDivElement> = { current: null };

    const position = { row: 3, col: 3 };
    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, position, 1600, 225, 25, 7),
    );

    const offset = result.current;
    expect(offset).not.toBeNull();
    expect(typeof offset?.left).toBe("string");
    expect(typeof offset?.top).toBe("string");
    expect(offset?.left).toContain("%");
    expect(offset?.top).toContain("%");
  });

  it("centres horizontally on the intersection", () => {
    const svgRef: React.RefObject<SVGSVGElement> = { current: null };
    const popupRef: React.RefObject<HTMLDivElement> = { current: null };

    const position = { row: 3, col: 3 };
    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, position, 1600, 225, 25, 7),
    );

    const offset = result.current;
    const leftPct = parsePercent(offset?.left ?? "0%");
    // Column 3 of 7 → roughly 50%
    expect(leftPct).toBeGreaterThan(40);
    expect(leftPct).toBeLessThan(60);
  });

  it("places popup below intersection at row 0", () => {
    const svgRef: React.RefObject<SVGSVGElement> = { current: null };
    const popupRef: React.RefObject<HTMLDivElement> = { current: null };

    const position = { row: 0, col: 3 };
    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, position, 1600, 225, 25, 7),
    );

    const offset = result.current;
    const topPct = parsePercent(offset?.top ?? "0%");
    // Row 0 is at the very top of the board, so top % is small but positive
    expect(topPct).toBeGreaterThan(0);
    expect(topPct).toBeLessThan(10);
  });

  it("places popup above intersection at last row", () => {
    const svgRef: React.RefObject<SVGSVGElement> = { current: null };
    const popupRef: React.RefObject<HTMLDivElement> = { current: null };

    const position = { row: 6, col: 3 };
    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, position, 1600, 225, 25, 7),
    );

    const offset = result.current;
    const topPct = parsePercent(offset?.top ?? "0%");
    // Row 6 → popup is placed above, so top % is relatively low
    expect(topPct).toBeLessThan(90);
  });

  it("clamps percentages inside 0–100% bounds", () => {
    const svgRef: React.RefObject<SVGSVGElement> = { current: null };
    const popupRef: React.RefObject<HTMLDivElement> = { current: null };

    const position = { row: 0, col: 0 };
    const { result } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, position, 1600, 225, 25, 7),
    );

    const offset = result.current;
    const leftPct = parsePercent(offset?.left ?? "0%");
    const topPct = parsePercent(offset?.top ?? "0%");
    expect(leftPct).toBeGreaterThanOrEqual(0);
    expect(leftPct).toBeLessThanOrEqual(100);
    expect(topPct).toBeGreaterThanOrEqual(0);
    expect(topPct).toBeLessThanOrEqual(100);
  });

  it("returns different values for different grid positions", () => {
    const svgRef: React.RefObject<SVGSVGElement> = { current: null };
    const popupRef: React.RefObject<HTMLDivElement> = { current: null };

    const { result: r1 } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, { row: 1, col: 1 }, 1600, 225, 25, 7),
    );
    const { result: r2 } = renderHook(() =>
      usePopupPosition(svgRef, popupRef, { row: 5, col: 5 }, 1600, 225, 25, 7),
    );

    expect(r1.current?.left).not.toBe(r2.current?.left);
    expect(r1.current?.top).not.toBe(r2.current?.top);
  });
});
