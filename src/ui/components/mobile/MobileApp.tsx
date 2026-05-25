import {
  canJoin,
  hasLegalMoves,
  legalJoins,
  legalPlacements,
  positionBlockedByEdge,
  positionKey,
} from "@core";
import type { CoinFace, GameSession, Move, Position } from "@core";
import type { ApplyMoveResult } from "@ui/hooks/useGameSession";
import { createLogger } from "@ui/lib/logger";
import { type Phase, gamePageReducer, initialGamePageState } from "@ui/pages/gamePageReducer";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
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

const log = createLogger("ui:mobile");
const EMPTY_FLIPPING: ReadonlySet<string> = new Set();

function buildHighlightedCoins(state: GameSession["state"], movePhase: Phase): ReadonlySet<string> {
  const highlighted = new Set<string>();
  if (movePhase.kind !== "SELECTING_SECOND_COIN") return highlighted;
  const first = movePhase.first;
  for (const [a, b] of legalJoins(state)) {
    if (a.row === first.row && a.col === first.col) {
      highlighted.add(positionKey(b));
    } else if (b.row === first.row && b.col === first.col) {
      highlighted.add(positionKey(a));
    }
  }
  return highlighted;
}

function buildPreviewEdge(
  state: GameSession["state"],
  movePhase: Phase,
  hoveredPosition: Position | null,
): { readonly from: Position; readonly to: Position } | null {
  if (
    movePhase.kind === "SELECTING_SECOND_COIN" &&
    hoveredPosition &&
    canJoin(state, movePhase.first, hoveredPosition)
  ) {
    return { from: movePhase.first, to: hoveredPosition };
  }
  return null;
}

interface MobileAppProps {
  readonly session: GameSession;
  readonly applyMove: (move: Move) => ApplyMoveResult;
  readonly onReset: () => void;
  readonly moveLog: readonly { readonly action: string; readonly text: string }[];
}

