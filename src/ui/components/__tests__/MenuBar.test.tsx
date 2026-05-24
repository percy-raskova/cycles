// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MenuBar } from "../MenuBar";

describe("MenuBar", () => {
  it("renders repository link with correct href and target", () => {
    render(<MenuBar onOpenHelp={() => {}} onOpenSettings={() => {}} />);

    const link = screen.getByRole("link", { name: /view source code on codeberg/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("https://codeberg.org/percy-raskova/cycles");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders help and settings buttons", () => {
    render(<MenuBar onOpenHelp={() => {}} onOpenSettings={() => {}} />);

    expect(screen.getByRole("button", { name: /open help/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /open settings/i })).toBeTruthy();
  });
});
