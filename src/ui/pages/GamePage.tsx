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
import { useCallback, useEffect, useRef, useState } from "react";

const log = createLogger("ui");

type MovePhase =
  | { readonly kind: "IDLE" }
  | { readonly kind: "SELECTING_FACE"; readonly position: Position }
  | { readonly kind: "SELECTING_SECOND_COIN"; readonly first: Position };

function buildHighlightedCoins(
  state: GameSession["state"],
  movePhase: MovePhase,
): ReadonlySet<string> {
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
  movePhase: MovePhase,
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
  const [movePhase, setMovePhase] = useState<MovePhase>({ kind: "IDLE" });
  const [illegalMoveCoin, setIllegalMoveCoin] = useState<Position | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<Position | null>(null);
  const [flippingCoins, setFlippingCoins] = useState<ReadonlySet<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const prevHistoryLength = useRef(session.history.length);

  // Reset UI state when session rewinds (undo or reset)
  useEffect(() => {
    const current = session.history.length;
    const previous = prevHistoryLength.current;
    if (current < previous) {
      setMovePhase({ kind: "IDLE" });
      setIllegalMoveCoin(null);
      setFlippingCoins(new Set());
      setIsAnimating(false);
      setNotice(null);
    }
    prevHistoryLength.current = current;
  }, [session.history.length]);

  // Auto-pass effect
  useEffect(() => {
    if (session.isTerminal) return;
    if (!hasLegalMoves(session) && !isAnimating) {
      const player = session.state.currentPlayer;
      log.debug("auto-pass", player);
      setNotice(`${player} has no legal moves — passing`);
      const timer = setTimeout(() => {
        applyMove({ type: "PASS" });
        setNotice(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setNotice(null);
  }, [session, isAnimating, applyMove]);

  // Global Escape key handler
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMovePhase({ kind: "IDLE" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clear illegal-move feedback after animation duration
  useEffect(() => {
    if (illegalMoveCoin) {
      const timer = setTimeout(() => setIllegalMoveCoin(null), 300);
      return () => clearTimeout(timer);
    }
  }, [illegalMoveCoin]);

  const handleNewGame = useCallback(() => {
    onReset();
    setMovePhase({ kind: "IDLE" });
    setIllegalMoveCoin(null);
    setHoveredPosition(null);
    setFlippingCoins(new Set());
    setIsAnimating(false);
    setNotice(null);
  }, [onReset]);

  const handleIntersectionHover = useCallback((position: Position | null) => {
    setHoveredPosition(position);
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
        setMovePhase({ kind: "IDLE" });
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

      setMovePhase({ kind: "SELECTING_FACE", position });
    },
    [session.isTerminal, isAnimating, movePhase.kind, session.state.coins, session.state.edges],
  );

  const handleJoinAttempt = useCallback(
    (position: Position) => {
      if (movePhase.kind !== "SELECTING_SECOND_COIN") return;

      if (movePhase.first.row === position.row && movePhase.first.col === position.col) {
        setMovePhase({ kind: "IDLE" });
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
        setMovePhase({ kind: "IDLE" });
        if (result.flipped.size > 0) {
          setFlippingCoins(result.flipped);
          setIsAnimating(true);
          setTimeout(() => {
            setFlippingCoins(new Set());
            setIsAnimating(false);
          }, 500);
        }
      } else {
        log.warn("join rejected", { from: movePhase.first, to: position }, result.error);
        setIllegalMoveCoin(position);
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

      setMovePhase({ kind: "SELECTING_SECOND_COIN", first: position });
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
      } else if (result.flipped.size > 0) {
        setFlippingCoins(result.flipped);
        setIsAnimating(true);
        setTimeout(() => {
          setFlippingCoins(new Set());
          setIsAnimating(false);
        }, 500);
      }
      setMovePhase({ kind: "IDLE" });
    },
    [session.isTerminal, isAnimating, movePhase, applyMove],
  );

  const handleFaceCancel = useCallback(() => {
    setMovePhase({ kind: "IDLE" });
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