export function MobileApp({ session, applyMove, onReset, moveLog }: MobileAppProps) {
  const [ui, dispatch] = useReducer(gamePageReducer, initialGamePageState);
  const { phase: movePhase, hovered: hoveredPosition, illegalMoveCoin } = ui;
  const isAnimating = ui.animation !== null;
  const flippingCoins = ui.animation?.flipping ?? EMPTY_FLIPPING;
  const prevHistoryLength = useRef(session.history.length);
  const svgRef = useRef<SVGSVGElement>(null);

  // Reset UI when session rewinds
  useEffect(() => {
    const current = session.history.length;
    const previous = prevHistoryLength.current;
    if (current < previous) {
      dispatch({ type: "RESET_UI" });
    }
    prevHistoryLength.current = current;
  }, [session.history.length]);

  // Auto-pass effect
  useEffect(() => {
    if (session.isTerminal) return;
    if (!hasLegalMoves(session) && !isAnimating) {
      const player = session.state.currentPlayer;
      log.debug("auto-pass", player);
      dispatch({ type: "SET_NOTICE", notice: `${player} has no legal moves — passing` });
      const timer = setTimeout(() => {
        applyMove({ type: "PASS" });
        dispatch({ type: "SET_NOTICE", notice: null });
      }, 900);
      return () => clearTimeout(timer);
    }
    dispatch({ type: "SET_NOTICE", notice: null });
  }, [session, isAnimating, applyMove]);

  // End flip animation
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => dispatch({ type: "ANIMATION_END" }), 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Global Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch({ type: "CANCEL_PHASE" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clear illegal move feedback
  useEffect(() => {
    if (illegalMoveCoin) {
      const timer = setTimeout(() => dispatch({ type: "CLEAR_ILLEGAL" }), 300);
      return () => clearTimeout(timer);
    }
  }, [illegalMoveCoin]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheet, setSheet] = useState<{ open: boolean; tab: string }>({ open: false, tab: "log" });

  const legalPlacementSet = useMemo(
    () => new Set(legalPlacements(session.state).map((p) => positionKey(p))),
    [session.state],
  );

  const highlightedCoins = useMemo(
    () => buildHighlightedCoins(session.state, movePhase),
    [session.state, movePhase],
  );

  const previewEdge = useMemo(
    () => buildPreviewEdge(session.state, movePhase, hoveredPosition),
    [session.state, movePhase, hoveredPosition],
  );

  const handleIntersectionClick = useCallback(
    (position: Position) => {
      log.debug("mobile intersection click", position);
      if (session.isTerminal || isAnimating) return;
      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        dispatch({ type: "CANCEL_PHASE" });
        return;
      }
      if (movePhase.kind !== "IDLE") return;

      const key = positionKey(position);
      if (session.state.coins.has(key)) return;
      if (positionBlockedByEdge(position, session.state.edges)) return;

      dispatch({ type: "SELECT_INTERSECTION", position });
    },
    [session.isTerminal, isAnimating, movePhase.kind, session.state.coins, session.state.edges],
  );

  const handleCoinClick = useCallback(
    (position: Position) => {
      log.debug("mobile coin click", position);
      if (session.isTerminal || isAnimating) return;

      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        if (movePhase.first.row === position.row && movePhase.first.col === position.col) {
          dispatch({ type: "CANCEL_PHASE" });
          return;
        }
        const move: Move = { type: "JOIN", a: movePhase.first, b: position };
        const result = applyMove(move);
        if (result.success) {
          dispatch({ type: "MOVE_RESOLVED", flipped: result.flipped });
        } else {
          dispatch({ type: "ILLEGAL_MOVE", position });
        }
        return;
      }

      if (movePhase.kind !== "IDLE") return;
      dispatch({ type: "BEGIN_JOIN", first: position });
    },
    [session.isTerminal, isAnimating, movePhase, applyMove],
  );

  const handleFaceSelect = useCallback(
    (face: CoinFace) => {
      if (session.isTerminal || isAnimating) return;
      if (movePhase.kind !== "SELECTING_FACE") return;
      const move: Move = { type: "PLACE", position: movePhase.position, face };
      const result = applyMove(move);
      if (!result.success) {
        log.warn("place rejected", { position: movePhase.position, face }, result.error);
      }
      dispatch({
        type: "MOVE_RESOLVED",
        flipped: result.success ? result.flipped : EMPTY_FLIPPING,
      });
    },
    [session.isTerminal, isAnimating, movePhase, applyMove],
  );

  const handleFaceCancel = useCallback(() => {
    dispatch({ type: "CANCEL_PHASE" });
  }, []);

  const handleDrawerAction = useCallback(
    (action: string) => {
      setDrawerOpen(false);
      if (action === "new") {
        onReset();
        dispatch({ type: "RESET_UI" });
      } else if (action === "undo") {
        // undo is handled by parent; we just close drawer
      } else if (action === "pass") {
        applyMove({ type: "PASS" });
      } else {
        setSheet({ open: true, tab: action === "log" ? "log" : action });
      }
    },
    [onReset, applyMove],
  );

  const selectedCoin: Position | null =
    movePhase.kind === "SELECTING_SECOND_COIN" ? movePhase.first : null;

  const isJoining = movePhase.kind === "SELECTING_SECOND_COIN";
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
            ref={svgRef}
            state={session.state}
            legalPlacements={legalPlacementSet}
            selectedCoin={selectedCoin}
            highlightedCoins={highlightedCoins}
            previewEdge={previewEdge}
            flippingCoins={flippingCoins}
            illegalMoveCoin={illegalMoveCoin}
            onIntersectionClick={handleIntersectionClick}
            onCoinClick={handleCoinClick}
          />
          {movePhase.kind === "SELECTING_FACE" && !session.isTerminal && (
            <MobileFacePopup
              position={movePhase.position}
              svgRef={svgRef}
              onSelect={handleFaceSelect}
              onCancel={handleFaceCancel}
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
          onTapMode={() => dispatch({ type: "CANCEL_PHASE" })}
          onPass={() => applyMove({ type: "PASS" })}
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
