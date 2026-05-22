import type { GameSession } from "@core";

interface TurnIndicatorProps {
  readonly session: GameSession;
  readonly notice: string | null;
}

export function TurnIndicator({ session, notice }: TurnIndicatorProps) {
  const playerClass =
    session.state.currentPlayer === "HEADS" ? "turn-indicator-heads" : "turn-indicator-tails";

  return (
    <div data-testid="turn-indicator" className="turn-indicator">
      <span data-testid="turn-indicator-player" className={`turn-indicator-player ${playerClass}`}>
        {session.state.currentPlayer}
      </span>
      <span data-testid="turn-indicator-remaining">
        {session.state.coinsRemaining} coins remain
      </span>
      {notice && (
        <span data-testid="turn-indicator-notice" className="turn-indicator-notice">
          {notice}
        </span>
      )}
    </div>
  );
}
