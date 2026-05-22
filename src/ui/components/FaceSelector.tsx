import type { CoinFace, Position } from "@core/types";
import { CELL_SIZE, MARGIN } from "@ui/lib/constants";

interface FaceSelectorProps {
  readonly position: Position;
  readonly onSelect: (face: CoinFace) => void;
  readonly onCancel: () => void;
}

export function FaceSelector({ position, onSelect, onCancel }: FaceSelectorProps) {
  const x = MARGIN + position.col * CELL_SIZE;
  const y = MARGIN + position.row * CELL_SIZE;

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
          onClick={() => onSelect("heads")}
        >
          H
        </button>
        <button
          data-testid="face-selector-tails"
          type="button"
          className="face-selector-tails"
          onClick={() => onSelect("tails")}
        >
          T
        </button>
      </div>
    </>
  );
}
