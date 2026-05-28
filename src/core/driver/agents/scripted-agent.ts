import type { Move, Player } from "../../types";
import { type Agent, DriverError } from "../types";

/**
 * An {@link Agent} that plays a fixed list of moves in order — for deterministic
 * headless tests and replay (FR-012). Totally deterministic; no randomness, no clock.
 * Advancing past the end rejects with a {@link DriverError}: a scripted game must
 * supply enough moves to reach terminal (or be paired with a partner that ends it).
 */
export function createScriptedAgent(slot: Player, moves: readonly Move[]): Agent {
  let index = 0;
  return {
    slot,
    maxIllegalRetries: 1,
    selectMove() {
      const move = moves[index];
      if (move === undefined) {
        return Promise.reject(
          new DriverError(
            `ScriptedAgent(${slot}) exhausted its ${moves.length}-move list before reaching a terminal state`,
            "max-moves-exceeded",
          ),
        );
      }
      index += 1;
      return Promise.resolve(move);
    },
  };
}
