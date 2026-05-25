import type { Position } from "@core/types";
import { useSvgPosition } from "@ui/hooks/useSvgPosition";

interface MobileFacePopupProps {
  readonly position: Position;
  readonly svgRef: React.RefObject<SVGSVGElement>;
  readonly onSelect: (face: "heads" | "tails") => void;
  readonly onCancel: () => void;
}

const M_VIEWBOX = 552;
const M_CELL = 80;
const M_MARGIN = 36;

export function MobileFacePopup({ position, svgRef, onSelect, onCancel }: MobileFacePopupProps) {
  const offset = useSvgPosition(svgRef, position, M_VIEWBOX, M_CELL, M_MARGIN);

  if (!offset) return null;

  return (
    <div
      className="m-face-popup"
      style={{
        left: offset.left,
        top: offset.top,
      }}
    >
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
