import type { Move, Player } from "../../types";
import type { Agent } from "../types";

/**
 * Control handle for a {@link createDeferredAgent}: an external owner (the UI's
 * click handler, a future socket listener) resolves the currently-awaited turn via
 * `submit`, or rejects it via `fail`.
 */
export interface DeferredHandle {
  readonly agent: Agent;
  /** Resolve the awaited `selectMove` with `move`. No-op when nothing is awaiting. */
  submit(move: Move): void;
  /** Reject the awaited `selectMove` (e.g. a transport error). No-op when idle. */
  fail(error: Error): void;
}

interface PendingResolver {
  resolve(move: Move): void;
  reject(error: unknown): void;
}

/**
 * An {@link Agent} whose move arrives later through an external `submit` — the human
 * input channel (research R7) and the shape a future remote agent takes. Holds at
 * most one pending resolver (the driver asks one slot at a time) and no game state.
 */
export function createDeferredAgent(
  slot: Player,
  options?: { readonly maxIllegalRetries?: number },
): DeferredHandle {
  let pending: PendingResolver | null = null;

  const agent: Agent = {
    slot,
    maxIllegalRetries: options?.maxIllegalRetries ?? 1,
    selectMove(_session, signal) {
      return new Promise<Move>((resolve, reject) => {
        if (signal?.aborted) {
          reject(signal.reason);
          return;
        }
        const onAbort = (): void => {
          pending = null;
          reject(signal?.reason);
        };
        const clear = (): void => {
          signal?.removeEventListener("abort", onAbort);
          pending = null;
        };
        pending = {
          resolve(move) {
            clear();
            resolve(move);
          },
          reject(error) {
            clear();
            reject(error);
          },
        };
        signal?.addEventListener("abort", onAbort, { once: true });
      });
    },
  };

  return {
    agent,
    submit(move) {
      pending?.resolve(move);
    },
    fail(error) {
      pending?.reject(error);
    },
  };
}
