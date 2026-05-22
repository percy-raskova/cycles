import { CELL_SIZE, MARGIN, VIEWBOX_SIZE } from "@ui/lib/constants";

interface GridViewProps {
  readonly gridSize: number;
  readonly cellSize: number;
  readonly margin: number;
}

export function GridView({ gridSize, cellSize, margin }: GridViewProps) {
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
    const x = margin + col * cellSize;
    const y = margin + row * cellSize;
    return <circle key={`d-${row}-${col}`} cx={x} cy={y} r={3} fill="#C8A2C8" />;
  });

  return (
    <g data-testid="grid-view">
      {horizontalLines}
      {verticalLines}
      {dots}
    </g>
  );
}
