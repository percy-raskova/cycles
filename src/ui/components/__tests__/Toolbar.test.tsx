// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toolbar } from "../Toolbar";

describe("Toolbar", () => {
  it("renders all toolbar buttons", () => {
    render(
      <Toolbar
        onUndo={() => {}}
        onReset={() => {}}
        canUndo={false}
        onHelp={() => {}}
        onPass={() => {}}
        canPass={true}
      />,
    );

    expect(screen.getByRole("button", { name: /new game/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /undo/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /pass turn/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /how to play/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /about/i })).toBeDefined();
  });

  it("disables Undo button when canUndo is false", () => {
    render(
      <Toolbar
        onUndo={() => {}}
        onReset={() => {}}
        canUndo={false}
        onHelp={() => {}}
        onPass={() => {}}
        canPass={true}
      />,
    );

    const undoBtn = screen.getByRole("button", { name: /undo/i });
    expect(undoBtn.hasAttribute("disabled")).toBe(true);
  });

  it("enables Undo button when canUndo is true", () => {
    render(
      <Toolbar
        onUndo={() => {}}
        onReset={() => {}}
        canUndo={true}
        onHelp={() => {}}
        onPass={() => {}}
        canPass={true}
      />,
    );

    const undoBtn = screen.getByRole("button", { name: /undo/i });
    expect(undoBtn.hasAttribute("disabled")).toBe(false);
  });

  it("disables Pass Turn button when canPass is false", () => {
    render(
      <Toolbar
        onUndo={() => {}}
        onReset={() => {}}
        canUndo={false}
        onHelp={() => {}}
        onPass={() => {}}
        canPass={false}
      />,
    );

    const passBtn = screen.getByRole("button", { name: /pass turn/i });
    expect(passBtn.hasAttribute("disabled")).toBe(true);
  });

  it("calls onReset when New Game is clicked", async () => {
    const onReset = vi.fn();
    render(
      <Toolbar
        onUndo={() => {}}
        onReset={onReset}
        canUndo={false}
        onHelp={() => {}}
        onPass={() => {}}
        canPass={true}
      />,
    );

    const resetBtn = screen.getByRole("button", { name: /new game/i });
    await userEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("calls onUndo when Undo is clicked", async () => {
    const onUndo = vi.fn();
    render(
      <Toolbar
        onUndo={onUndo}
        onReset={() => {}}
        canUndo={true}
        onHelp={() => {}}
        onPass={() => {}}
        canPass={true}
      />,
    );

    const undoBtn = screen.getByRole("button", { name: /undo/i });
    await userEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("calls onPass when Pass Turn is clicked", async () => {
    const onPass = vi.fn();
    render(
      <Toolbar
        onUndo={() => {}}
        onReset={() => {}}
        canUndo={false}
        onHelp={() => {}}
        onPass={onPass}
        canPass={true}
      />,
    );

    const passBtn = screen.getByRole("button", { name: /pass turn/i });
    await userEvent.click(passBtn);
    expect(onPass).toHaveBeenCalledTimes(1);
  });

  it("calls onHelp with 'help' when How to Play is clicked", async () => {
    const onHelp = vi.fn();
    render(
      <Toolbar
        onUndo={() => {}}
        onReset={() => {}}
        canUndo={false}
        onHelp={onHelp}
        onPass={() => {}}
        canPass={true}
      />,
    );

    const helpBtn = screen.getByRole("button", { name: /how to play/i });
    await userEvent.click(helpBtn);
    expect(onHelp).toHaveBeenCalledWith("help");
  });

  it("calls onHelp with 'about' when About is clicked", async () => {
    const onHelp = vi.fn();
    render(
      <Toolbar
        onUndo={() => {}}
        onReset={() => {}}
        canUndo={false}
        onHelp={onHelp}
        onPass={() => {}}
        canPass={true}
      />,
    );

    const aboutBtn = screen.getByRole("button", { name: /about/i });
    await userEvent.click(aboutBtn);
    expect(onHelp).toHaveBeenCalledWith("about");
  });
});
