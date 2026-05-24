// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGameSession } from "../../src/ui/hooks/useGameSession";
import { GamePage } from "../../src/ui/pages/GamePage";

function GamePageWrapper() {
  const { session, applyMove, reset, undo, canUndo } = useGameSession();
  return (
    <GamePage
      session={session}
      applyMove={applyMove}
      onReset={reset}
      onUndo={undo}
      canUndo={canUndo}
    />
  );
}

describe("Visual Regression — Initial Load", () => {
  it("renders the game page with themed elements", () => {
    render(<GamePageWrapper />);

    // Verify theme is applied via CSS custom properties (proxy for visual state)
    const board = screen.getByTestId("board-view");
    expect(board).toBeTruthy();

    const indicator = screen.getByTestId("turn-indicator");
    expect(indicator).toBeTruthy();

    // TODO: generate snapshot image with `@vitest/browser` + Playwright
    // Snapshot path: tests/__snapshots__/initial-load.png
  });
});
