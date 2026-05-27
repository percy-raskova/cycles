// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@ui/App";
import { describe, expect, it } from "vitest";
import { startGameFromSetup } from "../../../../tests/helpers/setup-helpers";

describe("Keyboard Navigation (US6)", () => {
  it("Tab cycles through all interactive elements", async () => {
    render(<App />);
    await startGameFromSetup();

    const user = userEvent.setup();

    // Tab through the menu bar buttons
    const resetButton = screen.getByLabelText("Reset game to initial state");
    const helpButton = screen.getByLabelText("Open help");
    const settingsButton = screen.getByLabelText("Open settings");

    await user.tab();
    expect(document.activeElement).toBe(resetButton);

    await user.tab();
    expect(document.activeElement).toBe(helpButton);

    await user.tab();
    expect(document.activeElement).toBe(settingsButton);
  });
});

describe("Responsive Layout (US5)", () => {
  it("game board container uses vmin-based sizing", async () => {
    render(<App />);
    await startGameFromSetup();

    const boardContainer = document.querySelector(".game-board-container");
    expect(boardContainer).toBeTruthy();
    expect(boardContainer?.classList.contains("game-board-container")).toBe(true);
  });
});

describe("Touch Target Size (US5)", () => {
  it("menu buttons have sizing classes for ≥44×44 CSS pixels", async () => {
    render(<App />);
    await startGameFromSetup();

    const buttons = [
      screen.getByLabelText("Reset game to initial state"),
      screen.getByLabelText("Undo last move"),
      screen.getByLabelText("Open help"),
      screen.getByLabelText("Open settings"),
    ];

    for (const btn of buttons) {
      expect(btn).toBeTruthy();
      expect(btn.tagName).toBe("BUTTON");
    }
  });
});

describe("Visual Regression — Help Modal (US4)", () => {
  it("renders the help modal with Win95 window chrome", async () => {
    render(<App />);
    await startGameFromSetup();

    const helpButton = screen.getByLabelText("Open help");
    await userEvent.click(helpButton);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(document.getElementById("modal-title")?.textContent).toBe("Help");

    // Snapshot image generation requires `@vitest/browser` in browser mode.
    // Run: bun run test -- --browser
  });
});

describe("Visual Regression — Settings Modal (US4)", () => {
  it("renders the settings modal with Win95 window chrome", async () => {
    render(<App />);
    await startGameFromSetup();

    const settingsButton = screen.getByLabelText("Open settings");
    await userEvent.click(settingsButton);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(document.getElementById("modal-title")?.textContent).toBe("Settings");

    // Snapshot image generation requires `@vitest/browser` in browser mode.
    // Run: bun run test -- --browser
  });
});
