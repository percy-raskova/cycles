import type { Player } from "@core";
import { useState } from "react";
import type { GameSetupOptions } from "../types/setup";
import { Button } from "./Button";
import "./SetupScreen.css";

export interface SetupScreenProps {
  readonly onStart: (options: GameSetupOptions) => void;
}

type OpponentType = GameSetupOptions["opponent"];

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [opponent, setOpponent] = useState<OpponentType>("human");
  const [playerRole, setPlayerRole] = useState<Player>("HEADS");
  const [humanFirst, setHumanFirst] = useState(true);

  const handleStart = () => {
    onStart({ opponent, playerRole, humanFirst });
  };

  const isBot = opponent !== "human";

  return (
    <div className="setup-screen" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <div className="setup-card">
        <h2 id="setup-title" className="setup-title">
          New Game
        </h2>

        <fieldset className="setup-fieldset">
          <legend className="setup-legend">Opponent</legend>
          <div className="setup-options" role="radiogroup" aria-label="Select opponent">
            <button
              type="button"
              role="radio"
              aria-checked={opponent === "human"}
              className={`setup-option ${opponent === "human" ? "setup-option--selected" : ""}`}
              onClick={() => setOpponent("human")}
              aria-label="Human opponent"
            >
              <span className="setup-option-icon" aria-hidden="true">
                &#9823;
              </span>
              <span className="setup-option-label">Human</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={opponent === "random"}
              className={`setup-option ${opponent === "random" ? "setup-option--selected" : ""}`}
              onClick={() => setOpponent("random")}
              aria-label="Random bot opponent"
            >
              <span className="setup-option-icon" aria-hidden="true">
                &#9856;
              </span>
              <span className="setup-option-label">Random</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={opponent === "greedy"}
              className={`setup-option ${opponent === "greedy" ? "setup-option--selected" : ""}`}
              onClick={() => setOpponent("greedy")}
              aria-label="Greedy bot opponent"
            >
              <span className="setup-option-icon" aria-hidden="true">
                &#9820;
              </span>
              <span className="setup-option-label">Greedy</span>
            </button>
          </div>
        </fieldset>

        {isBot && (
          <fieldset className="setup-fieldset">
            <legend className="setup-legend">Your Role</legend>
            <div className="setup-options" role="radiogroup" aria-label="Select your role">
              <button
                type="button"
                role="radio"
                aria-checked={playerRole === "HEADS" && humanFirst}
                className={`setup-option ${playerRole === "HEADS" && humanFirst ? "setup-option--selected" : ""}`}
                onClick={() => {
                  setPlayerRole("HEADS");
                  setHumanFirst(true);
                }}
                aria-label="Play as Player 1 Heads"
              >
                <span className="setup-option-icon" aria-hidden="true">
                  &#9824;
                </span>
                <span className="setup-option-label">P1 HEADS</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={playerRole === "TAILS" && !humanFirst}
                className={`setup-option ${playerRole === "TAILS" && !humanFirst ? "setup-option--selected" : ""}`}
                onClick={() => {
                  setPlayerRole("TAILS");
                  setHumanFirst(false);
                }}
                aria-label="Play as Player 2 Tails"
              >
                <span className="setup-option-icon" aria-hidden="true">
                  &#9827;
                </span>
                <span className="setup-option-label">P2 TAILS</span>
              </button>
            </div>
          </fieldset>
        )}

        <div className="setup-actions">
          <Button variant="primary" onClick={handleStart} aria-label="Start game">
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
}
