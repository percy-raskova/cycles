import { positionKey } from "@core";
import type { Position } from "@core/types";
import { CELL_SIZE, MARGIN, VIEWBOX_SIZE } from "@ui/lib/constants";

interface GridDotProps {
  readonly row: number;
  readonly col: number;
  readonly margin: number;
  readonly cellSize: number;
  readonly isLegal: boolean;
  readonly isHovered: boolean;
  readonly onIntersectionClick?: ((position: Position) => void) | undefined;
  readonly onIntersectionHover?: ((position: Position | null) => void) | undefined;
}

const TOUCH_TARGET_SIZE = 120;

function GridDot({
  row,
  col,
  margin,
  cellSize,
  isLegal,
  isHovered,
  onIntersectionClick,
  onIntersectionHover,
}: GridDotProps) {
  const x = margin + col * cellSize;
  const y = margin + row * cellSize;
  const pos: Position = { row, col };
  const dotClass = isLegal ? "dot legal grid-dot-legal" : "dot";
  const r = isLegal && isHovered ? 36 : isLegal ? 20 : 20;

  function handleClick() {
    onIntersectionClick?.(pos);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onIntersectionClick?.(pos);
    }
  }

  const halfTouch = TOUCH_TARGET_SIZE / 2;

  return (
    <g
      onClick={onIntersectionClick ? handleClick : undefined}
      onKeyDown={onIntersectionClick ? handleKeyDown : undefined}
      onMouseEnter={onIntersectionHover ? () => onIntersectionHover(pos) : undefined}
      onMouseLeave={onIntersectionHover ? () => onIntersectionHover(null) : undefined}
      role={onIntersectionClick ? "button" : undefined}
      tabIndex={onIntersectionClick ? 0 : undefined}
      aria-label={`Intersection r${row + 1} c${col + 1}${isLegal ? " (legal placement)" : ""}`}
      style={{ cursor: onIntersectionClick ? "pointer" : "default" }}
    >
      {onIntersectionClick && (
        <rect
          className="touch"
          x={x - halfTouch}
          y={y - halfTouch}
          width={TOUCH_TARGET_SIZE}
          height={TOUCH_TARGET_SIZE}
        />
      )}
      <circle
        key={`d-${row}-${col}`}
        cx={x}
        cy={y}
        r={r}
        fill="var(--color-orchid)"
        className={dotClass}
        pointerEvents="none"
      />
    </g>
  );
}

interface GridViewProps {
  readonly gridSize: number;
  readonly cellSize: number;
  readonly margin: number;
  readonly onIntersectionClick?: ((position: Position) => void) | undefined;
  readonly onIntersectionHover?: ((position: Position | null) => void) | undefined;
  readonly hoveredPosition: Position | null;
  readonly legalPlacements: ReadonlySet<string>;
}

export function GridView({
  gridSize,
  cellSize,
  margin,
  onIntersectionClick,
  onIntersectionHover,
  hoveredPosition,
  legalPlacements,
}: GridViewProps) {
  const maxCoord = margin + (gridSize - 1) * cellSize;

  const horizontalLines = Array.from({ length: gridSize }, (_, i) => {
    const y = margin + i * cellSize;
    const major = i === 0 || i === gridSize - 1;
    return (
      <line
        // biome-ignore lint/suspicious/noArrayIndexKey: static grid
        key={`h-${i}`}
        x1={margin}
        y1={y}
        x2={maxCoord}
        y2={y}
        className={`gridline ${major ? "major" : ""}`}
        stroke="var(--color-lavender)"
        strokeWidth={2}
      />
    );
  });

  const verticalLines = Array.from({ length: gridSize }, (_, i) => {
    const x = margin + i * cellSize;
    const major = i === 0 || i === gridSize - 1;
    return (
      <line
        // biome-ignore lint/suspicious/noArrayIndexKey: static grid
        key={`v-${i}`}
        x1={x}
        y1={margin}
        x2={x}
        y2={maxCoord}
        className={`gridline ${major ? "major" : ""}`}
        stroke="var(--color-lavender)"
        strokeWidth={2}
      />
    );
  });

  const dots = Array.from({ length: gridSize * gridSize }, (_, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const key = positionKey({ row, col });
    const isLegal = legalPlacements.has(key);
    const isHovered = hoveredPosition?.row === row && hoveredPosition?.col === col;

    return (
      <GridDot
        key={`d-${row}-${col}`}
        row={row}
        col={col}
        margin={margin}
        cellSize={cellSize}
        isLegal={isLegal}
        isHovered={isHovered}
        onIntersectionClick={onIntersectionClick}
        onIntersectionHover={onIntersectionHover}
      />
    );
  });

  return (
    <g data-testid="grid-view">
      {horizontalLines}
      {verticalLines}
      {dots}
    </g>
  );
}
