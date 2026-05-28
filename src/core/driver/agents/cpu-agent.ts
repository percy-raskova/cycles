import type { BotFunction } from "../../bots/index";
import type { Player } from "../../types";
import type { Agent } from "../types";

export interface CpuAgentOptions {
  /**
   * Optional pre-move pacing injected at the UI boundary so the engine stays
   * timing-free (research R6). The UI supplies `(s) => delay(2000, s)`; headless
   * callers omit it for instant play. Must reject if `signal` aborts.
   */
  readonly think?: (signal: AbortSignal | undefined) => Promise<void>;
}

/**
 * Wraps an existing synchronous {@link BotFunction} as an {@link Agent} (FR-009).
 * Returns exactly what the wrapped bot returns — bot decision logic is unchanged.
 * Pure when `think` is omitted; `maxIllegalRetries` is 1 (a bot's illegal move is a bug).
 */
export function createCpuAgent(slot: Player, bot: BotFunction, options?: CpuAgentOptions): Agent {
  return {
    slot,
    maxIllegalRetries: 1,
    async selectMove(session, signal) {
      await options?.think?.(signal);
      signal?.throwIfAborted();
      return bot(session.state);
    },
  };
}
