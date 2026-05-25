interface MobileSupplyStripProps {
  readonly coinsRemaining: number;
}

export function MobileSupplyStrip({ coinsRemaining }: MobileSupplyStripProps) {
  const spent = 12 - coinsRemaining;
  return (
    <div className="m-supply" role="img" aria-label={`${coinsRemaining} of 12 coins in supply`}>
      {Array.from({ length: 12 }, (_, i) => {
        // biome-ignore lint/suspicious/noArrayIndexKey: pips are static presentational
        return <div key={`pip-${i}`} className={`pip ${i < spent ? "spent" : ""}`} />;
      })}
    </div>
  );
}
