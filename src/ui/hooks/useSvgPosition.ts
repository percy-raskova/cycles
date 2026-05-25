import type { Position } from "@core/types";
import { useLayoutEffect, useState } from "react";

export interface SvgOffset {
  readonly left: number;
  readonly top: number;
}

/**
 * Convert a grid position (in SVG viewBox coordinates) to CSS pixel coordinates
 * relative to the SVG's positioned parent (e.g. .board-frame or .m-board-frame).
 *
 * This handles padding, aspect-ratio scaling, and browser differences so popups
 * rendered as HTML siblings of the SVG appear directly over the clicked cell.
 */
export function useSvgPosition(
  svgRef: React.RefObject<SVGSVGElement>,
  position: Position,
  viewBoxSize: number,
  cellSize: number,
  margin: number,
): SvgOffset | null {
  const [offset, setOffset] = useState<SvgOffset | null>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function update() {
      const currentSvg = svgRef.current;
      if (!currentSvg) return;
      const svgRect = currentSvg.getBoundingClientRect();
      const frame = currentSvg.parentElement;
      const frameRect = frame?.getBoundingClientRect() ?? svgRect;

      const svgX = margin + position.col * cellSize;
      const svgY = margin + position.row * cellSize;

      const left = svgRect.left - frameRect.left + (svgX / viewBoxSize) * svgRect.width;
      const top = svgRect.top - frameRect.top + (svgY / viewBoxSize) * svgRect.height;

      setOffset({ left, top });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [svgRef, position, viewBoxSize, cellSize, margin]);

  return offset;
}
