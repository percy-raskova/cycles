import type { Coin, Position } from "@core/types";
import { COIN_RADIUS } from "@ui/lib/constants";
import { positionToSvg } from "@ui/lib/coordinates";
import React from "react";

interface CoinViewProps {
  readonly coin: Coin;
  readonly onClick?: ((position: Position) => void) | undefined;
  readonly onHover?: ((position: Position | null) => void) | undefined;
  readonly isSelected: boolean;
  readonly isHighlighted: boolean;
  readonly isIllegal: boolean;
}

function buildClassName(isSelected: boolean, isHighlighted: boolean, isIllegal: boolean): string {
  const parts: string[] = ["coin-group"];
  if (isSelected) {
    parts.push("selected");
    parts.push("coin-selected");
  } else if (isHighlighted) {
    parts.push("target");
    parts.push("coin-highlighted");
  }
  if (isIllegal) {
    parts.push("illegal");
    parts.push("coin-illegal");
  }
  return parts.join(" ");
}

function CoinViewImpl({
  coin,
  onClick,
  onHover,
  isSelected,
  isHighlighted,
  isIllegal,
}: CoinViewProps) {
  const { x, y } = positionToSvg(coin.position);
  const label = coin.face === "heads" ? "H" : "T";
  const bodyClass = `coin-body ${coin.face}`;
  const className = buildClassName(isSelected, isHighlighted, isIllegal);

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
      onMouseEnter={onHover ? () => onHover(coin.position) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      role={onClick ? "button" : undefined}
      aria-label={
        onClick
          ? `${coin.face} coin at row ${coin.position.row}, column ${coin.position.col}`
          : undefined
      }
      tabIndex={onClick ? 0 : undefined}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <circle
        cx={x}
        cy={y}
        r={COIN_RADIUS}
        className={bodyClass}
        fill={coin.face === "heads" ? "var(--color-coin-heads)" : "var(--color-coin-tails)"}
        stroke={
          coin.face === "heads"
            ? "var(--color-coin-heads-stroke)"
            : "var(--color-coin-tails-stroke)"
        }
        strokeWidth={2}
      />
      <ellipse cx={x - 6} cy={y - 8} rx="8" ry="4" className="coin-shine" />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-text-primary)"
        fontSize={24}
        fontFamily="var(--font-body), system-ui, sans-serif"
        fontWeight="bold"
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

export const CoinView = React.memo(CoinViewImpl);
