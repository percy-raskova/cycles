import { useState } from "react";

interface BottomSheetProps {
  readonly open: boolean;
  readonly initialTab?: string;
  readonly onClose: () => void;
  readonly logEntries: readonly { readonly action: string; readonly text: string }[];
}

export function BottomSheet({ open, initialTab = "log", onClose, logEntries }: BottomSheetProps) {
  const [tab, setTab] = useState(initialTab);

  if (!open) return null;

  const tabs = [
    { key: "log", label: "Log" },
    { key: "rules", label: "Rules" },
    { key: "controls", label: "Controls" },
    { key: "about", label: "About" },
  ];

  const currentLabel = tabs.find((t) => t.key === tab)?.label || "Info";

  return (
    <div
      className="m-sheet-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <dialog className="m-sheet" aria-modal="true" aria-labelledby="sheet-title">
        <div className="m-sheet-title">
          <span id="sheet-title">{currentLabel}</span>
          <button type="button" className="m-iconbtn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="m-sheet-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`m-sheet-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="m-sheet-body">
          {tab === "log" && <SheetLog entries={logEntries} />}
          {tab === "rules" && <SheetRules />}
          {tab === "controls" && <SheetControls />}
          {tab === "about" && <SheetAbout />}
        </div>
      </dialog>
    </div>
  );
}

function SheetLog({
  entries,
}: {
  readonly entries: readonly { readonly action: string; readonly text: string }[];
}) {
  if (entries.length === 0) {
    return (
      <p style={{ color: "var(--ink-mute)", fontStyle: "italic" }}>
        No moves yet — place a coin to begin.
      </p>
    );
  }
  return (
    <div>
      {entries.map((e, i) => (
        <div key={`log-${i}`} className="log-entry">
          <span className={`log-tag tag-${e.action}`}>{e.action}</span>
          <span>{e.text}</span>
        </div>
      ))}
    </div>
  );
}

function SheetRules() {
  return (
    <div>
      <h4>How to Play</h4>
      <p>
        <strong>CYCLES</strong> is a two-player game of planar graphs on a 7×7 grid with 12 shared
        coins.
      </p>
      <h4>On your turn — do one</h4>
      <p>
        <strong>PLACE</strong> — drop a coin from the supply on any empty intersection; choose H or
        T.
      </p>
      <p>
        <strong>JOIN</strong> — draw an edge along a queen-line (row, column, or 45° diagonal)
        between two coins. The edge can&apos;t cross another edge or pass through another coin.
      </p>
      <h4>Flips</h4>
      <p>
        If your JOIN closes a cycle, every coin on or inside the enclosed region flips. Otherwise,
        the two endpoint coins flip.
      </p>
      <h4>End</h4>
      <p>Game ends when both players pass on consecutive turns. Most-showing face wins.</p>
    </div>
  );
}

function SheetControls() {
  return (
    <div>
      <h4>Controls</h4>
      <p>
        <strong>Tap empty dot</strong> — place a coin (H/T popup).
      </p>
      <p>
        <strong>Tap coin</strong> — select for JOIN; cyan rings show legal targets.
      </p>
      <p>
        <strong>Tap target</strong> — draw the edge.
      </p>
      <p>
        <strong>Tap same coin twice</strong> — cancel selection.
      </p>
      <h4>Cues</h4>
      <ul>
        <li>
          <span style={{ color: "var(--cyan)" }}>Cyan dot</span> — legal placement
        </li>
        <li>
          <span style={{ color: "var(--neon-magenta)" }}>Magenta ring</span> — selected
        </li>
        <li>
          <span style={{ color: "var(--cyan)" }}>Cyan ring</span> — legal target
        </li>
      </ul>
    </div>
  );
}

function SheetAbout() {
  return (
    <div>
      <h4>About CYCLES</h4>
      <p>A two-player planar-graph game invented by Percy Raskova.</p>
      <p>
        UI: <strong>orchid bisexual queercoded Win95 vaporwave</strong> — installed as a PWA.
      </p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          color: "var(--bi-magenta)",
          textAlign: "center",
          margin: "14px 0 4px",
        }}
      >
        ░▓ PROUDLY QUEERCODED ▓░
      </p>
      <p style={{ textAlign: "center", color: "var(--ink-mute)", fontSize: 11 }}>
        Add to Home Screen for the full experience.
      </p>
    </div>
  );
}
