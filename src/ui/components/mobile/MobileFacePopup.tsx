import type { Position } from "@core/types";
import { usePopupPosition } from "@ui/hooks/usePopupPosition";
import { useRef } from "react";

interface MobileFacePopupProps {
  readonly position: Position;
  readonly svgRef: React.RefObject<SVGSVGElement>;
  readonly onSelect: (face: "heads" | "tails") => void;
  readonly onCancel: () => void;
}

const M_VIEWBOX = 552;
const M_CELL = 80;
const M_MARGIN = 36;
const M_GRID = 7;

export function MobileFacePopup({ position, svgRef, onSelect, onCancel }: MobileFacePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const offset = usePopupPosition(svgRef, popupRef, position, M_VIEWBOX, M_CELL, M_MARGIN, M_GRID);

  const style = offset
    ? { left: offset.left, top: offset.top, visibility: "visible" as const }
    : { left: 0, top: 0, visibility: "hidden" as const };

  return (
    <div ref={popupRef} className="m-face-popup" style={style}>
      <span className="lbl">Face?</span>
      <button
        type="button"
        className="choice heads"
        onClick={() => onSelect("heads")}
        aria-label="Heads"
      >
        H
      </button>
      <button
        type="button"
        className="choice tails"
        onClick={() => onSelect("tails")}
        aria-label="Tails"
      >
        T
      </button>
      <button type="button" className="cancel" onClick={onCancel} aria-label="Cancel">
        ×
      </button>
    </div>
  );
}
