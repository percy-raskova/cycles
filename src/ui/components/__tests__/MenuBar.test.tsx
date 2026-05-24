// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MenuBar } from "../MenuBar";

describe("MenuBar", () => {
  it("renders repository link with correct href and target", () => {
    render(
      <MenuBar
        onOpenHelp={() => {}}
        onOpenSettings={() => {}}
        onReset={() => {}}
        onUndo={() => {}}
        canUndo={false}
      />,
    );

    const link = screen.getByRole("link", { name: /view source code on codeberg/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("https://codeberg.org/percy-raskova/cycles");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders help and settings buttons", () => {
    render(
      <MenuBar
        onOpenHelp={() => {}}
        onOpenSettings={() => {}}
        onReset={() => {}}
        onUndo={() => {}}
        canUndo={false}
      />,
    );

    expect(screen.getByRole("button", { name: /open help/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /open settings/i })).toBeTruthy();
  });

  it("renders Reset button with correct aria-label", () => {
    render(
      <MenuBar
        onOpenHelp={() => {}}
        onOpenSettings={() => {}}
        onReset={() => {}}
        onUndo={() => {}}
        canUndo={false}
      />,
    );

    const resetBtn = screen.getByRole("button", { name: /reset game to initial state/i });
    expect(resetBtn).toBeTruthy();
  });

  it("renders Undo button disabled when canUndo is false", () => {
    render(
      <MenuBar
        onOpenHelp={() => {}}
        onOpenSettings={() => {}}
        onReset={() => {}}
        onUndo={() => {}}
        canUndo={false}
      />,
    );

    const undoBtn = screen.getByRole("button", { name: /undo last move/i });
    expect(undoBtn).toBeTruthy();
    expect(undoBtn.hasAttribute("disabled")).toBe(true);
  });

  it("renders Undo button enabled when canUndo is true", () => {
    render(
      <MenuBar
        onOpenHelp={() => {}}
        onOpenSettings={() => {}}
        onReset={() => {}}
        onUndo={() => {}}
        canUndo={true}
      />,
    );

    const undoBtn = screen.getByRole("button", { name: /undo last move/i });
    expect(undoBtn).toBeTruthy();
    expect(undoBtn.hasAttribute("disabled")).toBe(false);
  });

  it("calls onReset when Reset button is clicked", async () => {
    const onReset = vi.fn();
    render(
      <MenuBar
        onOpenHelp={() => {}}
        onOpenSettings={() => {}}
        onReset={onReset}
        onUndo={() => {}}
        canUndo={false}
      />,
    );

    const resetBtn = screen.getByRole("button", { name: /reset game to initial state/i });
    await import("@testing-library/user-event").then(({ default: userEvent }) =>
      userEvent.click(resetBtn),
    );
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("calls onUndo when Undo button is clicked", async () => {
    const onUndo = vi.fn();
    render(
      <MenuBar
        onOpenHelp={() => {}}
        onOpenSettings={() => {}}
        onReset={() => {}}
        onUndo={onUndo}
        canUndo={true}
      />,
    );

    const undoBtn = screen.getByRole("button", { name: /undo last move/i });
    await import("@testing-library/user-event").then(({ default: userEvent }) =>
      userEvent.click(undoBtn),
    );
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
