import { useEffect, useRef, useState } from "react";

type Panel = "help" | "controls" | "about" | "settings";

function HelpPanel() {
  return (
    <div className="modal-panel">
      <h3>How to Play</h3>
      <p>
        <strong>CYCLES</strong> is a two-player game of planar graphs, parity, and enclosure.
      </p>

      <h4>Components</h4>
      <ul>
        <li>A 7&#215;7 grid (49 intersections)</li>
        <li>12 coins in a shared supply</li>
        <li>
          Two players: <span className="heads-text">HEADS</span> and{" "}
          <span className="tails-text">TAILS</span>
        </li>
      </ul>

      <h4>On Your Turn</h4>
      <p>Do exactly one of the following:</p>

      <div className="rule-block">
        <h5>PLACE</h5>
        <p>
          Click any empty intersection. Choose <strong>H</strong> (heads) or <strong>T</strong>{" "}
          (tails). Either face is allowed regardless of which player you are.
        </p>
      </div>

      <div className="rule-block">
        <h5>JOIN</h5>
        <p>
          Click a coin to select it. All legal targets will glow. Click a glowing target to draw an
          edge. The edge must:
        </p>
        <ul>
          <li>Run along a queen-line (same row, column, or 45&#176; diagonal)</li>
          <li>Not cross any existing edge</li>
          <li>Not pass through another coin</li>
        </ul>
        <p>
          If the join <strong>closes a cycle</strong>, every coin inside and on the boundary flips.
          Otherwise, only the two endpoint coins flip.
        </p>
      </div>

      <h4>End of Game</h4>
      <p>
        The game ends when both players pass on consecutive turns (no legal moves remain). Count the
        coins: more heads = HEADS wins; more tails = TAILS wins.
      </p>

      <h4>Auto-Pass</h4>
      <p>
        If you have no legal moves, the game will pass for you automatically after a brief notice.
      </p>
    </div>
  );
}

function ControlsPanel() {
  return (
    <div className="modal-panel">
      <h3>Controls</h3>

      <table className="controls-table">
        <tbody>
          <tr>
            <td>
              <strong>Click empty dot</strong>
            </td>
            <td>Place a coin (choose H or T)</td>
          </tr>
          <tr>
            <td>
              <strong>Click coin</strong>
            </td>
            <td>Select it for a join</td>
          </tr>
          <tr>
            <td>
              <strong>Click glowing coin</strong>
            </td>
            <td>Join the two coins</td>
          </tr>
          <tr>
            <td>
              <strong>Click same coin twice</strong>
            </td>
            <td>Cancel join selection</td>
          </tr>
          <tr>
            <td>
              <strong>Escape</strong>
            </td>
            <td>Cancel face selector or join selection</td>
          </tr>
          <tr>
            <td>
              <strong>New Game</strong>
            </td>
            <td>Appears after game ends; resets the board</td>
          </tr>
        </tbody>
      </table>

      <h4>Visual Cues</h4>
      <ul>
        <li>
          <span style={{ color: "var(--cyan)" }}>Cyan dot</span> — legal placements
        </li>
        <li>
          <span style={{ color: "var(--neon-magenta)" }}>Magenta ring</span> — selected coin
        </li>
        <li>
          <span style={{ color: "var(--cyan)" }}>Cyan ring</span> — legal join targets
        </li>
        <li>
          <span style={{ color: "var(--neon-magenta)" }}>Dashed line</span> — join preview on hover
        </li>
      </ul>
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="modal-panel">
      <h3>About CYCLES</h3>
      <div className="about-content">
        <p className="about-shout">BEHOLD!!!</p>
        <p>
          This game was <strong>INVENTED</strong> by the one and only <strong>Percy Raskova</strong>{" "}
          as a hobby project — and it was built almost entirely by <em>yelling at a computer</em>{" "}
          until the computer understood planar graphs.
        </p>
        <p>
          That&apos;s right. This whole thing was <strong>VIBECODED INTO EXISTENCE</strong>. Every
          coin. Every edge. Every queen-line collision. All of it. Generated. By. AI. Under the
          patient (and occasionally frantic) direction of a human who just wanted to flip some coins
          on a grid.
        </p>
        <p className="about-shout">PROUDLY GENERATED. PROUDLY VIBECODED.</p>
        <p>
          The rules? Also vibe-derived. The engine? Vibe-tested. The UI? You guessed it — a vibe. If
          you find a bug, it is a <em>feature of the vibe</em>. If you find a feature, it is a{" "}
          <em>vibe of the bug</em>.
        </p>
        <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", opacity: 0.7 }}>
          Repository:{" "}
          <a href="https://codeberg.org/percy-raskova/cycles" target="_blank" rel="noreferrer">
            codeberg.org/percy-raskova/cycles
          </a>
          <br />
          Deployed on Cloudflare Pages because vibes belong at the edge.
        </p>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [showHints, setShowHints] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  return (
    <div className="modal-panel">
      <h3>Settings</h3>

      <div className="setting-row">
        <label htmlFor="show-hints">
          <input
            id="show-hints"
            type="checkbox"
            checked={showHints}
            onChange={(e) => setShowHints(e.target.checked)}
          />
          Show placement hints (cyan dots)
        </label>
      </div>

      <div className="setting-row">
        <label htmlFor="sound-enabled">
          <input
            id="sound-enabled"
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
          />
          Sound effects (placeholder — not yet implemented)
        </label>
      </div>

      <p className="settings-note">
        Settings are session-only for now. Persistent preferences coming in a future vibe session.
      </p>
    </div>
  );
}

interface ModalProps {
  readonly initialPanel: Panel;
  readonly onClose: () => void;
}

export function Modal({ initialPanel, onClose }: ModalProps) {
  const [activePanel, setActivePanel] = useState<Panel>(initialPanel);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        onClose();
      }
    };

    dialog.addEventListener("click", handleClick);
    return () => dialog.removeEventListener("click", handleClick);
  }, [onClose]);

  const panels: { readonly key: Panel; readonly label: string }[] = [
    { key: "help", label: "Help" },
    { key: "controls", label: "Controls" },
    { key: "about", label: "About" },
    { key: "settings", label: "Settings" },
  ];

  const activeLabel = panels.find((p) => p.key === activePanel)?.label ?? "";

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog"
      onCancel={onClose}
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content">
        {/* Win95 title bar */}
        <div className="modal-title-bar">
          <div className="title-bar-left">
            <span className="title-icon">?</span>
            <span id="modal-title" className="title-text">
              {activeLabel}
            </span>
          </div>
          <div className="title-buttons">
            <button
              type="button"
              className="title-btn danger"
              onClick={onClose}
              aria-label={`Close ${activeLabel} dialog`}
            >
              &#215;
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="modal-tabs" role="tablist">
          {panels.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={activePanel === p.key}
              className={activePanel === p.key ? "modal-tab active" : "modal-tab"}
              onClick={() => setActivePanel(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body">
          {activePanel === "help" && <HelpPanel />}
          {activePanel === "controls" && <ControlsPanel />}
          {activePanel === "about" && <AboutPanel />}
          {activePanel === "settings" && <SettingsPanel />}
        </div>
      </div>
    </dialog>
  );
}
