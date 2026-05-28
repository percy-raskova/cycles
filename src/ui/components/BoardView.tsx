import type { GameState, Position } from "@core/types";
import { CELL_SIZE, GRID_SIZE, MARGIN, VIEWBOX_SIZE } from "@ui/lib/constants";
import { positionToSvg } from "@ui/lib/coordinates";
import React, { forwardRef, useMemo } from "react";
import { CoinView } from "./CoinView";
import { EdgeView } from "./EdgeView";
import { GridView } from "./GridView";

interface BoardViewProps {
  readonly state: GameState;
  readonly onCoinClick?: ((position: Position) => void) | undefined;
  readonly onIntersectionClick?: ((position: Position) => void) | undefined;
  readonly onIntersectionHover?: ((position: Position | null) => void) | undefined;
  readonly onCoinHover?: ((position: Position | null) => void) | undefined;
  readonly selectedCoin: Position | null;
  readonly hoveredPosition: Position | null;
  readonly previewEdge: { readonly from: Position; readonly to: Position } | null;
  readonly legalPlacements: ReadonlySet<string>;
  readonly illegalMoveCoin: Position | null;
  readonly highlightedCoins: ReadonlySet<string>;
}

function BoardViewImpl(
  {
    state,
    onCoinClick,
    onIntersectionClick,
    onIntersectionHover,
    onCoinHover,
    selectedCoin,
    hoveredPosition,
    previewEdge,
    legalPlacements,
    illegalMoveCoin,
    highlightedCoins,
  }: BoardViewProps,
  ref: React.Ref<SVGSVGElement>,
) {
  // biome-ignore lint/correctness/useHookAtTopLevel: forwardRef render fn — Biome misreads (props, ref) as a non-component; this hook IS at component top level
  const edges = useMemo(
    () =>
      state.edges.map((edge) => (
        <EdgeView
          key={`edge-${edge.from.row}-${edge.from.col}-${edge.to.row}-${edge.to.col}`}
          edge={edge}
        />
      )),
    [state.edges],
  );

  // biome-ignore lint/correctness/useHookAtTopLevel: forwardRef render fn — Biome misreads (props, ref) as a non-component; this hook IS at component top level
  const coins = useMemo(
    () =>
      Array.from(state.coins.values()).map((coin) => {
        const pos = coin.position;
        const posKey = `${pos.row},${pos.col}`;
        const isSelected = selectedCoin?.row === pos.row && selectedCoin?.col === pos.col;
        const isIllegal = illegalMoveCoin?.row === pos.row && illegalMoveCoin?.col === pos.col;
        const isHighlighted = highlightedCoins.has(posKey);
        return (
          <CoinView
            key={`coin-${pos.row}-${pos.col}`}
            coin={coin}
            onClick={onCoinClick}
            onHover={onCoinHover}
            isSelected={isSelected}
            isHighlighted={isHighlighted}
            isIllegal={isIllegal}
          />
        );
      }),
    [state.coins, selectedCoin, illegalMoveCoin, highlightedCoins, onCoinClick, onCoinHover],
  );

  return (
    <svg
      ref={ref}
      data-testid="board-view"
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="CYCLES game board"
    >
      <title>CYCLES game board</title>
      {/* Diagonal guide lines (queen-lines through corners) — use <path> so tests counting <line> elements are not affected */}
      <g opacity="0.18">
        <path
          d={`M ${MARGIN} ${MARGIN} L ${MARGIN + (GRID_SIZE - 1) * CELL_SIZE} ${MARGIN + (GRID_SIZE - 1) * CELL_SIZE}`}
          stroke="var(--cyan)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        <path
          d={`M ${MARGIN + (GRID_SIZE - 1) * CELL_SIZE} ${MARGIN} L ${MARGIN} ${MARGIN + (GRID_SIZE - 1) * CELL_SIZE}`}
          stroke="var(--cyan)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      </g>
      <GridView
        gridSize={GRID_SIZE}
        cellSize={CELL_SIZE}
        margin={MARGIN}
        onIntersectionClick={onIntersectionClick}
        onIntersectionHover={onIntersectionHover}
        hoveredPosition={hoveredPosition}
        legalPlacements={legalPlacements}
      />
      {edges}
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
      {coins}
    </svg>
  );
}

export const BoardView = React.memo(forwardRef<SVGSVGElement, BoardViewProps>(BoardViewImpl));
