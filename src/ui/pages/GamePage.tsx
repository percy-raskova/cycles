import {
  canJoin,
  computeFinalScore,
  hasLegalMoves,
  legalJoins,
  legalPlacements,
  positionBlockedByEdge,
  positionKey,
} from "@core";
import type { CoinFace, GameSession, Move, Position } from "@core";
import { BoardView } from "@ui/components/BoardView";
import { FaceSelector } from "@ui/components/FaceSelector";
import { GameOverPanel } from "@ui/components/GameOverPanel";
import { TurnIndicator } from "@ui/components/TurnIndicator";
import type { ApplyMoveResult } from "@ui/hooks/useGameSession";
import { createLogger } from "@ui/lib/logger";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { type Phase, gamePageReducer, initialGamePageState } from "./gamePageReducer";

const log = createLogger("ui");

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

export interface GamePageProps {
  readonly session: GameSession;
  readonly applyMove: (move: Move) => ApplyMoveResult;
  readonly onReset: () => void;
}

export function GamePage({ session, applyMove, onReset }: GamePageProps) {
  const [ui, dispatch] = useReducer(gamePageReducer, initialGamePageState);
  const { phase: movePhase, hovered: hoveredPosition, illegalMoveCoin, notice } = ui;
  const isAnimating = ui.animation !== null;
  const flippingCoins = ui.animation?.flipping ?? EMPTY_FLIPPING;
  const prevHistoryLength = useRef(session.history.length);

  // Reset UI state when session rewinds (undo or reset)
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
      }, 1000);
      return () => clearTimeout(timer);
    }
    dispatch({ type: "SET_NOTICE", notice: null });
  }, [session, isAnimating, applyMove]);

  // End the flip animation after its duration
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => dispatch({ type: "ANIMATION_END" }), 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Global Escape key handler
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch({ type: "CANCEL_PHASE" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clear illegal-move feedback after animation duration
  useEffect(() => {
    if (illegalMoveCoin) {
      const timer = setTimeout(() => dispatch({ type: "CLEAR_ILLEGAL" }), 300);
      return () => clearTimeout(timer);
    }
  }, [illegalMoveCoin]);

  const handleNewGame = useCallback(() => {
    onReset();
    dispatch({ type: "RESET_UI" });
    dispatch({ type: "HOVER", position: null });
  }, [onReset]);

  const handleIntersectionHover = useCallback((position: Position | null) => {
    dispatch({ type: "HOVER", position });
  }, []);

  const handleIntersectionClick = useCallback(
    (position: Position) => {
      log.debug("intersection click", position);
      if (session.isTerminal || isAnimating) {
        log.debug("intersection ignored", { isTerminal: session.isTerminal, isAnimating });
        return;
      }
      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        log.debug("intersection cancels pending join");
        dispatch({ type: "CANCEL_PHASE" });
        return;
      }
      if (movePhase.kind !== "IDLE") {
        log.debug("intersection ignored — busy phase", movePhase.kind);
        return;
      }

      const key = positionKey(position);
      if (session.state.coins.has(key)) {
        log.debug("intersection ignored — occupied", position);
        return;
      }
      if (positionBlockedByEdge(position, session.state.edges)) {
        log.debug("intersection ignored — blocked by edge", position);
        return;
      }

      dispatch({ type: "SELECT_INTERSECTION", position });
    },
    [session.isTerminal, isAnimating, movePhase.kind, session.state.coins, session.state.edges],
  );

  const handleJoinAttempt = useCallback(
    (position: Position) => {
      if (movePhase.kind !== "SELECTING_SECOND_COIN") return;

      if (movePhase.first.row === position.row && movePhase.first.col === position.col) {
        dispatch({ type: "CANCEL_PHASE" });
        return;
      }

      const move: Move = {
        type: "JOIN",
        a: movePhase.first,
        b: position,
      };
      log.debug("join attempt", { from: movePhase.first, to: position });
      const result = applyMove(move);
      if (result.success) {
        dispatch({ type: "MOVE_RESOLVED", flipped: result.flipped });
      } else {
        log.warn("join rejected", { from: movePhase.first, to: position }, result.error);
        dispatch({ type: "ILLEGAL_MOVE", position });
      }
    },
    [movePhase, applyMove],
  );

  const handleCoinClick = useCallback(
    (position: Position) => {
      log.debug("coin click", position);
      if (session.isTerminal || isAnimating) {
        log.debug("coin ignored", { isTerminal: session.isTerminal, isAnimating });
        return;
      }

      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        handleJoinAttempt(position);
        return;
      }

      if (movePhase.kind !== "IDLE") {
        log.debug("coin ignored — busy phase", movePhase.kind);
        return;
      }

      dispatch({ type: "BEGIN_JOIN", first: position });
    },
    [session.isTerminal, isAnimating, movePhase.kind, handleJoinAttempt],
  );

  const handleFaceSelect = useCallback(
    (face: CoinFace) => {
      if (session.isTerminal || isAnimating) return;
      if (movePhase.kind !== "SELECTING_FACE") return;
      const move: Move = {
        type: "PLACE",
        position: movePhase.position,
        face,
      };
      log.debug("place", { position: movePhase.position, face });
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

  const selectedCoin: Position | null =
    movePhase.kind === "SELECTING_SECOND_COIN" ? movePhase.first : null;

  const highlightedCoins = buildHighlightedCoins(session.state, movePhase);
  const previewEdge = buildPreviewEdge(session.state, movePhase, hoveredPosition);
  const legalPlacementSet = new Set(legalPlacements(session.state).map((p) => positionKey(p)));

  return (
    <div className="game-page">
      {!session.isTerminal && <TurnIndicator session={session} notice={notice} />}
      <div className="game-board-container">
        <BoardView
          state={session.state}
          onCoinClick={handleCoinClick}
          onCoinHover={handleIntersectionHover}
          onIntersectionClick={handleIntersectionClick}
          onIntersectionHover={handleIntersectionHover}
          selectedCoin={selectedCoin}
          hoveredPosition={hoveredPosition}
          previewEdge={previewEdge}
          legalPlacements={legalPlacementSet}
          flippingCoins={flippingCoins}
          illegalMoveCoin={illegalMoveCoin}
          highlightedCoins={highlightedCoins}
        />
        {movePhase.kind === "SELECTING_FACE" && !session.isTerminal && (
          <FaceSelector
            position={movePhase.position}
            onSelect={handleFaceSelect}
            onCancel={handleFaceCancel}
          />
        )}
      </div>
      {session.isTerminal && (
        <GameOverPanel score={computeFinalScore(session)} onNewGame={handleNewGame} />
      )}
    </div>
  );
}
