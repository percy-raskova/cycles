export type LogFn = (...args: readonly unknown[]) => void;

export interface Logger {
  readonly debug: LogFn;
  readonly info: LogFn;
  readonly warn: LogFn;
  readonly error: LogFn;
}

/**
 * Debug logging is on in dev builds, and can be toggled in any build via
 * `localStorage["cycles:debug"] = "1"` or a `?debug` query param — so logs are
 * also reachable in the preview/e2e build, which is otherwise production-mode.
 */
export function isDebugEnabled(): boolean {
  try {
    if (import.meta.env?.DEV) return true;
  } catch {
    /* import.meta.env may not be defined in all environments */
  }
  if (
    typeof localStorage !== "undefined" &&
    typeof localStorage.getItem === "function" &&
    localStorage.getItem("cycles:debug") === "1"
  ) {
    return true;
  }
  if (typeof window !== "undefined" && window.location?.search.includes("debug")) {
    return true;
  }
  return false;
}

export function createLogger(namespace: string): Logger {
  const prefix = `[CYCLES:${namespace}]`;
  const gated =
    (sink: LogFn): LogFn =>
    (...args) => {
      if (isDebugEnabled()) sink(prefix, ...args);
    };

  return {
    debug: gated((...args) => console.debug(...args)),
    info: gated((...args) => console.info(...args)),
    warn: gated((...args) => console.warn(...args)),
    error: (...args) => console.error(prefix, ...args),
  };
}
