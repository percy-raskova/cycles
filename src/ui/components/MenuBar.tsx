import { ResetButton } from "./ResetButton";
import { UndoButton } from "./UndoButton";

interface MenuBarProps {
  readonly onOpenHelp: () => void;
  readonly onOpenSettings: () => void;
  readonly onReset: () => void;
  readonly onUndo: () => void;
  readonly canUndo: boolean;
}

export function MenuBar({ onOpenHelp, onOpenSettings, onReset, onUndo, canUndo }: MenuBarProps) {
  return (
    <div className="menu-bar" role="banner">
      <div className="menu-bar-left">
        <span className="menu-title">CYCLES</span>
        <a
          href="https://codeberg.org/percy-raskova/cycles"
          target="_blank"
          rel="noopener noreferrer"
          className="menu-repo-link"
          aria-label="View source code on Codeberg"
        >
          Source Code
        </a>
      </div>
      <div className="menu-bar-right">
        <ResetButton onClick={onReset} />
        <UndoButton onClick={onUndo} disabled={!canUndo} />
        <button
          type="button"
          className="menu-btn"
          onClick={onOpenHelp}
          title="Help"
          aria-label="Open help"
        >
          ?
        </button>
        <button
          type="button"
          className="menu-btn"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Open settings"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
