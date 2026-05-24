import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "../logger";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("createLogger", () => {
  it("does not emit debug/info/warn when disabled", () => {
    vi.stubEnv("DEV", false);
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const log = createLogger("test");
    log.debug("hidden");
    log.info("hidden");
    log.warn("hidden");

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("emits namespace-prefixed debug when enabled via DEV", () => {
    vi.stubEnv("DEV", true);
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    const log = createLogger("ui");
    log.debug("clicked", { row: 0, col: 0 });

    expect(debug).toHaveBeenCalledWith("[CYCLES:ui]", "clicked", { row: 0, col: 0 });
  });

  it("always emits error regardless of the enabled flag", () => {
    vi.stubEnv("DEV", false);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const log = createLogger("session");
    log.error("undo failed", "boom");

    expect(error).toHaveBeenCalledWith("[CYCLES:session]", "undo failed", "boom");
  });
});
