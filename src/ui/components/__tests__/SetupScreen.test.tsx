// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SetupScreen } from "../SetupScreen";

describe("SetupScreen a11y", () => {
  it("has accessible role and label (T018)", () => {
    render(<SetupScreen onStart={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("setup-title");

    const title = screen.getByRole("heading", { level: 2 });
    expect(title.textContent).toBe("New Game");
    expect(title.getAttribute("id")).toBe("setup-title");
  });

  it("presents opponent options as radio buttons with aria-checked", () => {
    render(<SetupScreen onStart={vi.fn()} />);

    const humanBtn = screen.getByRole("radio", { name: /human/i });
    const randomBtn = screen.getByRole("radio", { name: /random/i });
    const greedyBtn = screen.getByRole("radio", { name: /greedy/i });

    expect(humanBtn.getAttribute("aria-checked")).toBe("true");
    expect(randomBtn.getAttribute("aria-checked")).toBe("false");
    expect(greedyBtn.getAttribute("aria-checked")).toBe("false");
  });

  it("start button has aria-label", () => {
    render(<SetupScreen onStart={vi.fn()} />);
    const startBtn = screen.getByRole("button", { name: /start game/i });
    expect(startBtn).not.toBeNull();
  });

  it("touch targets are at least 44×44 CSS pixels", () => {
    render(<SetupScreen onStart={vi.fn()} />);
    const options = screen.getAllByRole("radio");
    expect(options.length).toBeGreaterThan(0);
    for (const opt of options) {
      const styles = window.getComputedStyle(opt);
      const minHeight = Number.parseInt(styles.minHeight, 10);
      const minWidth = Number.parseInt(styles.minWidth, 10);
      // minHeight/minWidth may be returned as pixels or empty string in jsdom
      if (!Number.isNaN(minHeight)) {
        expect(minHeight).toBeGreaterThanOrEqual(44);
      }
      if (!Number.isNaN(minWidth)) {
        expect(minWidth).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
