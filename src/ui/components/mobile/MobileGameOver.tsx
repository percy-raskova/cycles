import { computeFinalScore } from "@core";
import type { GameSession } from "@core";

interface MobileGameOverProps {
  readonly session: GameSession;
  readonly onNewGame: () => void;
}

export function MobileGameOver({ session, onNewGame }: MobileGameOverProps) {
  const score = computeFinalScore(session);
  const winner =
    score.heads > score.tails ? "HEADS WINS" : score.tails > score.heads ? "TAILS WINS" : "DRAW";
  const cls = score.heads > score.tails ? "heads" : score.tails > score.heads ? "tails" : "draw";

  return (
    <div className="m-gameover">
      <dialog className="panel" aria-modal="true" aria-labelledby="mobile-go-title">
        <div className="top">
          <span id="mobile-go-title">★ GAME OVER ★</span>
          <span>FINAL</span>
        </div>
        <div className="body">
          <div className={`winner ${cls}`}>{winner}</div>
          <div className="scores">
            <div>
              <div className="k">Heads</div>
              <div className="v" style={{ color: "var(--heads-rim)" }}>
                {score.heads}
              </div>
            </div>
            <div>
              <div className="k">Tails</div>
              <div className="v" style={{ color: "var(--tails-rim)" }}>
                {score.tails}
              </div>
            </div>
          </div>
          <button
            data-testid="mobile-game-over-new-game"
            type="button"
            onClick={onNewGame}
            style={{
              height: 44,
              padding: "0 18px",
              background: "var(--chrome)",
              border: "2px solid",
              borderTopColor: "var(--chrome-light)",
              borderLeftColor: "var(--chrome-light)",
              borderRightColor: "var(--chrome-dark)",
              borderBottomColor: "var(--chrome-dark)",
              color: "var(--ink-on-chrome)",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            ◆ Play Again
          </button>
        </div>
      </dialog>
    </div>
  );
}
