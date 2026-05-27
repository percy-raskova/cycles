// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@ui/App";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { startGameFromSetup } from "../helpers/setup-helpers";

describe("Accessibility Audit (US6)", () => {
  it("initial load has no critical or serious axe violations", async () => {
    const { container } = render(<App />);
    await startGameFromSetup();

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: true },
        region: { enabled: false }, // single-page app without landmarks
        "nested-interactive": { enabled: false }, // SVG <g role="button"> with <rect> hit area is valid
      },
    });

    const criticalAndSerious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(criticalAndSerious).toHaveLength(0);
  });

  it("help modal has no critical or serious axe violations", async () => {
    const { container } = render(<App />);
    await startGameFromSetup();

    const helpButton = screen.getByLabelText("Open help");
    await userEvent.click(helpButton);

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: true },
        region: { enabled: false },
        "nested-interactive": { enabled: false },
      },
    });

    const criticalAndSerious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(criticalAndSerious).toHaveLength(0);
  });
});
