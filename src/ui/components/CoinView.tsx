import type { Coin, Position } from "@core/types";
import { COIN_RADIUS } from "@ui/lib/constants";
import { positionToSvg } from "@ui/lib/coordinates";

interface CoinViewProps {
  readonly coin: Coin;
  readonly onClick?: ((position: Position) => void) | undefined;
  readonly isSelected: boolean;
  readonly isHighlighted: boolean;
  readonly isFlipping: boolean;
}

export function CoinView({ coin, onClick, isSelected, isHighlighted, isFlipping }: CoinViewProps) {
  const { x, y } = positionToSvg(coin.position);
  const label = coin.face === "heads" ? "H" : "T";
  const fill = coin.face === "heads" ? "#FFB6E6" : "#B6E6FF";
  const stroke = coin.face === "heads" ? "#FF1493" : "#00BFFF";

  let className = "";
  if (isSelected) className = "coin-selected";
  else if (isHighlighted) className = "coin-highlighted";
  if (isFlipping) className += className ? " coin-flipping" : "coin-flipping";

  function handleClick() {
    onClick?.(coin.position);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.(coin.position);
    }
  }

  return (
    <g
      data-testid={`coin-${coin.position.row}-${coin.position.col}`}
      className={className || undefined}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <circle cx={x} cy={y} r={COIN_RADIUS} fill={fill} stroke={stroke} strokeWidth={2} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#4A0E4A"
        fontSize={24}
        fontFamily="system-ui, sans-serif"
        fontWeight="bold"
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
    </g>
  );
}
