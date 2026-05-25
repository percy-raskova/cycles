// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MobileToolbar } from "../MobileToolbar";

describe("MobileToolbar", () => {
  it("renders all 4 buttons", () => {
    render(
      <MobileToolbar
        isJoining={false}
        canPass={true}
        canUndo={true}
        onTapMode={() => {}}
        onPass={() => {}}
        onUndo={() => {}}
        onLogOpen={() => {}}
      />,
    );
    expect(screen.getByText("Tap")).toBeDefined();
    expect(screen.getByText("Pass")).toBeDefined();
    expect(screen.getByText("Undo")).toBeDefined();
    expect(screen.getByText("Log")).toBeDefined();
  });

  it("disables Pass when canPass is false", () => {
    render(
      <MobileToolbar
        isJoining={false}
        canPass={false}
        canUndo={true}
        onTapMode={() => {}}
        onPass={() => {}}
        onUndo={() => {}}
        onLogOpen={() => {}}
      />,
    );
    const passBtn = screen.getByText("Pass").closest("button");
    expect(passBtn?.hasAttribute("disabled")).toBe(true);
  });

  it("disables Undo when canUndo is false", () => {
    render(
      <MobileToolbar
        isJoining={false}
        canPass={true}
        canUndo={false}
        onTapMode={() => {}}
        onPass={() => {}}
        onUndo={() => {}}
        onLogOpen={() => {}}
      />,
    );
    const undoBtn = screen.getByText("Undo").closest("button");
    expect(undoBtn?.hasAttribute("disabled")).toBe(true);
  });

  it("calls onPass when Pass is clicked", async () => {
    const onPass = vi.fn();
    render(
      <MobileToolbar
        isJoining={false}
        canPass={true}
        canUndo={true}
        onTapMode={() => {}}
        onPass={onPass}
        onUndo={() => {}}
        onLogOpen={() => {}}
      />,
    );
    await userEvent.click(screen.getByText("Pass"));
    expect(onPass).toHaveBeenCalledTimes(1);
  });
});
