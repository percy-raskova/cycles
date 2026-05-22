import { createSession, step } from "@core";
import type { GameSession } from "@core";
import { BoardView } from "@ui/components/BoardView";
import { useEffect, useState } from "react";

export function GamePage() {
  const [session, _setSession] = useState<GameSession>(() => createSession());

  // Global Escape key handler
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // Cancel is handled by GamePage state machine in later phases
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="game-page">
      <BoardView
        state={session.state}
        selectedCoin={null}
        hoveredPosition={null}
        previewEdge={null}
        legalPlacements={new Set()}
        flippingCoins={new Set()}
      />
    </div>
  );
}
