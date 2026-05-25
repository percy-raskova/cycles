interface MobileTitleBarProps {
  readonly onMenuOpen: () => void;
  readonly onHelpOpen: () => void;
}

export function MobileTitleBar({ onMenuOpen, onHelpOpen }: MobileTitleBarProps) {
  return (
    <header className="m-titlebar">
      <button type="button" className="m-iconbtn" onClick={onMenuOpen} aria-label="Open menu">
        ☰
      </button>
      <span className="title">CYCLES</span>
      <button type="button" className="m-iconbtn" onClick={onHelpOpen} aria-label="Help">
        ?
      </button>
    </header>
  );
}
