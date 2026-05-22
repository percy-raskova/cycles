import {
  canJoin,
  computeFinalScore,
  createSession,
  hasLegalMoves,
  legalJoins,
  legalPlacements,
  positionKey,
  step,
} from "@core";
import type { CoinFace, GameSession, Move, Position } from "@core";
import { BoardView } from "@ui/components/BoardView";
import { FaceSelector } from "@ui/components/FaceSelector";
import { GameOverPanel } from "@ui/components/GameOverPanel";
import { TurnIndicator } from "@ui/components/TurnIndicator";
import { useCallback, useEffect, useState } from "react";

type MovePhase =
  | { readonly kind: "IDLE" }
  | { readonly kind: "SELECTING_FACE"; readonly position: Position }
  | { readonly kind: "SELECTING_SECOND_COIN"; readonly first: Position };

function findFlippedCoins(previous: GameSession, current: GameSession): ReadonlySet<string> {
  const flipped = new Set<string>();
  for (const [key, prevCoin] of previous.state.coins) {
    const newCoin = current.state.coins.get(key);
    if (newCoin && newCoin.face !== prevCoin.face) {
      flipped.add(key);
    }
  }
  return flipped;
}

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

export function GamePage() {
  const [session, setSession] = useState<GameSession>(() => createSession());
  const [movePhase, setMovePhase] = useState<MovePhase>({ kind: "IDLE" });
  const [illegalMoveCoin, setIllegalMoveCoin] = useState<Position | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<Position | null>(null);
  const [flippingCoins, setFlippingCoins] = useState<ReadonlySet<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const applyMove = useCallback(
    (move: Move) => {
      const result = step(session, move);
      if (result.kind === "ok") {
        const flipped = findFlippedCoins(session, result.session);
        setSession(result.session);
        if (flipped.size > 0) {
          setFlippingCoins(flipped);
          setIsAnimating(true);
          setTimeout(() => {
            setFlippingCoins(new Set());
            setIsAnimating(false);
          }, 500);
        }
        return true;
      }
      return false;
    },
    [session],
  );

  // Auto-pass effect
  useEffect(() => {
    if (session.isTerminal) return;
    if (!hasLegalMoves(session) && !isAnimating) {
      const player = session.state.currentPlayer;
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
    setSession(createSession());
    setMovePhase({ kind: "IDLE" });
    setIllegalMoveCoin(null);
    setHoveredPosition(null);
    setFlippingCoins(new Set());
    setIsAnimating(false);
    setNotice(null);
  }, []);

  const handleIntersectionHover = useCallback((position: Position | null) => {
    setHoveredPosition(position);
  }, []);

  const handleIntersectionClick = useCallback(
    (position: Position) => {
      if (session.isTerminal || isAnimating) return;
      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        setMovePhase({ kind: "IDLE" });
        return;
      }
      if (movePhase.kind !== "IDLE") return;

      const key = positionKey(position);
      if (session.state.coins.has(key)) return;

      setMovePhase({ kind: "SELECTING_FACE", position });
    },
    [session.isTerminal, isAnimating, movePhase.kind, session.state.coins],
  );

  const handleCoinClick = useCallback(
    (position: Position) => {
      if (session.isTerminal || isAnimating) return;
      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        if (movePhase.first.row === position.row && movePhase.first.col === position.col) {
          setMovePhase({ kind: "IDLE" });
          return;
        }

        const move: Move = {
          type: "JOIN",
          a: movePhase.first,
          b: position,
        };
        const ok = applyMove(move);
        if (ok) {
          setMovePhase({ kind: "IDLE" });
        } else {
          setIllegalMoveCoin(position);
        }
        return;
      }

      if (movePhase.kind !== "IDLE") return;

      setMovePhase({ kind: "SELECTING_SECOND_COIN", first: position });
    },
    [session.isTerminal, isAnimating, movePhase, applyMove],
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
      applyMove(move);
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
