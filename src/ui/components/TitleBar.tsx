interface TitleBarProps {
  readonly onClose?: () => void;
}

export function TitleBar({ onClose }: TitleBarProps) {
  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <span className="title-icon">&#9678;</span>
        <span className="title-text">CYCLES.EXE — A Planar Graph Strategy Game</span>
      </div>
      <div className="title-buttons">
        <button
          type="button"
          className="title-btn"
          title="Minimize"
          aria-label="Minimize"
          tabIndex={-1}
          onClick={() => {
            /* no-op: decorative */
          }}
        >
          _
        </button>
        <button
          type="button"
          className="title-btn"
          title="Maximize"
          aria-label="Maximize"
          tabIndex={-1}
          onClick={() => {
            /* no-op: decorative */
          }}
        >
          &#9634;
        </button>
        <button
          type="button"
          className="title-btn danger"
          title="Close"
          aria-label="Close"
          tabIndex={-1}
          onClick={
            onClose ??
            (() => {
              /* no-op: decorative on main window */
            })
          }
        >
          &#215;
        </button>
      </div>
    </div>
  );
}
