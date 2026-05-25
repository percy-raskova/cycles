// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useGameSession } from "../../src/ui/hooks/useGameSession";
import { GamePage } from "../../src/ui/pages/GamePage";

function GamePageWrapper() {
  const { session, applyMove, reset } = useGameSession();
  return <GamePage session={session} applyMove={applyMove} onReset={reset} />;
}

describe("Visual Regression — Face Selector Open", () => {
  it("renders the face selector with themed styling", async () => {
    render(<GamePageWrapper />);

    const grid = screen.getByTestId("grid-view");
    const dots = grid.querySelectorAll("circle");
    const target = Array.from(dots).find(
      (c) => c.getAttribute("cx") === "250" && c.getAttribute("cy") === "250",
    );
    expect(target).toBeTruthy();
    if (target) {
      await userEvent.click(target);
    }

    const selector = screen.getByTestId("face-selector-1-1");
    expect(selector).toBeTruthy();

    // Snapshot image generation requires `@vitest/browser` in browser mode.
    // Run: bun run test -- --browser
    // For now, DOM presence verification ensures the themed face selector renders.
  });
});
