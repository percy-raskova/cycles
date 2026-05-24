// @vitest-environment jsdom
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderGame } from "./helpers/render-game";
import { getCoinAt, getDotAt, getEdgeBetween, getFaceSelector } from "./helpers/selectors";

describe("Edge Placement (FR-013)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function selectFace(face: "heads" | "tails") {
    const selector = face === "heads" ? "face-selector-heads" : "face-selector-tails";
    fireEvent.click(screen.getByTestId(selector));
  }

  it("rejects placement along a horizontal edge", () => {
    vi.useFakeTimers();
    renderGame();

    // Place coins at (0,0) and (0,2)
    fireEvent.click(getDotAt(0, 0));
    selectFace("heads");
    fireEvent.click(getDotAt(0, 2));
    selectFace("tails");

    // Join them
    fireEvent.click(getCoinAt(0, 0));
    fireEvent.click(getCoinAt(0, 2));

    // Wait for the join animation to complete
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Verify the edge exists
    expect(getEdgeBetween({ row: 0, col: 0 }, { row: 0, col: 2 })).toBeDefined();

    // (0,1) is empty but lies on the edge from (0,0) to (0,2)
    const dot01 = getDotAt(0, 1);
    expect(dot01.classList.contains("grid-dot-legal")).toBe(false);

    // Clicking (0,1) should not open the face selector
    fireEvent.click(dot01);
    expect(getFaceSelector(0, 1)).toBeNull();
  });

  it("rejects placement along a diagonal edge", () => {
    vi.useFakeTimers();
    renderGame();

    // Place coins at (0,0) and (2,2)
    fireEvent.click(getDotAt(0, 0));
    selectFace("heads");
    fireEvent.click(getDotAt(2, 2));
    selectFace("tails");

    // Join them
    fireEvent.click(getCoinAt(0, 0));
    fireEvent.click(getCoinAt(2, 2));

    // Wait for the join animation to complete
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Verify the edge exists
    expect(getEdgeBetween({ row: 0, col: 0 }, { row: 2, col: 2 })).toBeDefined();

    // (1,1) is empty but lies on the diagonal edge from (0,0) to (2,2)
    const dot11 = getDotAt(1, 1);
    expect(dot11.classList.contains("grid-dot-legal")).toBe(false);

    fireEvent.click(dot11);
    expect(getFaceSelector(1, 1)).toBeNull();
  });

  it("allows placement on an empty intersection not on an edge", () => {
    vi.useFakeTimers();
    renderGame();

    // Place coins at (0,0) and (0,2)
    fireEvent.click(getDotAt(0, 0));
    selectFace("heads");
    fireEvent.click(getDotAt(0, 2));
    selectFace("tails");

    // Join them
    fireEvent.click(getCoinAt(0, 0));
    fireEvent.click(getCoinAt(0, 2));

    // Wait for the join animation to complete
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // (1,1) is not on the edge (0,0)-(0,2)
    const dot11 = getDotAt(1, 1);
    expect(dot11.classList.contains("grid-dot-legal")).toBe(true);

    fireEvent.click(dot11);
    expect(getFaceSelector(1, 1)).not.toBeNull();
  });
});
