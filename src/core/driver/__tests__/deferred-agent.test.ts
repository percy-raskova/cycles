import { describe, expect, it, vi } from "vitest";
import { createSession } from "../../session";
import type { Move } from "../../types";
import { createDeferredAgent } from "../agents/deferred-agent";

const SAMPLE_MOVE: Move = { type: "PLACE", position: { row: 3, col: 3 }, face: "heads" };

describe("createDeferredAgent", () => {
  it("pends until submit, then resolves with the submitted move", async () => {
    const handle = createDeferredAgent("HEADS");
    const pending = handle.agent.selectMove(createSession());

    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve(); // flush microtasks — nothing should have resolved yet
    expect(settled).toBe(false);

    handle.submit(SAMPLE_MOVE);
    await expect(pending).resolves.toEqual(SAMPLE_MOVE);
  });

  it("fail(e) rejects the pending selectMove with that error", async () => {
    const handle = createDeferredAgent("TAILS");
    const pending = handle.agent.selectMove(createSession());
    const boom = new Error("transport down");
    handle.fail(boom);
    await expect(pending).rejects.toBe(boom);
  });

  it("abort rejects the pending selectMove with AbortError; a later submit is a no-op (SC-006)", async () => {
    const controller = new AbortController();
    const handle = createDeferredAgent("HEADS");
    const pending = handle.agent.selectMove(createSession(), controller.signal);

    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });

    // No stale resolution: submitting after the abort must not resolve anything.
    const onResolve = vi.fn();
    void pending.then(onResolve, () => {});
    handle.submit(SAMPLE_MOVE);
    await Promise.resolve();
    expect(onResolve).not.toHaveBeenCalled();
  });

  it("submit / fail before any selectMove is a harmless no-op", () => {
    const handle = createDeferredAgent("HEADS");
    expect(() => handle.submit(SAMPLE_MOVE)).not.toThrow();
    expect(() => handle.fail(new Error("ignored"))).not.toThrow();
  });
});
