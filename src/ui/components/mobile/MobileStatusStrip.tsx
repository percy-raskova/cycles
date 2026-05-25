import type { GameSession } from "@core";

interface MobileStatusStripProps {
  readonly session: GameSession;
}

export function MobileStatusStrip({ session }: MobileStatusStripProps) {
  const isHeads = session.state.currentPlayer === "HEADS";
  return (
    <div className="m-status">
      <div className="m-status-cell" aria-live="polite">
        <span className={`turn-chip ${isHeads ? "heads" : "tails"}`}>{isHeads ? "H" : "T"}</span>
        <span className="turn-name">{session.state.currentPlayer}</span>
        <span
          style={{
            color: "var(--ink-mute)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          to move
        </span>
        <span className="caret" />
      </div>
      <div className="m-status-cell" title="Coins in supply">
        <span style={{ color: "var(--bi-magenta)" }}>▣</span>
        <strong>{session.state.coinsRemaining}</strong>/12
      </div>
      <div className="m-status-cell" title="Consecutive passes">
        <span style={{ color: "var(--bi-purple)" }}>↷</span>
        <strong>{session.state.passCount}</strong>/2
      </div>
    </div>
  );
}
