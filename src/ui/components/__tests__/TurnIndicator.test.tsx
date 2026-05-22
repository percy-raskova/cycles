// @vitest-environment jsdom
import { createSession } from "@core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TurnIndicator } from "../TurnIndicator";

describe("TurnIndicator", () => {
  it("renders current player and coins remaining", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    render(<TurnIndicator session={session} notice={null} />);

    expect(screen.getByTestId("turn-indicator")).toBeDefined();
    expect(screen.getByTestId("turn-indicator-player").textContent).toBe("HEADS");
    expect(screen.getByTestId("turn-indicator-remaining").textContent).toContain("12 coins remain");
  });

  it("shows notice when provided", () => {
    const session = createSession({ firstPlayer: "TAILS" });
    render(<TurnIndicator session={session} notice="TAILS has no legal moves — passing" />);

    expect(screen.getByTestId("turn-indicator-notice").textContent).toBe(
      "TAILS has no legal moves — passing",
    );
  });

  it("does not show notice element when notice is null", () => {
    const session = createSession({ firstPlayer: "HEADS" });
    render(<TurnIndicator session={session} notice={null} />);

    expect(screen.queryByTestId("turn-indicator-notice")).toBeNull();
  });
});
