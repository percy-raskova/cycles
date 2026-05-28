import type { GameSession, Move } from "@core";
import { BoardView } from "@ui/components/BoardView";
import { FaceSelector } from "@ui/components/FaceSelector";
import { GameOverPanel } from "@ui/components/GameOverPanel";
import { Sidebar } from "@ui/components/Sidebar";
import { useBoardInteraction } from "@ui/hooks/useBoardInteraction";
import { useCallback } from "react";

export interface GamePageProps {
  readonly session: GameSession;
  /** Submit a (pre-validated, legal) move into the driver. */
  readonly submitMove: (move: Move) => void;
  /** Coins flipped by the most recent applied move, for the flip animation. */
  readonly lastFlipped: ReadonlySet<string>;
  /** Forced-pass notice owned by the driver, shown in the turn panel. */
  readonly notice: string | null;
  readonly onReset: () => void;
  readonly moveLog?: readonly { readonly action: string; readonly text: string }[];
}

export function GamePage({
  session,
  submitMove,
  lastFlipped,
  notice,
  onReset,
  moveLog = [],
}: GamePageProps) {
  const board = useBoardInteraction(session, submitMove, lastFlipped);

  const handleNewGame = useCallback(() => {
    onReset();
    board.resetUi();
    board.handleIntersectionHover(null);
  }, [onReset, board.resetUi, board.handleIntersectionHover]);

  return (
    <div className="app-body">
      <div className="board-pane">
        <div className="board-frame game-board-container">
          <BoardView
            ref={board.svgRef}
            state={session.state}
            onCoinClick={board.handleCoinClick}
            onCoinHover={board.handleIntersectionHover}
            onIntersectionClick={board.handleIntersectionClick}
            onIntersectionHover={board.handleIntersectionHover}
            selectedCoin={board.selectedCoin}
            hoveredPosition={board.hoveredPosition}
            previewEdge={board.previewEdge}
            legalPlacements={board.legalPlacementSet}
            flippingCoins={board.flippingCoins}
            illegalMoveCoin={board.illegalMoveCoin}
            highlightedCoins={board.highlightedCoins}
          />
          {board.movePhase.kind === "SELECTING_FACE" && !session.isTerminal && (
            <FaceSelector
              position={board.movePhase.position}
              onSelect={board.handleFaceSelect}
              onCancel={board.handleFaceCancel}
              svgRef={board.svgRef}
            />
          )}
          {session.isTerminal && <GameOverPanel session={session} onNewGame={handleNewGame} />}
        </div>
      </div>
      <Sidebar session={session} moveLog={moveLog} notice={notice} />
    </div>
  );
}
