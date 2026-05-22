import type { Coin } from "@core/types";
import { COIN_RADIUS } from "@ui/lib/constants";
import { positionToSvg } from "@ui/lib/coordinates";

interface CoinViewProps {
  readonly coin: Coin;
}

export function CoinView({ coin }: CoinViewProps) {
  const { x, y } = positionToSvg(coin.position);
  const label = coin.face === "heads" ? "H" : "T";
  const fill = coin.face === "heads" ? "#FFB6E6" : "#B6E6FF";
  const stroke = coin.face === "heads" ? "#FF1493" : "#00BFFF";

  return (
    <g data-testid={`coin-${coin.position.row}-${coin.position.col}`}>
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
      >
        {label}
      </text>
    </g>
  );
}
