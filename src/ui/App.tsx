import { createInitialState, placeCoin } from "@core";
import { useState } from "react";

function App() {
  const [game, setGame] = useState(() => createInitialState());

  const handlePlace = (row: number, col: number) => {
    const key = `${row},${col}`;
    if (game.coins.has(key)) return;
    if (game.coinsRemaining <= 0) return;
    setGame((prev) => placeCoin(prev, { row, col }, "heads"));
  };

  return (
    <div className="app">
      <h1>CYCLES</h1>
      <div className="board">
        {Array.from({ length: 7 }, (_, row) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static 7x7 grid, indices are stable
          <div key={row} className="row">
            {Array.from({ length: 7 }, (_, col) => {
              const key = `${row},${col}`;
              const coin = game.coins.get(key);
              return (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: static 7x7 grid, indices are stable
                  key={col}
                  className={`cell ${coin ? `coin-${coin.face}` : ""}`}
                  onClick={() => handlePlace(row, col)}
                  type="button"
                >
                  {coin ? (coin.face === "heads" ? "H" : "T") : ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p>Current player: {game.currentPlayer}</p>
      <p>Coins remaining: {game.coinsRemaining}</p>
    </div>
  );
}

export default App;
