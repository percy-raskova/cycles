import type { GameState, Position } from "@core/types";
import { CELL_SIZE, GRID_SIZE, MARGIN, VIEWBOX_SIZE } from "@ui/lib/constants";
import { positionToSvg } from "@ui/lib/coordinates";
import { CoinView } from "./CoinView";
import { EdgeView } from "./EdgeView";
import { GridView } from "./GridView";

interface BoardViewProps {
  readonly state: GameState;
  readonly onCoinClick?: ((position: Position) => void) | undefined;
  readonly onIntersectionClick?: ((position: Position) => void) | undefined;
  readonly onIntersectionHover?: ((position: Position | null) => void) | undefined;
  readonly selectedCoin: Position | null;
  readonly hoveredPosition: Position | null;
  readonly previewEdge: { readonly from: Position; readonly to: Position } | null;
  readonly legalPlacements: ReadonlySet<string>;
  readonly flippingCoins: ReadonlySet<string>;
}

export function BoardView({
  state,
  onCoinClick,
  onIntersectionClick,
  onIntersectionHover,
  selectedCoin,
  hoveredPosition,
  previewEdge,
  legalPlacements,
  flippingCoins,
}: BoardViewProps) {
  return (
    <svg
      data-testid="board-view"
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="CYCLES game board"
    >
      <title>CYCLES game board</title>
      <GridView
        gridSize={GRID_SIZE}
        cellSize={CELL_SIZE}
        margin={MARGIN}
        onIntersectionClick={onIntersectionClick}
        onIntersectionHover={onIntersectionHover}
        hoveredPosition={hoveredPosition}
        legalPlacements={legalPlacements}
      />
      {state.edges.map((edge) => (
        <EdgeView
          key={`edge-${edge.from.row}-${edge.from.col}-${edge.to.row}-${edge.to.col}`}
          edge={edge}
        />
      ))}
      {previewEdge && (
        <line
          data-testid="preview-edge"
          x1={positionToSvg(previewEdge.from).x}
          y1={positionToSvg(previewEdge.from).y}
          x2={positionToSvg(previewEdge.to).x}
          y2={positionToSvg(previewEdge.to).y}
          className="preview-line"
        />
      )}
      {Array.from(state.coins.values()).map((coin) => {
        const pos = coin.position;
        const posKey = `${pos.row},${pos.col}`;
        const isSelected = selectedCoin?.row === pos.row && selectedCoin?.col === pos.col;
        return (
          <CoinView
            key={`coin-${pos.row}-${pos.col}`}
            coin={coin}
            onClick={onCoinClick}
            isSelected={isSelected}
            isHighlighted={false}
            isFlipping={flippingCoins.has(posKey)}
          />
        );
      })}
    </svg>
  );
}
