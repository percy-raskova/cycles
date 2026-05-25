import type { CoinFace, Position } from "@core/types";
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
        className="face-selector"
        style={{
          position: "absolute",
          left: x - 45,
          top: y - 55,
        }}
      >
        <button
          data-testid="face-selector-heads"
          type="button"
          className="face-selector-heads"
          aria-label="Choose Heads"
          onClick={() => onSelect("heads")}
        >
          H
        </button>
        <button
          data-testid="face-selector-tails"
          type="button"
          className="face-selector-tails"
          aria-label="Choose Tails"
          onClick={() => onSelect("tails")}
        >
          T
        </button>
      </div>
    </>
  );
}
