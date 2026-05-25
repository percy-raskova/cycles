import type { Position } from "@core/types";
import { useLayoutEffect, useState } from "react";

export interface PopupOffset {
  readonly left: number;
  readonly top: number;
}

/**
 * Convert a grid position (in SVG viewBox coordinates) to CSS pixel coordinates
 * for a popup, clamped so it stays fully inside the board frame and flips
 * vertically near the top/bottom rows.
 */
export function usePopupPosition(
  svgRef: React.RefObject<SVGSVGElement>,
  popupRef: React.RefObject<HTMLElement>,
  position: Position,
  viewBoxSize: number,
  cellSize: number,
  margin: number,
  gridSize: number,
): PopupOffset | null {
  const [offset, setOffset] = useState<PopupOffset | null>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const popup = popupRef.current;
    if (!svg || !popup) return;

    function update() {
      const currentSvg = svgRef.current;
      const currentPopup = popupRef.current;
      if (!currentSvg || !currentPopup) return;

      const svgRect = currentSvg.getBoundingClientRect();
      const frame = currentSvg.parentElement;
      const frameRect = frame?.getBoundingClientRect() ?? svgRect;
      const popupRect = currentPopup.getBoundingClientRect();

      // Convert SVG viewBox coordinates to CSS pixels within the SVG
      const svgX = margin + position.col * cellSize;
      const svgY = margin + position.row * cellSize;

      const intersectionLeft = (svgX / viewBoxSize) * svgRect.width;
      const intersectionTop = (svgY / viewBoxSize) * svgRect.height;

      const popupWidth = popupRect.width;
      const popupHeight = popupRect.height;
      const frameWidth = frameRect.width;
      const frameHeight = frameRect.height;

      // Horizontal: centre on intersection, clamp to frame bounds
      let left = intersectionLeft - popupWidth / 2;
      left = Math.max(0, Math.min(left, frameWidth - popupWidth));

      // Vertical: flip based on row to avoid clipping
      const GAP = 8;
      let top: number;
      if (position.row === 0) {
        // Below the intersection
        top = intersectionTop + GAP;
      } else if (position.row === gridSize - 1) {
        // Above the intersection
        top = intersectionTop - popupHeight - GAP;
      } else {
        // Default: above
        top = intersectionTop - popupHeight - GAP;
      }

      // Clamp vertical to frame
      top = Math.max(0, Math.min(top, frameHeight - popupHeight));

      setOffset({ left, top });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [svgRef, popupRef, position, viewBoxSize, cellSize, margin, gridSize]);

  return offset;
}
