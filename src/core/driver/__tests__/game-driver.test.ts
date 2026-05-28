import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import { allLegalMoves, type BotFunction } from "../../bots/index";
import {
  computeFinalScore,
  createSession,
  type GameSession,
  hasLegalMoves,
  step,
} from "../../session";
import type { Move, Player } from "../../types";
import { createCpuAgent } from "../agents/cpu-agent";
import { createDeferredAgent } from "../agents/deferred-agent";
import { createScriptedAgent } from "../agents/scripted-agent";
import { driveGame } from "../game-driver";
import type { Agent, DriverUpdate } from "../types";

// --- helpers ---------------------------------------------------------------

const PASS_MOVE: Move = { type: "PASS" };
const PLAYERS: readonly Player[] = ["HEADS", "TAILS"];

/** A minimal deterministic bot: always the first legal move. Drives full games in tests. */
const firstLegalBot: BotFunction = (state) => {
  const move = allLegalMoves(state)[0];
  if (move === undefined) {
    throw new Error("firstLegalBot called with no legal moves");
  }
  return move;
};

/** Tiny seeded PRNG so fast-check drives reproducible random games. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Play a complete game directly through `step`, choosing legal moves via `rng`. */
function playGame(
  firstPlayer: Player,
  rng: () => number,
): { history: readonly Move[]; terminal: GameSession } {
  let session = createSession({ firstPlayer });
  for (let i = 0; i < 500 && !session.isTerminal; i += 1) {
    let move = PASS_MOVE;
    if (hasLegalMoves(session)) {
      const moves = allLegalMoves(session.state);
      const chosen = moves[Math.floor(rng() * moves.length)] ?? moves[0];
      if (chosen === undefined) {
        throw new Error("expected at least one legal move");
      }
      move = chosen;
    }
    const result = step(session, move);
    if (result.kind === "error") {
      throw new Error(`simulation step failed: ${result.error}`);
    }
    session = result.session;
  }
  return { history: session.history, terminal: session };
}

/** Partition a history's voluntary (non-PASS) moves by the slot that made them. */
function splitScripts(firstPlayer: Player, history: readonly Move[]): Record<Player, Move[]> {
  const scripts: Record<Player, Move[]> = { HEADS: [], TAILS: [] };
  let player = firstPlayer;
  for (const move of history) {
    if (move.type !== "PASS") {
      scripts[player].push(move);
    }
    player = player === "HEADS" ? "TAILS" : "HEADS";
  }
  return scripts;
}

function nonForcedAppliedMoves(updates: readonly DriverUpdate[]): Move[] {
  const moves: Move[] = [];
  for (const update of updates) {
    if (update.kind === "applied" && !update.forced) {
      moves.push(update.move);
    }
  }
  return moves;
}

/** Wrap an agent so it records the current player at each `selectMove` call (FR-003). */
function recording(base: Agent): { agent: Agent; seen: Player[] } {
  const seen: Player[] = [];
  const agent: Agent = {
    slot: base.slot,
    selectMove(session, signal) {
      seen.push(session.state.currentPlayer);
      return base.selectMove(session, signal);
    },
  };
  return { agent, seen };
}

// --- tests -----------------------------------------------------------------

