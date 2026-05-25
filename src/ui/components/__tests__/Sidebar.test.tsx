// @vitest-environment jsdom
import { createSession, step } from "@core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sidebar } from "../Sidebar";

describe("Sidebar", () => {
  it("renders TurnPanel with current player and coins remaining", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    render(<Sidebar session={session} moveLog={[]} notice={null} />);

    expect(screen.getByTestId("turn-indicator")).toBeDefined();
    expect(screen.getByTestId("turn-indicator-player").textContent).toBe("HEADS");
    expect(screen.getByTestId("turn-indicator-remaining").textContent).toContain("12 coins remain");
  });

  it("shows notice when provided", () => {
    const session = createSession({ firstPlayer: "TAILS" });
    render(<Sidebar session={session} moveLog={[]} notice="TAILS has no legal moves — passing" />);

    expect(screen.getByTestId("turn-indicator-notice").textContent).toBe(
      "TAILS has no legal moves — passing",
    );
  });

  it("does not show notice element when notice is null", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    render(<Sidebar session={session} moveLog={[]} notice={null} />);

    expect(screen.queryByTestId("turn-indicator-notice")).toBeNull();
  });

  it("does not render TurnPanel when session is terminal", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    // Create a terminal session by mocking isTerminal
    const terminalSession = { ...session, isTerminal: true as const };

    render(<Sidebar session={terminalSession} moveLog={[]} notice={null} />);
    expect(screen.queryByTestId("turn-indicator")).toBeNull();
  });

  it("renders ScorePanel with correct counts", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    render(<Sidebar session={session} moveLog={[]} notice={null} />);

    expect(screen.getByText("Heads")).toBeDefined();
    expect(screen.getByText("Tails")).toBeDefined();
    // On empty board both scores are 0
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
  });

  it("renders SupplyPanel with 12 pips when supply is full", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    render(<Sidebar session={session} moveLog={[]} notice={null} />);

    const pips = document.querySelectorAll(".pip");
    expect(pips.length).toBe(12);
    const spentPips = document.querySelectorAll(".pip.spent");
    expect(spentPips.length).toBe(0);
  });

  it("renders SupplyPanel with spent pips after coins are placed", () => {
    let session = createSession({ firstPlayer: "HEADS" });
    const result = step(session, { type: "PLACE", position: { row: 0, col: 0 }, face: "heads" });
    if (result.kind === "ok") session = result.session;

    render(<Sidebar session={session} moveLog={[]} notice={null} />);

    const spentPips = document.querySelectorAll(".pip.spent");
    expect(spentPips.length).toBe(1);
  });

  it("shows 'no moves yet' placeholder when log is empty", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    render(<Sidebar session={session} moveLog={[]} notice={null} />);

    expect(screen.getByText(/no moves yet — place a coin to begin/i)).toBeDefined();
  });

  it("renders log entries with action tags", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    const moveLog = [
      { action: "PLACE", text: "HEADS placed Heads @ (1,1)" },
      { action: "JOIN", text: "TAILS joined (1,1)↔(2,2)" },
    ];
    render(<Sidebar session={session} moveLog={moveLog} notice={null} />);

    expect(screen.getByText("HEADS placed Heads @ (1,1)")).toBeDefined();
    expect(screen.getByText("JOIN")).toBeDefined();
    expect(screen.getByText("TAILS joined (1,1)↔(2,2)")).toBeDefined();
    expect(screen.queryByText(/no moves yet/i)).toBeNull();
  });
});
