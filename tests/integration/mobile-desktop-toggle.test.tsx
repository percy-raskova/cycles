import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../../src/ui/App";
import { startGameFromSetup } from "../helpers/setup-helpers";

describe("Mobile / Desktop viewport toggle", () => {
  function setViewportWidth(width: number) {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });

    // Mock matchMedia for CSS media queries
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches:
        query.includes(`${width}px`) ||
        (width <= 767 ? query.includes("max-width") : query.includes("min-width")),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  it("shows desktop layout at 1024px viewport", async () => {
    setViewportWidth(1024);

    const { container } = render(<App />);
    await startGameFromSetup();

    const desktopLayout = container.querySelector(".app-stage");
    const mobileLayout = container.querySelector(".mobile-app");

    expect(desktopLayout).not.toBeNull();
    expect(mobileLayout).not.toBeNull();
    // Desktop should be visible, mobile hidden (both mount; CSS handles visibility)
    expect(desktopLayout?.classList.contains("app-stage")).toBe(true);
    expect(mobileLayout?.classList.contains("mobile-app")).toBe(true);
  });

  it("shows mobile layout at 375px viewport", async () => {
    setViewportWidth(375);

    const { container } = render(<App />);
    await startGameFromSetup();

    const desktopLayout = container.querySelector(".app-stage");
    const mobileLayout = container.querySelector(".mobile-app");

    expect(desktopLayout).not.toBeNull();
    expect(mobileLayout).not.toBeNull();
  });

  it("renders mobile-specific elements at narrow viewport", async () => {
    setViewportWidth(375);

    render(<App />);
    await startGameFromSetup();

    expect(screen.getByText("CYCLES")).toBeDefined();
    expect(screen.getByLabelText("Open menu")).toBeDefined();
    expect(screen.getByText("Tap")).toBeDefined();
    expect(screen.getByText("Pass")).toBeDefined();
  });

  it("renders desktop-specific elements at wide viewport", async () => {
    setViewportWidth(1024);

    render(<App />);
    await startGameFromSetup();

    expect(screen.getByLabelText("Reset game to initial state")).toBeDefined();
    expect(screen.getByLabelText("Open help")).toBeDefined();
  });
});
