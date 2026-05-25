interface DrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onAction: (action: string) => void;
}

export function Drawer({ open, onClose, onAction }: DrawerProps) {
  if (!open) return null;

  const items = [
    { key: "new", glyph: "◆", label: "New Game" },
    { key: "undo", glyph: "↶", label: "Undo Move" },
    { key: "pass", glyph: "↷", label: "Pass Turn" },
    { key: "rules", glyph: "?", label: "How to Play" },
    { key: "controls", glyph: "⌨", label: "Controls" },
    { key: "log", glyph: "▶", label: "Activity Log" },
    { key: "about", glyph: "★", label: "About" },
  ];

  return (
    <div
      className="m-drawer-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <dialog className="m-drawer" aria-modal="true" aria-labelledby="drawer-title">
        <div className="head">
          <span id="drawer-title">CYCLES</span>
          <button type="button" className="m-iconbtn" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <div className="items">
          {items.slice(0, 3).map((item) => (
            <button
              key={item.key}
              type="button"
              className="m-drawer-item"
              onClick={() => onAction(item.key)}
            >
              <span className="glyph">{item.glyph}</span>
              {item.label}
            </button>
          ))}
          <div
            style={{
              margin: "8px 12px",
              borderTop: "1px solid var(--chrome-shadow)",
              borderBottom: "1px solid var(--chrome-light)",
            }}
          />
          {items.slice(3).map((item) => (
            <button
              key={item.key}
              type="button"
              className="m-drawer-item"
              onClick={() => onAction(item.key)}
            >
              <span className="glyph">{item.glyph}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="foot">░▒▓ v1.0 · QUEERCODED ▓▒░</div>
      </dialog>
    </div>
  );
}
