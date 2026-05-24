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
  const dotClass = isLegal ? "grid-dot grid-dot-legal" : "grid-dot";
  const r = isLegal && isHovered ? 6 : 3;

  function handleClick() {
    onIntersectionClick?.(pos);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onIntersectionClick?.(pos);
    }
  }

  return (
    <circle
      key={`d-${row}-${col}`}
      cx={x}
      cy={y}
      r={r}
      fill="#C8A2C8"
      className={dotClass}
      onClick={onIntersectionClick ? handleClick : undefined}
      onKeyDown={onIntersectionClick ? handleKeyDown : undefined}
      role={onIntersectionClick ? "button" : undefined}
      tabIndex={onIntersectionClick ? 0 : undefined}
      onMouseEnter={onIntersectionHover ? () => onIntersectionHover(pos) : undefined}
      onMouseLeave={onIntersectionHover ? () => onIntersectionHover(null) : undefined}
      aria-label={`Empty intersection at row ${row + 1}, column ${col + 1}`}
    />
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

  const horizontalLines = Array.from({ length: gridSize }, (_, row) => {
    const y = margin + row * cellSize;
    return (
      <line
        // biome-ignore lint/suspicious/noArrayIndexKey: static grid, indices are stable
        key={`h-${row}`}
        x1={margin}
        y1={y}
        x2={maxCoord}
        y2={y}
        stroke="#F5E6F5"
        strokeWidth={1}
      />
    );
  });

  const verticalLines = Array.from({ length: gridSize }, (_, col) => {
    const x = margin + col * cellSize;
    return (
      <line
        // biome-ignore lint/suspicious/noArrayIndexKey: static grid, indices are stable
        key={`v-${col}`}
        x1={x}
        y1={margin}
        x2={x}
        y2={maxCoord}
        stroke="#F5E6F5"
        strokeWidth={1}
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
