import type { FinalScore } from "@core";

interface GameOverPanelProps {
  readonly score: FinalScore;
  readonly onNewGame: () => void;
}

export function GameOverPanel({ score, onNewGame }: GameOverPanelProps) {
  return (
    <div data-testid="game-over-panel" className="game-over-panel">
      <h2>Game Over</h2>
      <div className="game-over-score">
        <span data-testid="game-over-heads" className="game-over-score-heads">
          HEADS: {score.heads}
        </span>
        <span data-testid="game-over-tails" className="game-over-score-tails">
          TAILS: {score.tails}
        </span>
      </div>
      <div data-testid="game-over-winner" className="game-over-winner">
        {score.winner === "draw" ? "It's a draw!" : `${score.winner} wins!`}
      </div>
      <button data-testid="game-over-new-game" type="button" onClick={onNewGame}>
        New Game
      </button>
    </div>
  );
}