describe("driveGame", () => {
  it("drives two scripted agents to terminal; result and applied sequence match the engine", async () => {
    const firstPlayer: Player = "HEADS";
    const { history, terminal } = playGame(firstPlayer, () => 0);
    const scripts = splitScripts(firstPlayer, history);

    const updates: DriverUpdate[] = [];
    const { session, result } = await driveGame({
      initialSession: createSession({ firstPlayer }),
      agents: {
        HEADS: createScriptedAgent("HEADS", scripts.HEADS),
        TAILS: createScriptedAgent("TAILS", scripts.TAILS),
      },
      onUpdate: (u) => updates.push(u),
    });

    expect(session.isTerminal).toBe(true);
    expect(result).toEqual(computeFinalScore(session));
    expect(session).toEqual(terminal);
    expect(nonForcedAppliedMoves(updates)).toEqual(history.filter((m) => m.type !== "PASS"));

    const kinds = updates.map((u) => u.kind);
    expect(kinds[0]).toBe("start");
    expect(kinds.at(-1)).toBe("end");
    expect(kinds.slice(1, -1).every((k) => k === "applied" || k === "rejected")).toBe(true);
  });

  it("terminal session equals direct step replay for random scripted games (property)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.constantFrom(...PLAYERS),
        async (seed, firstPlayer) => {
          const { history, terminal } = playGame(firstPlayer, mulberry32(seed));
          const scripts = splitScripts(firstPlayer, history);
          const { session } = await driveGame({
            initialSession: createSession({ firstPlayer }),
            agents: {
              HEADS: createScriptedAgent("HEADS", scripts.HEADS),
              TAILS: createScriptedAgent("TAILS", scripts.TAILS),
            },
          });
          expect(session).toEqual(terminal);
        },
      ),
      { numRuns: 25 },
    );
  });

  it("auto-passes forced turns without asking the agent, and only asks the current slot (FR-003/004)", async () => {
    const firstPlayer: Player = "TAILS";
    const { history } = playGame(firstPlayer, () => 0);
    const scripts = splitScripts(firstPlayer, history);

    const heads = recording(createScriptedAgent("HEADS", scripts.HEADS));
    const tails = recording(createScriptedAgent("TAILS", scripts.TAILS));
    const updates: DriverUpdate[] = [];
    await driveGame({
      initialSession: createSession({ firstPlayer }),
      agents: { HEADS: heads.agent, TAILS: tails.agent },
      onUpdate: (u) => updates.push(u),
    });

    // FR-004: forced passes happened, but selectMove was called exactly once per voluntary move.
    expect(updates.some((u) => u.kind === "applied" && u.forced)).toBe(true);
    expect(heads.seen.length).toBe(scripts.HEADS.length);
    expect(tails.seen.length).toBe(scripts.TAILS.length);
    // FR-003: each agent is only ever asked on its own turn.
    expect(heads.seen.every((p) => p === "HEADS")).toBe(true);
    expect(tails.seen.every((p) => p === "TAILS")).toBe(true);
  });

  it("re-asks after an illegal move and recovers when a legal one follows", async () => {
    let tailsCalls = 0;
    const flakyTails: Agent = {
      slot: "TAILS",
      selectMove(session) {
        tailsCalls += 1;
        if (tailsCalls === 1) {
          return Promise.resolve(PASS_MOVE); // illegal: cannot pass when moves exist
        }
        return Promise.resolve(firstLegalBot(session.state));
      },
    };

    const updates: DriverUpdate[] = [];
    const { session } = await driveGame({
      initialSession: createSession({ firstPlayer: "TAILS" }),
      agents: { HEADS: createCpuAgent("HEADS", firstLegalBot), TAILS: flakyTails },
      onUpdate: (u) => updates.push(u),
    });

    expect(session.isTerminal).toBe(true);
    const firstReject = updates.findIndex((u) => u.kind === "rejected");
    const firstApplied = updates.findIndex((u) => u.kind === "applied");
    expect(firstReject).toBeGreaterThanOrEqual(0);
    expect(firstReject).toBeLessThan(firstApplied);
  });

  it("throws DriverError(illegal-move-limit) when an agent only returns illegal moves (SC-007)", async () => {
    const alwaysPass: Agent = { slot: "TAILS", selectMove: () => Promise.resolve(PASS_MOVE) };
    const updates: DriverUpdate[] = [];
    await expect(
      driveGame({
        initialSession: createSession({ firstPlayer: "TAILS" }),
        agents: { HEADS: createScriptedAgent("HEADS", []), TAILS: alwaysPass },
        onUpdate: (u) => updates.push(u),
      }),
    ).rejects.toMatchObject({ name: "DriverError", code: "illegal-move-limit" });
    // default maxIllegalRetries = 1 ⇒ 2 attempts, both rejected, then it fails loud.
    expect(updates.filter((u) => u.kind === "rejected").length).toBe(2);
  });

  it("rejects with AbortError and applies no move when aborted mid-turn (SC-006)", async () => {
    const controller = new AbortController();
    const human = createDeferredAgent("TAILS");
    const updates: DriverUpdate[] = [];
    const promise = driveGame({
      initialSession: createSession({ firstPlayer: "TAILS" }),
      agents: { HEADS: createScriptedAgent("HEADS", []), TAILS: human.agent },
      signal: controller.signal,
      onUpdate: (u) => updates.push(u),
    });

    await Promise.resolve();
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(updates.some((u) => u.kind === "applied")).toBe(false);
    expect(updates.some((u) => u.kind === "end")).toBe(false);
  });

  it("throws DriverError(max-moves-exceeded) when the move bound is hit (FR-014)", async () => {
    await expect(
      driveGame({
        initialSession: createSession(),
        agents: {
          HEADS: createCpuAgent("HEADS", firstLegalBot),
          TAILS: createCpuAgent("TAILS", firstLegalBot),
        },
        maxMoves: 3,
      }),
    ).rejects.toMatchObject({ name: "DriverError", code: "max-moves-exceeded" });
  });

  it("throws DriverError(bad-agents) when an agent is bound to the wrong slot", async () => {
    await expect(
      driveGame({
        initialSession: createSession(),
        agents: {
          HEADS: createScriptedAgent("TAILS", []),
          TAILS: createScriptedAgent("TAILS", []),
        },
      }),
    ).rejects.toMatchObject({ name: "DriverError", code: "bad-agents" });
  });

  it("throws DriverError(bad-agents) when a slot is missing", async () => {
    await expect(
      driveGame({
        initialSession: createSession(),
        agents: { TAILS: createScriptedAgent("TAILS", []) } as unknown as Record<Player, Agent>,
      }),
    ).rejects.toMatchObject({ name: "DriverError", code: "bad-agents" });
  });

  it("on an already-terminal initial session emits start then end and asks no agent", async () => {
    const { terminal } = playGame("TAILS", () => 0);
    expect(terminal.isTerminal).toBe(true);

    const headsSelect = vi.fn(() => Promise.resolve(PASS_MOVE));
    const tailsSelect = vi.fn(() => Promise.resolve(PASS_MOVE));
    const updates: DriverUpdate[] = [];
    const { session, result } = await driveGame({
      initialSession: terminal,
      agents: {
        HEADS: { slot: "HEADS", selectMove: headsSelect },
        TAILS: { slot: "TAILS", selectMove: tailsSelect },
      },
      onUpdate: (u) => updates.push(u),
    });

    expect(updates.map((u) => u.kind)).toEqual(["start", "end"]);
    expect(headsSelect).not.toHaveBeenCalled();
    expect(tailsSelect).not.toHaveBeenCalled();
    expect(session).toBe(terminal);
    expect(result).toEqual(computeFinalScore(terminal));
  });
});
