import type { Coin, Position } from "@core/types";
import { COIN_RADIUS } from "@ui/lib/constants";
import { positionToSvg } from "@ui/lib/coordinates";

interface CoinViewProps {
  readonly coin: Coin;
  readonly onClick?: ((position: Position) => void) | undefined;
  readonly isSelected: boolean;
  readonly isHighlighted: boolean;
  readonly isFlipping: boolean;
  readonly isIllegal: boolean;
}

function buildClassName(
  isSelected: boolean,
  isHighlighted: boolean,
  isFlipping: boolean,
  isIllegal: boolean,
): string {
  const parts: string[] = [];
  if (isSelected) parts.push("coin-selected");
  else if (isHighlighted) parts.push("coin-highlighted");
  if (isFlipping) parts.push("coin-flipping");
  if (isIllegal) parts.push("coin-illegal");
  return parts.join(" ");
}

export function CoinView({
  coin,
  onClick,
  isSelected,
  isHighlighted,
  isFlipping,
  isIllegal,
}: CoinViewProps) {
  const { x, y } = positionToSvg(coin.position);
  const label = coin.face === "heads" ? "H" : "T";
  const fill = coin.face === "heads" ? "#FFB6E6" : "#B6E6FF";
  const stroke = coin.face === "heads" ? "#FF1493" : "#00BFFF";
  const className = buildClassName(isSelected, isHighlighted, isFlipping, isIllegal);

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
