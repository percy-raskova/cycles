interface MobileToolbarProps {
  readonly isJoining: boolean;
  readonly canPass: boolean;
  readonly canUndo: boolean;
  readonly onTapMode: () => void;
  readonly onPass: () => void;
  readonly onUndo: () => void;
  readonly onLogOpen: () => void;
}

export function MobileToolbar({
  isJoining,
  canPass,
  canUndo,
  onTapMode,
  onPass,
  onUndo,
  onLogOpen,
}: MobileToolbarProps) {
  return (
    <div className="m-toolbar" role="toolbar">
      <button
        type="button"
        className={`btn ${isJoining ? "pressed" : ""}`}
        onClick={onTapMode}
        aria-pressed={isJoining}
      >
        <span className="glyph">◇</span>
        <span>Tap</span>
      </button>
      <button type="button" className="btn" onClick={onPass} disabled={!canPass}>
        <span className="glyph">↷</span>
        <span>Pass</span>
      </button>
      <button type="button" className="btn" onClick={onUndo} disabled={!canUndo}>
        <span className="glyph">↶</span>
        <span>Undo</span>
      </button>
      <button type="button" className="btn" onClick={onLogOpen}>
        <span className="glyph">▶</span>
        <span>Log</span>
      </button>
    </div>
  );
}
