// US2 — a full game runs headlessly between two programmatic agents, with no UI.
// This file imports only from the engine + driver (no @ui, no DOM) and runs under
// Vitest's default `node` environment, proving FR-013 purity (SC-002).
import { describe, expect, it } from "vitest";
import { randomBot, strategicBot } from "../../bots/index";
import { computeFinalScore, createSession } from "../../session";
import type { Move, Player } from "../../types";
import { createCpuAgent } from "../agents/cpu-agent";
import { createScriptedAgent } from "../agents/scripted-agent";
import { driveGame } from "../game-driver";

describe("headless two-agent games (US2)", () => {
  it("plays strategicBot vs randomBot to terminal; result matches the engine score (SC-002)", async () => {
    const { session, result } = await driveGame({
      initialSession: createSession({ firstPlayer: "HEADS" }),
      agents: {
        HEADS: createCpuAgent("HEADS", strategicBot),
        TAILS: createCpuAgent("TAILS", randomBot),
      },
    });

    expect(session.isTerminal).toBe(true);
    expect(result).toEqual(computeFinalScore(session));
    expect(result.heads + result.tails).toBe(session.state.coins.size);
  });

  it("reproduces a fixed scripted game's terminal result on repeat (FR-012)", async () => {
    const firstPlayer: Player = "HEADS";

    // Capture a deterministic transcript from strategic-vs-strategic (no clock ⇒ pure).
    const reference = await driveGame({
      initialSession: createSession({ firstPlayer }),
      agents: {
        HEADS: createCpuAgent("HEADS", strategicBot),
        TAILS: createCpuAgent("TAILS", strategicBot),
      },
    });

    // Partition voluntary moves by slot (forced passes are driver-owned, not scripted).
    const heads: Move[] = [];
    const tails: Move[] = [];
    let player: Player = firstPlayer;
    for (const move of reference.session.history) {
      if (move.type !== "PASS") {
        (player === "HEADS" ? heads : tails).push(move);
      }
      player = player === "HEADS" ? "TAILS" : "HEADS";
    }

    const playScripted = () =>
      driveGame({
        initialSession: createSession({ firstPlayer }),
        agents: {
          HEADS: createScriptedAgent("HEADS", heads),
          TAILS: createScriptedAgent("TAILS", tails),
        },
      });

    const first = await playScripted();
    const second = await playScripted();
    expect(first.session).toEqual(reference.session);
    expect(second.session).toEqual(first.session);
  });
});
