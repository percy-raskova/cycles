interface ToolbarProps {
  readonly onUndo: () => void;
  readonly onReset: () => void;
  readonly canUndo: boolean;
  readonly onHelp: (panel: "help" | "about") => void;
  readonly onPass: () => void;
  readonly canPass: boolean;
}

export function Toolbar({ onUndo, onReset, canUndo, onHelp, onPass, canPass }: ToolbarProps) {
  return (
    <div className="toolbar" role="toolbar">
      <button type="button" className="tool-btn" onClick={onReset}>
        <span className="tool-icon">&#9670;</span> New Game
      </button>
      <button type="button" className="tool-btn" onClick={onUndo} disabled={!canUndo}>
        <span className="tool-icon">&#8630;</span> Undo
      </button>
      <button type="button" className="tool-btn" onClick={onPass} disabled={!canPass}>
        <span className="tool-icon">&#8631;</span> Pass Turn
      </button>
      <span className="tool-sep" />
      <button type="button" className="tool-btn" onClick={() => onHelp("help")}>
        <span className="tool-icon">?</span> How to Play
      </button>
      <button type="button" className="tool-btn" onClick={() => onHelp("about")}>
        <span className="tool-icon">&#9733;</span> About
      </button>
      <span className="tool-sep" />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          color: "var(--ink-on-chrome)",
          marginLeft: 4,
        }}
      >
        &#9617;&#9618;&#9617; <span style={{ color: "var(--bi-magenta)" }}>QUEER</span>&#183;
        <span style={{ color: "var(--bi-purple)" }}>CODED</span>&#183;
        <span style={{ color: "var(--bi-blue)" }}>PLANAR</span> &#9617;&#9618;&#9617;
      </span>
    </div>
  );
}
