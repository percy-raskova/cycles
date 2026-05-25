interface StatusBarProps {
  readonly player: string;
  readonly coinsRemaining: number;
  readonly edges: number;
  readonly cycles: number;
  readonly vibe: string;
}

export function StatusBar({ player, coinsRemaining, edges, cycles, vibe }: StatusBarProps) {
  return (
    <div className="status-bar">
      <span className="status-cell">READY</span>
      <span className="status-cell">{player} to move</span>
      <span className="status-cell">{coinsRemaining} / 12 in supply</span>
      <span className="status-cell">{edges} edges</span>
      <span className="status-cell">{cycles} cycles closed</span>
      <span className="status-cell status-grow" aria-live="polite">
        C:\CYCLES&gt; {vibe || "awaiting input"}
        <span className="caret" />
      </span>
    </div>
  );
}
