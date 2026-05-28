import type { GameSession, Move } from "@core";
import { BoardView } from "@ui/components/BoardView";
import { FaceSelector } from "@ui/components/FaceSelector";
import { GameOverPanel } from "@ui/components/GameOverPanel";
import { Sidebar } from "@ui/components/Sidebar";
import { useBoardInteraction } from "@ui/hooks/useBoardInteraction";
import { useIsMobile } from "@ui/hooks/useIsMobile";
import { useCallback } from "react";

export interface GamePageProps {
  readonly session: GameSession;
  /** Submit a (pre-validated, legal) move into the driver. */
  readonly submitMove: (move: Move) => void;
  /** Forced-pass notice owned by the driver, shown in the turn panel. */
  readonly notice: string | null;
  readonly onReset: () => void;
  readonly moveLog?: readonly { readonly action: string; readonly text: string }[];
}

export function GamePage({ session, submitMove, notice, onReset, moveLog = [] }: GamePageProps) {
  const board = useBoardInteraction(session, submitMove);
  // Skip the face-popup's useLayoutEffect (3× getBoundingClientRect) when the
  // mobile shell owns the viewport — MobileApp renders MobileFacePopup instead.
  const isMobile = useIsMobile();

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
            illegalMoveCoin={board.illegalMoveCoin}
            highlightedCoins={board.highlightedCoins}
          />
          {!isMobile && board.movePhase.kind === "SELECTING_FACE" && !session.isTerminal && (
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
