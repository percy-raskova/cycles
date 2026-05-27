import type { Position } from "@core/types";
import { useLayoutEffect, useState } from "react";

export interface PopupOffset {
  readonly left: number;
  readonly top: number;
}

/**
 * Convert a grid position to CSS pixel coordinates for a popup,
 * clamped so it stays fully inside the board frame and flips
 * vertically near the top/bottom rows.
 *
 * Reads the SVG’s rendered bounding rect once (via useLayoutEffect)
 * so the popup is glued to the actual on-screen intersection.
 */
export function usePopupPosition(
  svgRef: React.RefObject<SVGSVGElement | null>,
  popupRef: React.RefObject<HTMLElement | null>,
  position: Position,
  viewBoxSize: number,
  cellSize: number,
  margin: number,
  _gridSize: number,
): PopupOffset | null {
  const [offset, setOffset] = useState<PopupOffset | null>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const popup = popupRef.current;
    const frame = svg?.parentElement;
    if (!svg || !popup || !frame) return;

    const svgRect = svg.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();

    // Scale from viewBox units to rendered CSS pixels
    const scale = svgRect.width / viewBoxSize;

    // Intersection position in viewBox units
    const vbX = margin + position.col * cellSize;
    const vbY = margin + position.row * cellSize;

    // Intersection position in CSS pixels (relative to viewport)
    const pixelX = svgRect.left + vbX * scale;
    const pixelY = svgRect.top + vbY * scale;

    // Distance from frame origin to intersection
    let left = pixelX - frameRect.left;
    let top = pixelY - frameRect.top;

    // Centre horizontally on the intersection
    left -= popupRect.width / 2;

    // Glue vertically: above the dot by default, below for top row
    const gap = 4 * scale; // 4 viewBox units (~4 px at default scale)
    if (position.row === 0) {
      top += gap;
    } else {
      top -= popupRect.height + gap;
    }

    // Clamp so the popup never leaks outside the frame
    left = Math.max(0, Math.min(left, frameRect.width - popupRect.width));
    top = Math.max(0, Math.min(top, frameRect.height - popupRect.height));

    setOffset((prev) => {
      if (prev && prev.left === left && prev.top === top) return prev;
      return { left, top };
    });
  }, [position, viewBoxSize, cellSize, margin, svgRef, popupRef]);

  return offset;
}
