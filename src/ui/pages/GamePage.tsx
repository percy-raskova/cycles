import { createSession, legalPlacements, positionKey, step } from "@core";
import type { CoinFace, GameSession, Move, Position } from "@core";
import { BoardView } from "@ui/components/BoardView";
import { FaceSelector } from "@ui/components/FaceSelector";
import { useCallback, useEffect, useState } from "react";

type MovePhase =
  | { readonly kind: "IDLE" }
  | { readonly kind: "SELECTING_FACE"; readonly position: Position }
  | { readonly kind: "SELECTING_SECOND_COIN"; readonly first: Position };

export function GamePage() {
  const [session, setSession] = useState<GameSession>(() => createSession());
  const [movePhase, setMovePhase] = useState<MovePhase>({ kind: "IDLE" });
  const [illegalMoveCoin, setIllegalMoveCoin] = useState<Position | null>(null);

  const performStep = useCallback((move: Move) => {
    setSession((prev) => {
      const result = step(prev, move);
      if (result.kind === "ok") {
        return result.session;
      }
      return prev;
    });
  }, []);

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

  const handleIntersectionClick = useCallback(
    (position: Position) => {
      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        // Clicking empty intersection cancels JOIN selection
        setMovePhase({ kind: "IDLE" });
        return;
      }
      if (movePhase.kind !== "IDLE") return;

      const key = positionKey(position);
      if (session.state.coins.has(key)) return; // occupied, ignore for PLACE

      setMovePhase({ kind: "SELECTING_FACE", position });
    },
    [movePhase.kind, session.state.coins],
  );

  const handleCoinClick = useCallback(
    (position: Position) => {
      if (movePhase.kind === "SELECTING_SECOND_COIN") {
        if (movePhase.first.row === position.row && movePhase.first.col === position.col) {
          // Click same coin → cancel
          setMovePhase({ kind: "IDLE" });
          return;
        }

        const move: Move = {
          type: "JOIN",
          a: movePhase.first,
          b: position,
        };
        const result = step(session, move);
        if (result.kind === "ok") {
          setSession(result.session);
          setMovePhase({ kind: "IDLE" });
        } else {
          setIllegalMoveCoin(position);
        }
        return;
      }

      if (movePhase.kind !== "IDLE") return;

      // Start JOIN selection
      setMovePhase({ kind: "SELECTING_SECOND_COIN", first: position });
    },
    [movePhase, session],
  );

  const handleFaceSelect = useCallback(
    (face: CoinFace) => {
      if (movePhase.kind !== "SELECTING_FACE") return;
      const move: Move = {
        type: "PLACE",
        position: movePhase.position,
        face,
      };
      performStep(move);
      setMovePhase({ kind: "IDLE" });
    },
    [movePhase, performStep],
  );

  const handleFaceCancel = useCallback(() => {
    setMovePhase({ kind: "IDLE" });
  }, []);

  const selectedCoin: Position | null =
    movePhase.kind === "SELECTING_SECOND_COIN" ? movePhase.first : null;

  const legalPlacementSet = new Set(legalPlacements(session.state).map((p) => positionKey(p)));

  return (
    <div className="game-page">
      <div className="game-board-container">
        <BoardView
          state={session.state}
          onCoinClick={handleCoinClick}
          onIntersectionClick={handleIntersectionClick}
          selectedCoin={selectedCoin}
          hoveredPosition={null}
          previewEdge={null}
          legalPlacements={legalPlacementSet}
          flippingCoins={new Set()}
          illegalMoveCoin={illegalMoveCoin}
        />
        {movePhase.kind === "SELECTING_FACE" && (
          <FaceSelector
            position={movePhase.position}
            onSelect={handleFaceSelect}
            onCancel={handleFaceCancel}
          />
        )}
      </div>
    </div>
  );
}
