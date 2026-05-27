// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
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
    const strategicBtn = screen.getByRole("radio", { name: /strategic/i });

    expect(humanBtn.getAttribute("aria-checked")).toBe("true");
    expect(randomBtn.getAttribute("aria-checked")).toBe("false");
    expect(strategicBtn.getAttribute("aria-checked")).toBe("false");
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
      if (!Number.isNaN(minHeight)) {
        expect(minHeight).toBeGreaterThanOrEqual(44);
      }
      if (!Number.isNaN(minWidth)) {
        expect(minWidth).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

describe("SetupScreen opponent selection (FR-001)", () => {
  it("offers a Strategic bot opponent and no longer offers Greedy", () => {
    render(<SetupScreen onStart={vi.fn()} />);
    expect(screen.getByRole("radio", { name: "Strategic bot opponent" })).not.toBeNull();
    expect(screen.queryByRole("radio", { name: /greedy/i })).toBeNull();
  });

  it("starting with Strategic selected yields opponent: 'strategic'", () => {
    const onStart = vi.fn();
    render(<SetupScreen onStart={onStart} />);

    fireEvent.click(screen.getByRole("radio", { name: "Strategic bot opponent" }));
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0]?.[0]?.opponent).toBe("strategic");
  });
});
