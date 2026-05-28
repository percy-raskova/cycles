import type { FinalScore, GameSession } from "../session";
import type { Move, Player } from "../types";

/**
 * Safety bound on the number of moves `driveGame` will apply before failing loud
 * (FR-014). A legal CYCLES game is far shorter (12 coins, bounded joins), so this
 * is purely a guard against a non-terminating agent pair, not a normal limit.
 */
export const MAX_MOVES = 200;

export type DriverErrorCode = "illegal-move-limit" | "max-moves-exceeded" | "bad-agents";

/**
 * A driver-level failure with an explicit, enumerated cause (no generic catch-all,
 * per the project error-handling rule). Cancellation is intentionally NOT a
 * `DriverError`: an aborted run rejects with the standard `AbortError` so callers
 * can distinguish "the user cancelled" from "the game logic failed".
 */
export class DriverError extends Error {
  readonly code: DriverErrorCode;

  constructor(message: string, code: DriverErrorCode) {
    super(message);
    this.name = "DriverError";
    this.code = code;
  }
}

/**
 * The single move-source abstraction (research R1): it binds a board slot to an
 * asynchronous move producer, decoupling "whose turn is it" (the engine's
 * `currentPlayer`) from "where the move comes from". Implemented by the in-core
 * CPU/deferred/scripted agents and by any future remote/MCP agent with no driver
 * change required (FR-010).
 */
export interface Agent {
  /** The slot this agent plays. Reuses the existing engine type ("HEADS" | "TAILS"). */
  readonly slot: Player;

  /**
   * Produce this slot's next move for `session`. May resolve immediately (CPU /
   * scripted) or after awaiting external input (human / remote). MUST reject if
   * `signal` aborts, and MUST NOT mutate `session`. Only ever called when it is
   * this slot's turn and the slot has at least one legal move (forced passes are
   * driver-owned — FR-004).
   */
  selectMove(session: GameSession, signal?: AbortSignal): Promise<Move>;

  /**
   * Maximum consecutive engine-rejected moves the driver tolerates from this agent
   * before failing loud. Defaults to 1 when omitted — a programmatic agent that
   * returns an illegal move is a bug, so it fails fast.
   */
  readonly maxIllegalRetries?: number;
}

/**
 * Optional pacing injected at an embedder boundary so the engine stays timing-free
 * (research R6). The UI supplies a real delay; headless callers omit it.
 */
export interface DriverHooks {
  /** Awaited before the driver applies a forced PASS (e.g. the UI shows a 1s notice). */
  readonly beforeForcedPass?: (
    slot: Player,
    signal: AbortSignal | undefined,
  ) => void | Promise<void>;
}

export interface GameDriverOptions {
  /** Starting session — usually `createSession({ firstPlayer })`. */
  readonly initialSession: GameSession;
  /** Exactly one agent per slot; `agents[slot].slot === slot` (asserted at entry). */
  readonly agents: Readonly<Record<Player, Agent>>;
  /** Observer notified of every step: render (UI), print (CLI), broadcast (server). */
  readonly onUpdate?: (update: DriverUpdate) => void;
  /** Cancellation channel (undo / reset / teardown). */
  readonly signal?: AbortSignal;
  /** Optional pacing injection; engine behavior is identical with it omitted. */
  readonly hooks?: DriverHooks;
  /** Loop safety bound; defaults to {@link MAX_MOVES}. */
  readonly maxMoves?: number;
}

/**
 * A discriminated union describing each observable step. Embedders map it to
 * rendering, printing, or broadcasting. Flip sets are deliberately excluded —
 * animating embedders diff the previous session they hold (research R7).
 *
 * The emitted sequence is always `start (applied | rejected)* end`, unless the run
 * aborts (which rejects `driveGame` rather than emitting `end`).
 */
export type DriverUpdate =
  | { readonly kind: "start"; readonly session: GameSession }
  | {
      readonly kind: "applied";
      readonly session: GameSession;
      readonly move: Move;
      readonly slot: Player;
      readonly forced: boolean;
    }
  | {
      readonly kind: "rejected";
      readonly session: GameSession;
      readonly slot: Player;
      readonly move: Move;
      readonly error: string;
    }
  | { readonly kind: "end"; readonly session: GameSession; readonly result: FinalScore };

export interface GameResult {
  /** Terminal session (`isTerminal === true`). */
  readonly session: GameSession;
  /** Final score; equals `computeFinalScore(session)` (FR-006). */
  readonly result: FinalScore;
}
