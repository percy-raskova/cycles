// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GamePage } from "../../src/ui/pages/GamePage";

describe("Visual Regression — Face Selector Open", () => {
  it("renders the face selector with themed styling", async () => {
    render(<GamePage />);

    const grid = screen.getByTestId("grid-view");
    const dots = grid.querySelectorAll("circle");
    const target = Array.from(dots).find(
      (c) => c.getAttribute("cx") === "150" && c.getAttribute("cy") === "150",
    );
    expect(target).toBeTruthy();
    if (target) {
      await userEvent.click(target);
    }

    const selector = screen.getByTestId("face-selector-1-1");
    expect(selector).toBeTruthy();

    // TODO: generate snapshot image with `@vitest/browser` + Playwright
    // Snapshot path: tests/__snapshots__/face-selector-open.png
  });
});
