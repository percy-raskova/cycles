interface MenuBarProps {
  readonly onOpenHelp: () => void;
  readonly onOpenSettings: () => void;
}

export function MenuBar({ onOpenHelp, onOpenSettings }: MenuBarProps) {
  return (
    <div className="menu-bar">
      <div className="menu-bar-left">
        <span className="menu-title">CYCLES</span>
      </div>
      <div className="menu-bar-right">
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
