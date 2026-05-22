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

  const handleIntersectionClick = useCallback(
    (position: Position) => {
      if (movePhase.kind !== "IDLE") return;

      const key = positionKey(position);
      if (session.state.coins.has(key)) return; // occupied, ignore for PLACE

      setMovePhase({ kind: "SELECTING_FACE", position });
    },
    [movePhase.kind, session.state.coins],
  );

  const handleCoinClick = useCallback((_position: Position) => {
    // JOIN logic will be implemented in US2
  }, []);

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

  const legalPlacementSet = new Set(legalPlacements(session.state).map((p) => positionKey(p)));

  return (
    <div className="game-page">
      <div className="game-board-container">
        <BoardView
          state={session.state}
          onCoinClick={handleCoinClick}
          onIntersectionClick={handleIntersectionClick}
          selectedCoin={null}
          hoveredPosition={null}
          previewEdge={null}
          legalPlacements={legalPlacementSet}
          flippingCoins={new Set()}
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
