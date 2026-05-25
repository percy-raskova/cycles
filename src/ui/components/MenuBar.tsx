import { ResetButton } from "./ResetButton";
import { UndoButton } from "./UndoButton";

interface MenuBarProps {
  readonly onOpenHelp: () => void;
  readonly onOpenSettings: () => void;
  readonly onReset?: () => void;
  readonly onUndo?: () => void;
  readonly canUndo?: boolean;
  readonly onOpenControls?: () => void;
  readonly onOpenAbout?: () => void;
  readonly legacyMode?: boolean;
}

export function MenuBar({
  onOpenHelp,
  onOpenSettings,
  onReset,
  onUndo,
  canUndo = false,
  legacyMode = true,
}: MenuBarProps) {
  const items = [
    {
      key: "file",
      label: (
        <>
          <u>F</u>ile
        </>
      ),
      panel: "file" as const,
    },
    {
      key: "edit",
      label: (
        <>
          <u>E</u>dit
        </>
      ),
      panel: "edit" as const,
    },
    {
      key: "view",
      label: (
        <>
          <u>V</u>iew
        </>
      ),
      panel: "view" as const,
    },
    {
      key: "game",
      label: (
        <>
          <u>G</u>ame
        </>
      ),
      panel: "game" as const,
    },
    {
      key: "help",
      label: (
        <>
          <u>H</u>elp
        </>
      ),
      panel: "help" as const,
    },
  ];

  function handleClick(panel: string) {
    switch (panel) {
      case "help":
        onOpenHelp();
        break;
      default:
        onOpenSettings();
        break;
    }
  }

  return (
    <div className="menu-bar">
      <div role="menubar">
        {items.map((it) => (
          <button
            type="button"
            role="menuitem"
            className="menu-item"
            key={it.key}
            tabIndex={-1}
            onClick={() => handleClick(it.panel)}
          >
            {it.label}
          </button>
        ))}
        <span className="menu-spacer" />
        <span className="menu-rhs">
          <span className="led" /> CYCLES v1.0
        </span>
      </div>
      {/* Legacy controls for backward compatibility with existing component tests */}
      {legacyMode && onReset && <ResetButton onClick={onReset} />}
      {legacyMode && onUndo && <UndoButton onClick={onUndo} disabled={!canUndo} />}
      {legacyMode && (
        <button
          type="button"
          className="menu-btn"
          onClick={onOpenHelp}
          title="Help"
          aria-label="Open help"
        >
          ?
        </button>
      )}
      {legacyMode && (
        <button
          type="button"
          className="menu-btn"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Open settings"
        >
          &#9881;
        </button>
      )}
    </div>
  );
}
