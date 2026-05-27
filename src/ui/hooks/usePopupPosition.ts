import type { Position } from "@core/types";

export interface PopupOffset {
  readonly left: string | number;
  readonly top: string | number;
}

/**
 * Convert a grid position to CSS pixel coordinates for a popup,
 * clamped so it stays fully inside the board frame and flips
 * vertically near the top/bottom rows.
 *
 * This is pure math — no DOM reads — so it never forces layout
 * or causes jank.
 */
export function usePopupPosition(
  _svgRef: React.RefObject<SVGSVGElement | null>,
  _popupRef: React.RefObject<HTMLElement | null>,
  position: Position,
  viewBoxSize: number,
  cellSize: number,
  margin: number,
  gridSize: number,
): PopupOffset {
  // We compute directly from known CSS bounds rather than reading
  // getBoundingClientRect(), which would force a synchronous layout.
  // The board frame is 100% of its container, so the popup position
  // is a direct ratio of viewBox → CSS pixels.

  const svgX = margin + position.col * cellSize;
  const svgY = margin + position.row * cellSize;

  // Convert viewBox units to percentage of the SVG
  const pctX = svgX / viewBoxSize;
  const pctY = svgY / viewBoxSize;

  // Popup dimensions (fixed by CSS; see .face-popup in theme.css)
  const popupWidth = 140;
  const popupHeight = 120;

  // Horizontal: centre on intersection
  let left = pctX * 100;
  // Clamp so popup stays inside the board
  left = Math.max(
    (popupWidth / 2 / viewBoxSize) * 100,
    Math.min(left, 100 - (popupWidth / 2 / viewBoxSize) * 100),
  );

  // Vertical: flip based on row to avoid clipping
  const GAP_PCT = (20 / viewBoxSize) * 100;
  let top: number;
  if (position.row === 0) {
    top = pctY * 100 + GAP_PCT;
  } else if (position.row === gridSize - 1) {
    top = pctY * 100 - (popupHeight / viewBoxSize) * 100 - GAP_PCT;
  } else {
    top = pctY * 100 - (popupHeight / viewBoxSize) * 100 - GAP_PCT;
  }

  // Clamp vertical
  top = Math.max(0, Math.min(top, 100 - (popupHeight / viewBoxSize) * 100));

  return { left: `${left}%`, top: `${top}%` };
}
