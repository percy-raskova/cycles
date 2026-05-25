import type { GameSession } from "@core";
import { computeFinalScore } from "@core";

function Group({
  title,
  children,
}: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <div className="group">
      <span className="group-title">{title}</span>
      {children}
    </div>
  );
}

function TurnPanel({
  session,
  notice,
}: { readonly session: GameSession; readonly notice: string | null }) {
  const isHeads = session.state.currentPlayer === "HEADS";
  return (
    <Group title="&#9679; Turn">
      <div data-testid="turn-indicator" className={`turn ${isHeads ? "heads" : "tails"}`}>
        <div>
          <div className="label">On Move</div>
          <div className="who">
            <span className="chip">{isHeads ? "H" : "T"}</span>
            <span data-testid="turn-indicator-player">{session.state.currentPlayer}</span>
          </div>
          <span data-testid="turn-indicator-remaining">
            {session.state.coinsRemaining} coins remain
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="label">Passes</div>
          <div className="who" style={{ fontSize: 28 }}>
            {session.state.passCount}
            <span style={{ fontSize: 14, color: "var(--ink-mute)" }}>/2</span>
          </div>
        </div>
        {notice && (
          <span data-testid="turn-indicator-notice" className="turn-indicator-notice">
            {notice}
          </span>
        )}
      </div>
    </Group>
  );
}

function ScorePanel({ session }: { readonly session: GameSession }) {
  const score = computeFinalScore(session);
  const total = Math.max(1, score.heads + score.tails);
  const hPct = (score.heads / total) * 100;
  const tPct = (score.tails / total) * 100;

  return (
    <Group title="&#9670; Score">
      <div className="score">
        <div className="cell heads">
          <div className="k">
            Heads
            <span className="dot" style={{ marginLeft: 6 }} />
          </div>
          <div className="v">{score.heads}</div>
        </div>
        <div className="cell tails">
          <div className="k">
            Tails
            <span className="dot" style={{ marginLeft: 6 }} />
          </div>
          <div className="v">{score.tails}</div>
        </div>
      </div>
      <div className="score-bar" aria-hidden="true">
        <div className="h" style={{ width: `${hPct}%` }} />
        <div className="t" style={{ width: `${tPct}%` }} />
        <div className="mid" />
      </div>
    </Group>
  );
}

function SupplyPanel({ session }: { readonly session: GameSession }) {
  const total = 12;
  const remaining = session.state.coinsRemaining;
  const spent = total - remaining;

  return (
    <Group title="&#9633; Supply">
      <div className="supply">
        {Array.from({ length: total }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: pips are static presentational elements
          <div key={`pip-${i}`} className={`pip ${i < spent ? "spent" : ""}`} />
        ))}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: "var(--font-body)",
          fontSize: 11,
          color: "var(--ink-mute)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {remaining} of {total} coins available
      </div>
    </Group>
  );
}

export interface LogEntry {
  readonly action: string;
  readonly text: string;
}

function LogPanel({ log }: { readonly log: readonly LogEntry[] }) {
  return (
    <Group title="&#9654; Log">
      <div
        className="log"
        ref={(el) => {
          if (el) el.scrollTop = el.scrollHeight;
        }}
      >
        {log.length === 0 && (
          <div style={{ color: "var(--ink-mute)", fontStyle: "italic", padding: "8px 4px" }}>
            no moves yet — place a coin to begin
          </div>
        )}
        {log.map((e, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: log order is append-only and deterministic
          <div className="log-entry" key={`entry-${i}`}>
            <span className={`log-tag tag-${e.action}`}>{e.action}</span>
            <span>{e.text}</span>
          </div>
        ))}
      </div>
    </Group>
  );
}

export interface SidebarProps {
  readonly session: GameSession;
  readonly moveLog: readonly LogEntry[];
  readonly notice: string | null;
}

export function Sidebar({ session, moveLog, notice }: SidebarProps) {
  return (
    <div className="side-pane">
      {!session.isTerminal && <TurnPanel session={session} notice={notice} />}
      <ScorePanel session={session} />
      <SupplyPanel session={session} />
      <LogPanel log={moveLog} />
    </div>
  );
}
