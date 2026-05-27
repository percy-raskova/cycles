import type { GameSession } from "@core";
import { computeFinalScore } from "@core";

interface MobileScoreStripProps {
  readonly session: GameSession;
}

export function MobileScoreStrip({ session }: MobileScoreStripProps) {
  const score = computeFinalScore(session);
  const leader = score.heads > score.tails ? "heads" : score.tails > score.heads ? "tails" : null;

  return (
    <div className="m-score">
      <div className={`cell heads ${leader === "heads" ? "leading" : ""}`}>
        <div className="coin-mini">H</div>
        <div className="meta">
          <span className="lbl">Heads</span>
          <span className="num">{score.heads}</span>
        </div>
      </div>
      <div className={`cell tails ${leader === "tails" ? "leading" : ""}`}>
        <div className="coin-mini">T</div>
        <div className="meta">
          <span className="lbl">Tails</span>
          <span className="num">{score.tails}</span>
        </div>
      </div>
    </div>
  );
}
