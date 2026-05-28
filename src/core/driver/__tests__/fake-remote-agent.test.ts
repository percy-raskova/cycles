// US3 — the extension seam. A brand-new asynchronous move-source ("remote") plugs
// into the UNCHANGED driver by implementing `Agent` and nothing else. This double
// lives ONLY in this test file: adding it required ZERO edits to game-driver.ts, the
// engine, or the shipped agents (SC-003 / research R10). It imports only the existing
// public surface, which IS the proof — the API surface the refactor set out to expose.
import { describe, expect, it } from "vitest";
import { type BotFunction, randomBot, strategicBot } from "../../bots/index";
import { computeFinalScore, createSession } from "../../session";
import type { Move, Player } from "../../types";
import { createCpuAgent } from "../agents/cpu-agent";
import { driveGame } from "../game-driver";
import type { Agent, DriverUpdate } from "../types";

/** A move that arrives asynchronously "from elsewhere" (network / MCP round-trip). */
function createFakeRemoteAgent(slot: Player, source: BotFunction): Agent {
  return {
    slot,
    selectMove(session, signal) {
      return new Promise<Move>((resolve, reject) => {
        signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
        queueMicrotask(() => resolve(source(session.state)));
      });
    },
  };
}

describe("FakeRemoteAgent (US3 — the extension seam)", () => {
  it("plays a full game through the unchanged driver with correct turn order and result (FR-010)", async () => {
    const firstPlayer: Player = "HEADS";
    const seen: Player[] = [];

    const { session, result } = await driveGame({
      initialSession: createSession({ firstPlayer }),
      agents: {
        HEADS: createCpuAgent("HEADS", strategicBot),
        TAILS: createFakeRemoteAgent("TAILS", randomBot),
      },
      onUpdate: (u) => {
        if (u.kind === "applied" && !u.forced) {
          seen.push(u.slot);
        }
      },
    });

    expect(session.isTerminal).toBe(true);
    expect(result).toEqual(computeFinalScore(session));
    expect(seen[0]).toBe(firstPlayer); // turn order honored: first mover acts first
  });

  it("surfaces a remote selectMove failure without corrupting the last good session", async () => {
    const disconnect = new Error("remote disconnected");
    const remote: Agent = { slot: "TAILS", selectMove: () => Promise.reject(disconnect) };
    const updates: DriverUpdate[] = [];

    await expect(
      driveGame({
        initialSession: createSession({ firstPlayer: "HEADS" }),
        agents: { HEADS: createCpuAgent("HEADS", strategicBot), TAILS: remote },
        onUpdate: (u) => updates.push(u),
      }),
    ).rejects.toBe(disconnect);

    // The failure propagated; no terminal result was fabricated, and the last applied
    // session is a valid, non-terminal game state (nothing half-applied).
    expect(updates.some((u) => u.kind === "end")).toBe(false);
    const lastApplied = [...updates].reverse().find((u) => u.kind === "applied");
    expect(lastApplied?.kind).toBe("applied");
    if (lastApplied?.kind === "applied") {
      expect(lastApplied.session.isTerminal).toBe(false);
      expect(lastApplied.session.state.coins.size).toBeGreaterThan(0);
    }
  });
});
