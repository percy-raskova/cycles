import type { Coin, GameState, Position } from "@core";
import { positionKey } from "@core";
import { forwardRef } from "react";

const M_CELL = 80;
const M_MARGIN = 36;
const M_GRID = 7;
const M_VIEWBOX = M_MARGIN * 2 + (M_GRID - 1) * M_CELL;

function mSvgFor(p: Position) {
  return { x: M_MARGIN + p.col * M_CELL, y: M_MARGIN + p.row * M_CELL };
}

interface MobileBoardProps {
  readonly state: GameState;
  readonly legalPlacements: ReadonlySet<string>;
  readonly selectedCoin: Position | null;
  readonly highlightedCoins: ReadonlySet<string>;
  readonly previewEdge: { readonly from: Position; readonly to: Position } | null;
  readonly illegalMoveCoin: Position | null;
  readonly onIntersectionClick: (position: Position) => void;
  readonly onCoinClick: (position: Position) => void;
}

export const MobileBoard = forwardRef<SVGSVGElement, MobileBoardProps>(function MobileBoard(
  {
    state,
    legalPlacements,
    selectedCoin,
    highlightedCoins,
    previewEdge,
    illegalMoveCoin,
    onIntersectionClick,
    onCoinClick,
  },
  ref,
) {
  const max = M_MARGIN + (M_GRID - 1) * M_CELL;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${M_VIEWBOX} ${M_VIEWBOX}`}
      className="m-board-svg"
      role="img"
      aria-label="CYCLES game board"
    >
      <defs>
        <radialGradient id="mBoardGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff39d4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ff39d4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={M_VIEWBOX} height={M_VIEWBOX} fill="url(#mBoardGlow)" />

      {/* Diagonals subtle */}
      <g opacity="0.18">
        <line
          x1={M_MARGIN}
          y1={M_MARGIN}
          x2={max}
          y2={max}
          stroke="var(--cyan)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        <line
          x1={max}
          y1={M_MARGIN}
          x2={M_MARGIN}
          y2={max}
          stroke="var(--cyan)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      </g>

      {/* Grid lines */}
      {Array.from({ length: M_GRID }, (_, i) => {
        const v = M_MARGIN + i * M_CELL;
        const major = i === 0 || i === M_GRID - 1;
        return (
          <g key={`grid-${i}`}>
            <line
              x1={M_MARGIN}
              y1={v}
              x2={max}
              y2={v}
              className={`gridline ${major ? "major" : ""}`}
            />
            <line
              x1={v}
              y1={M_MARGIN}
              x2={v}
              y2={max}
              className={`gridline ${major ? "major" : ""}`}
            />
          </g>
        );
      })}

      {/* Edges */}
      {state.edges.map((edge, i) => {
        const a = mSvgFor(edge.from);
        const b = mSvgFor(edge.to);
        return <line key={`edge-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="edge" />;
      })}

      {/* Preview edge */}
      {previewEdge &&
        (() => {
          const a = mSvgFor(previewEdge.from);
          const b = mSvgFor(previewEdge.to);
          return (
            <line key="preview" x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="edge preview" />
          );
        })()}

      {/* Intersection dots (empty) */}
      {Array.from({ length: M_GRID * M_GRID }, (_, i) => {
        const row = Math.floor(i / M_GRID);
        const col = i % M_GRID;
        const k = `${row},${col}`;
        if (state.coins.has(k)) return null;
        const { x, y } = mSvgFor({ row, col });
        const isLegal = legalPlacements.has(k);
        const r = isLegal ? 8 : 4;
        return (
          <g
            key={k}
            onClick={() => onIntersectionClick({ row, col })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onIntersectionClick({ row, col });
            }}
            role="button"
            tabIndex={0}
            aria-label={`Intersection r${row + 1} c${col + 1}${isLegal ? " (legal placement)" : ""}`}
          >
            <rect className="touch" x={x - 42} y={y - 42} width="84" height="84" />
            <circle cx={x} cy={y} r={r} className={`dot ${isLegal ? "legal" : ""}`} />
          </g>
        );
      })}

      {/* Coins */}
      {[...state.coins.values()].map((c) => (
        <MobileCoin
          key={positionKey(c.position)}
          coin={c}
          selectedCoin={selectedCoin}
          highlightedCoins={highlightedCoins}
          illegalMoveCoin={illegalMoveCoin}
          onCoinClick={onCoinClick}
        />
      ))}
    </svg>
  );
});

interface MobileCoinProps {
  readonly coin: Coin;
  readonly selectedCoin: Position | null;
  readonly highlightedCoins: ReadonlySet<string>;
  readonly illegalMoveCoin: Position | null;
  readonly onCoinClick: (position: Position) => void;
}

function MobileCoin({
  coin,
  selectedCoin,
  highlightedCoins,
  illegalMoveCoin,
  onCoinClick,
}: MobileCoinProps) {
  const { row, col } = coin.position;
  const { x, y } = mSvgFor({ row, col });
  const k = `${row},${col}`;
  const sel = selectedCoin && selectedCoin.row === row && selectedCoin.col === col;
  const tgt = highlightedCoins.has(k);
  const ill = illegalMoveCoin && illegalMoveCoin.row === row && illegalMoveCoin.col === col;
  const cls = (sel ? "selected " : "") + (tgt ? "target " : "") + (ill ? "illegal " : "");
  return (
    <g
      key={k}
      className={cls}
      onClick={(e) => {
        e.stopPropagation();
        onCoinClick({ row, col });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onCoinClick({ row, col });
      }}
      role="button"
      tabIndex={0}
      aria-label={`${coin.face === "heads" ? "Heads" : "Tails"} coin at r${row + 1} c${col + 1}`}
    >
      <rect className="touch" x={x - 30} y={y - 30} width="60" height="60" />
      <circle
        cx={x}
        cy={y}
        r="24"
        className={`coin-body ${coin.face === "heads" ? "heads" : "tails"}`}
      />
      <ellipse cx={x - 6} cy={y - 9} rx="9" ry="4.5" className="coin-shine" />
      <text x={x} y={y + 1} className="coin-text">
        {coin.face === "heads" ? "H" : "T"}
      </text>
    </g>
  );
}
