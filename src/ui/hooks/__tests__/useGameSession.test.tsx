// @vitest-environment jsdom
import { createSession } from "@core";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGameSession } from "../useGameSession";

describe("useGameSession.applyMove", () => {
  it("returns the engine error string when a move is rejected", () => {
    const initialSession = createSession({ firstPlayer: "HEADS" });
    const { result } = renderHook(() => useGameSession({ initialSession }));

    let outcome: { success: boolean; error?: string } | undefined;
    act(() => {
      // No coins exist yet, so a JOIN is illegal — engine rejects it.
      outcome = result.current.applyMove({
        type: "JOIN",
        a: { row: 0, col: 0 },
        b: { row: 0, col: 1 },
      });
    });

    expect(outcome?.success).toBe(false);
    expect(outcome?.error).toBeTruthy();
  });

  it("reports success for a legal placement", () => {
    const initialSession = createSession({ firstPlayer: "HEADS" });
    const { result } = renderHook(() => useGameSession({ initialSession }));

    let outcome: { success: boolean; error?: string } | undefined;
    act(() => {
      outcome = result.current.applyMove({
        type: "PLACE",
        position: { row: 0, col: 0 },
        face: "heads",
      });
    });

    expect(outcome?.success).toBe(true);
    expect(outcome?.error).toBeUndefined();
  });
});
