import type { FinalScore, GameSession } from "@core";
import { computeFinalScore } from "@core";

interface GameOverPanelProps {
  readonly session?: GameSession;
  readonly score?: FinalScore;
  readonly onNewGame: () => void;
}

export function GameOverPanel({ session, score: scoreProp, onNewGame }: GameOverPanelProps) {
  const score =
    scoreProp ??
    (session ? computeFinalScore(session) : { heads: 0, tails: 0, winner: "draw" as const });
  const winnerText =
    score.heads > score.tails
      ? "HEADS wins!"
      : score.tails > score.heads
        ? "TAILS wins!"
        : "It's a draw!";
  const cls = score.heads > score.tails ? "heads" : score.tails > score.heads ? "tails" : "draw";

  return (
    <div data-testid="game-over-panel" className="game-over">
      <dialog className="panel" aria-modal="true" aria-labelledby="game-over-title">
        <div className="gobar">
          <span id="game-over-title">&#9733; GAME OVER &#9733;</span>
          <span>FINAL</span>
        </div>
        <div className="gobody">
          <div data-testid="game-over-winner" className={`winner ${cls}`}>
            {winnerText}
          </div>
          <div className="row">
            <div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Heads
              </div>
              <div
                data-testid="game-over-heads"
                className="v"
                style={{ color: "var(--heads-rim)" }}
              >
                {score.heads}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Tails
              </div>
              <div
                data-testid="game-over-tails"
                className="v"
                style={{ color: "var(--tails-rim)" }}
              >
                {score.tails}
              </div>
            </div>
          </div>
          <div className="actions">
            <button
              data-testid="game-over-new-game"
              type="button"
              className="tool-btn"
              aria-label="Start new game"
              onClick={onNewGame}
            >
              <span className="tool-icon">&#9670;</span> Play Again
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
