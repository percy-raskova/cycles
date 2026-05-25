import type { CoinFace, Position } from "@core/types";
import { VIEWBOX_SIZE } from "@ui/lib/constants";
import { positionToSvg } from "@ui/lib/coordinates";

interface FaceSelectorProps {
  readonly position: Position;
  readonly onSelect: (face: CoinFace) => void;
  readonly onCancel: () => void;
}

export function FaceSelector({ position, onSelect, onCancel }: FaceSelectorProps) {
  const { x, y } = positionToSvg(position);

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
          left: x - 45,
          top: y - 55,
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
