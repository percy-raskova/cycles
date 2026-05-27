// @vitest-environment jsdom
import { createSession } from "@core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MobileApp } from "../MobileApp";

function TestWrapper() {
  const session = createSession({ firstPlayer: "HEADS" });
  return (
    <MobileApp
      session={session}
      applyMove={() => ({ success: true, flipped: new Set() })}
      onReset={() => {}}
      moveLog={[]}
    />
  );
}

describe("MobileApp", () => {
  it("renders mobile shell with title bar", () => {
    render(<TestWrapper />);
    expect(screen.getByText("CYCLES")).toBeDefined();
    expect(screen.getByLabelText("Open menu")).toBeDefined();
    expect(screen.getByLabelText("Help")).toBeDefined();
  });

  it("renders status strip with player and supply", () => {
    render(<TestWrapper />);
    expect(screen.getByText("HEADS")).toBeDefined();
    expect(document.querySelector(".m-status")).toBeTruthy();
    expect(document.querySelector(".m-status-cell")).toBeTruthy();
  });

  it("renders toolbar with 4 buttons", () => {
    render(<TestWrapper />);
    expect(screen.getByText("Tap")).toBeDefined();
    expect(screen.getByText("Pass")).toBeDefined();
    expect(screen.getByText("Undo")).toBeDefined();
    expect(screen.getByText("Log")).toBeDefined();
  });

  it("opens drawer when hamburger is clicked", async () => {
    render(<TestWrapper />);
    const menuBtn = screen.getByLabelText("Open menu");
    await userEvent.click(menuBtn);
    expect(screen.getByText("New Game")).toBeDefined();
    expect(screen.getByText("Undo Move")).toBeDefined();
    expect(screen.getByText("Pass Turn")).toBeDefined();
  });

  it("opens bottom sheet when Log is clicked", async () => {
    render(<TestWrapper />);
    const logBtn = screen.getByText("Log");
    await userEvent.click(logBtn);
    expect(screen.getByLabelText("Close")).toBeDefined();
  });
});
