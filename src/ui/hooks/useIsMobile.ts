import { useEffect, useState } from "react";

/** Matches the breakpoint used by the App.css mobile / desktop CSS toggle. */
const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Reactively tracks whether the viewport is at the mobile breakpoint.
 *
 * Used to skip work in the *inactive* layout (e.g., the face popup's
 * `useLayoutEffect`-driven `getBoundingClientRect` reads) without changing
 * the dual-mount contract that integration tests rely on. Both `<GamePage>`
 * and `<MobileApp>` continue to mount; only specific cost-heavy sub-trees
 * become conditional on `isMobile`.
 *
 * SSR-safe: `window` is checked before reading `matchMedia`; initial value
 * defaults to `false` (desktop) when matchMedia isn't available.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    // Sync initial value in case it changed between render and effect.
    setIsMobile(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
