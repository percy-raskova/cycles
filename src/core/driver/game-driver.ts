import { computeFinalScore, type GameSession, hasLegalMoves, step } from "../session";
import type { Move, Player } from "../types";
import {
  type Agent,
  DriverError,
  type GameDriverOptions,
  type GameResult,
  MAX_MOVES,
} from "./types";

const PASS_MOVE: Move = { type: "PASS" };
const SLOTS: readonly Player[] = ["HEADS", "TAILS"];

/** Validate that exactly one agent is bound to each slot, on its own slot (FR-001). */
function assertAgents(agents: GameDriverOptions["agents"]): void {
  // Read through a partial view so the runtime "missing slot" guard typechecks
  // against a caller who bypassed the static `Record<Player, Agent>` contract.
  const lookup = agents as Readonly<Partial<Record<Player, Agent>>>;
  for (const slot of SLOTS) {
    const agent = lookup[slot];
    if (agent === undefined || agent.slot !== slot) {
      throw new DriverError(`agents.${slot} is missing or bound to the wrong slot`, "bad-agents");
    }
  }
}

/** Apply the driver-owned forced PASS for a slot with no legal moves (FR-004). */
async function forcedPass(
  session: GameSession,
  slot: Player,
  options: GameDriverOptions,
): Promise<GameSession> {
  await options.hooks?.beforeForcedPass?.(slot, options.signal);
  options.signal?.throwIfAborted();
  const result = step(session, PASS_MOVE);
  /* v8 ignore start -- a forced PASS is always legal; this guards a broken engine invariant */
  if (result.kind === "error") {
    throw new Error(`forced pass unexpectedly failed for ${slot}: ${result.error}`);
  }
  /* v8 ignore stop */
  options.onUpdate?.({
    kind: "applied",
    session: result.session,
    move: PASS_MOVE,
    slot,
    forced: true,
  });
  return result.session;
}

/** Ask the slot's agent for a move, validate via `step`, re-asking up to its retry bound (FR-005). */
async function takeTurn(
  session: GameSession,
  slot: Player,
  options: GameDriverOptions,
): Promise<GameSession> {
  const agent = options.agents[slot];
  const limit = agent.maxIllegalRetries ?? 1;
  for (let attempt = 0; attempt <= limit; attempt += 1) {
    options.signal?.throwIfAborted();
    const move = await agent.selectMove(session, options.signal);
    options.signal?.throwIfAborted();
    const result = step(session, move);
    if (result.kind === "ok") {
      options.onUpdate?.({ kind: "applied", session: result.session, move, slot, forced: false });
      return result.session;
    }
    options.onUpdate?.({ kind: "rejected", session, slot, move, error: result.error });
  }
  throw new DriverError(`agent ${slot} exceeded its illegal-move limit`, "illegal-move-limit");
}

/**
 * Run the canonical game loop to terminal: ask the current player → validate via
 * `step` → emit → repeat, auto-passing forced turns (FR-002..FR-006). Pure
 * orchestration — no I/O and no wall-clock reads (FR-013), so the same call runs
 * identically in a browser, a Node test, or a server runtime. Cancellation via
 * `signal` surfaces as an AbortError; the loop is statically bounded by `maxMoves`
 * (FR-014); and it delegates every rule decision to the engine (FR-015).
 */
export async function driveGame(options: GameDriverOptions): Promise<GameResult> {
  assertAgents(options.agents);
  const maxMoves = options.maxMoves ?? MAX_MOVES;
  let session = options.initialSession;
  options.onUpdate?.({ kind: "start", session });

  for (let moves = 0; moves < maxMoves; moves += 1) {
    options.signal?.throwIfAborted();
    if (session.isTerminal) {
      const result = computeFinalScore(session);
      options.onUpdate?.({ kind: "end", session, result });
      return { session, result };
    }
    const slot = session.state.currentPlayer;
    session = hasLegalMoves(session)
      ? await takeTurn(session, slot, options)
      : await forcedPass(session, slot, options);
  }
  throw new DriverError(
    `game exceeded ${maxMoves} moves without terminating`,
    "max-moves-exceeded",
  );
}
