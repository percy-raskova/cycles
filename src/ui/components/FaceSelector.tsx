import type { CoinFace, Position } from "@core/types";
import { useSvgPosition } from "@ui/hooks/useSvgPosition";
import { CELL_SIZE, MARGIN, VIEWBOX_SIZE } from "@ui/lib/constants";

interface FaceSelectorProps {
  readonly position: Position;
  readonly onSelect: (face: CoinFace) => void;
  readonly onCancel: () => void;
  readonly svgRef: React.RefObject<SVGSVGElement>;
}

export function FaceSelector({ position, onSelect, onCancel, svgRef }: FaceSelectorProps) {
  const offset = useSvgPosition(svgRef, position, VIEWBOX_SIZE, CELL_SIZE, MARGIN);

  if (!offset) return null;

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
        data-testid={`face-selector-${position.row}-${position.col}`}
        className="face-popup"
        style={{
          position: "absolute",
          left: offset.left,
          top: offset.top,
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
