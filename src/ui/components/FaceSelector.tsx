import type { CoinFace, Position } from "@core/types";
import { usePopupPosition } from "@ui/hooks/usePopupPosition";
import { CELL_SIZE, GRID_SIZE, MARGIN, VIEWBOX_SIZE } from "@ui/lib/constants";
import { useRef } from "react";

interface FaceSelectorProps {
  readonly position: Position;
  readonly onSelect: (face: CoinFace) => void;
  readonly onCancel: () => void;
  readonly svgRef: React.RefObject<SVGSVGElement>;
}

export function FaceSelector({ position, onSelect, onCancel, svgRef }: FaceSelectorProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const offset = usePopupPosition(
    svgRef,
    popupRef,
    position,
    VIEWBOX_SIZE,
    CELL_SIZE,
    MARGIN,
    GRID_SIZE,
  );

  const style = offset
    ? { left: offset.left, top: offset.top, visibility: "visible" as const }
    : { left: 0, top: 0, visibility: "hidden" as const };

  return (
    <>
      <div
        data-testid="face-selector-backdrop"
        className="face-selector-backdrop"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        role="button"
        tabIndex={0}
      />
      <div
        ref={popupRef}
        data-testid={`face-selector-${position.row}-${position.col}`}
        className="face-popup"
        style={{
          position: "absolute",
          ...style,
        }}
      >
        <span className="lbl">Choose face</span>
        <button
          data-testid="face-selector-heads"
          type="button"
          className="face-choice heads"
          aria-label="Heads"
          onClick={() => onSelect("heads")}
        >
          H
        </button>
        <button
          data-testid="face-selector-tails"
          type="button"
          className="face-choice tails"
          aria-label="Tails"
          onClick={() => onSelect("tails")}
        >
          T
        </button>
        <button type="button" className="face-cancel" aria-label="Cancel" onClick={onCancel}>
          &#215;
        </button>
      </div>
    </>
  );
}
