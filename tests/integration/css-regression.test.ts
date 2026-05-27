import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Theme CSS regression — pointer-events", () => {
  it("contains pointer-events: all on .touch class", () => {
    const cssPath = resolve(__dirname, "../../src/ui/theme.css");
    const css = readFileSync(cssPath, "utf-8");

    // The fix for Firefox SVG hit-testing requires this exact rule
    const touchRule = css.match(/\.touch\s*\{[^}]*pointer-events:\s*all[^}]*\}/);
    expect(touchRule).not.toBeNull();
  });
});
