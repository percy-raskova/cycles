import { describe, expect, it, vi } from "vitest";
import { createSession } from "../../session";
import type { Move } from "../../types";
import { createCpuAgent } from "../agents/cpu-agent";

const MOVE: Move = { type: "PLACE", position: { row: 2, col: 2 }, face: "heads" };

describe("createCpuAgent", () => {
  it("wraps the bot, returns its move, and does not mutate the session", async () => {
    const bot = vi.fn(() => MOVE);
    const agent = createCpuAgent("TAILS", bot);
    const session = createSession();

    await expect(agent.selectMove(session)).resolves.toEqual(MOVE);
    expect(bot).toHaveBeenCalledWith(session.state);
    expect(session).toEqual(createSession()); // pristine — agent mutated nothing
  });

  it("delays the move until the injected think settles", async () => {
    vi.useFakeTimers();
    try {
      const bot = vi.fn(() => MOVE);
      const think = () => new Promise<void>((resolve) => setTimeout(resolve, 2000));
      const agent = createCpuAgent("HEADS", bot, { think });

      const pending = agent.selectMove(createSession());
      expect(bot).not.toHaveBeenCalled(); // still "thinking"

      await vi.advanceTimersByTimeAsync(2000);
      await expect(pending).resolves.toEqual(MOVE);
      expect(bot).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects and never calls the bot when aborted during think", async () => {
    const bot = vi.fn(() => MOVE);
    const think = (signal: AbortSignal | undefined) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 2000);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(signal.reason);
          },
          { once: true },
        );
      });
    const controller = new AbortController();
    const agent = createCpuAgent("HEADS", bot, { think });

    const pending = agent.selectMove(createSession(), controller.signal);
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(bot).not.toHaveBeenCalled();
  });
});
