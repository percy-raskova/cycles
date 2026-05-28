import type { GameSession, Move } from "@core";
import { hasLegalMoves } from "@core";
import { useBoardInteraction } from "@ui/hooks/useBoardInteraction";
import { useIsMobile } from "@ui/hooks/useIsMobile";
import { useCallback, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Drawer } from "./Drawer";
import { MobileBoard } from "./MobileBoard";
import { MobileFacePopup } from "./MobileFacePopup";
import { MobileGameOver } from "./MobileGameOver";
import { MobileScoreStrip } from "./MobileScoreStrip";
import { MobileStatusStrip } from "./MobileStatusStrip";
import { MobileSupplyStrip } from "./MobileSupplyStrip";
import { MobileTitleBar } from "./MobileTitleBar";
import { MobileToolbar } from "./MobileToolbar";

interface MobileAppProps {
  readonly session: GameSession;
  readonly submitMove: (move: Move) => void;
  readonly onReset: () => void;
  readonly moveLog: readonly { readonly action: string; readonly text: string }[];
}

export function MobileApp({ session, submitMove, onReset, moveLog }: MobileAppProps) {
  const board = useBoardInteraction(session, submitMove);
  // Skip the face-popup's useLayoutEffect (3× getBoundingClientRect) when the
  // desktop shell owns the viewport — GamePage renders FaceSelector instead.
  const isMobile = useIsMobile();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheet, setSheet] = useState<{ open: boolean; tab: string }>({ open: false, tab: "log" });

  const handlePass = useCallback(() => {
    // Passes are forced-only; the driver auto-passes a player with no legal moves.
    if (!hasLegalMoves(session)) {
      submitMove({ type: "PASS" });
    }
  }, [session, submitMove]);

  const handleDrawerAction = useCallback(
    (action: string) => {
      setDrawerOpen(false);
      if (action === "new") {
        onReset();
        board.resetUi();
      } else if (action === "undo") {
        // undo is handled by parent; we just close drawer
      } else if (action === "pass") {
        handlePass();
      } else {
        setSheet({ open: true, tab: action === "log" ? "log" : action });
      }
    },
    [onReset, handlePass, board.resetUi],
  );

  const isJoining = board.movePhase.kind === "SELECTING_SECOND_COIN";
  const canPass = !session.isTerminal;
  const canUndo = session.history.length > 0 && !session.isTerminal;

  return (
    <div className="phone-shell">
      <div className="p-sun" />
      <div className="p-horizon" />
      <div className="p-scanlines" />

      <div className="mobile-app">
        <MobileTitleBar
          onMenuOpen={() => setDrawerOpen(true)}
          onHelpOpen={() => setSheet({ open: true, tab: "rules" })}
        />

        <MobileStatusStrip session={session} />

        <div className="m-board-frame">
          <MobileBoard
            ref={board.svgRef}
            state={session.state}
            legalPlacements={board.legalPlacementSet}
            selectedCoin={board.selectedCoin}
            highlightedCoins={board.highlightedCoins}
            previewEdge={board.previewEdge}
            illegalMoveCoin={board.illegalMoveCoin}
            onIntersectionClick={board.handleIntersectionClick}
            onCoinClick={board.handleCoinClick}
          />
          {isMobile && board.movePhase.kind === "SELECTING_FACE" && !session.isTerminal && (
            <MobileFacePopup
              position={board.movePhase.position}
              svgRef={board.svgRef}
              onSelect={board.handleFaceSelect}
              onCancel={board.handleFaceCancel}
            />
          )}
          {session.isTerminal && <MobileGameOver session={session} onNewGame={onReset} />}
        </div>

        <MobileSupplyStrip coinsRemaining={session.state.coinsRemaining} />
        <MobileScoreStrip session={session} />

        <MobileToolbar
          isJoining={isJoining}
          canPass={canPass}
          canUndo={canUndo}
          onTapMode={board.cancelPhase}
          onPass={handlePass}
          onUndo={() => {}} // undo handled by parent App
          onLogOpen={() => setSheet({ open: true, tab: "log" })}
        />

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onAction={handleDrawerAction}
        />
        <BottomSheet
          open={sheet.open}
          initialTab={sheet.tab}
          onClose={() => setSheet({ open: false, tab: sheet.tab })}
          logEntries={moveLog}
        />
      </div>
    </div>
  );
}
