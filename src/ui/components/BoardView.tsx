import type { GameState } from "@core/types";
import { CELL_SIZE, GRID_SIZE, MARGIN, VIEWBOX_SIZE } from "@ui/lib/constants";
import { CoinView } from "./CoinView";
import { EdgeView } from "./EdgeView";
import { GridView } from "./GridView";

interface BoardViewProps {
  readonly state: GameState;
}

export function BoardView({ state }: BoardViewProps) {
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
      <GridView gridSize={GRID_SIZE} cellSize={CELL_SIZE} margin={MARGIN} />
      {state.edges.map((edge) => (
        <EdgeView
          key={`edge-${edge.from.row}-${edge.from.col}-${edge.to.row}-${edge.to.col}`}
          edge={edge}
        />
      ))}
      {Array.from(state.coins.values()).map((coin) => (
        <CoinView key={`coin-${coin.position.row}-${coin.position.col}`} coin={coin} />
      ))}
    </svg>
  );
}
