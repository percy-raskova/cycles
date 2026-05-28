import { describe, expect, it } from "vitest";
import { createSession } from "../../session";
import type { Move } from "../../types";
import { createScriptedAgent } from "../agents/scripted-agent";
import { DriverError } from "../types";

const M1: Move = { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" };
const M2: Move = { type: "PLACE", position: { row: 1, col: 1 }, face: "tails" };

describe("createScriptedAgent", () => {
  it("returns its moves in order on successive calls", async () => {
    const agent = createScriptedAgent("HEADS", [M1, M2]);
    await expect(agent.selectMove(createSession())).resolves.toEqual(M1);
    await expect(agent.selectMove(createSession())).resolves.toEqual(M2);
  });

  it("rejects with a DriverError once the list is exhausted", async () => {
    const agent = createScriptedAgent("TAILS", [M1]);
    await agent.selectMove(createSession());
    await expect(agent.selectMove(createSession())).rejects.toBeInstanceOf(DriverError);
  });
});
