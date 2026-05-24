# Research: E2E Edge-Case Testing

**Date**: 2026-05-22  
**Feature**: Comprehensive E2E Edge-Case Testing  
**Plan**: [plan.md](plan.md)

## Research Questions

### Q1: How to integrate Playwright with Vite + bun?

**Decision**: Use `@playwright/test` with a `webServer` configuration that runs `bun run preview` (or `bun run dev`) on a fixed port.

**Rationale**:
- Playwright's `webServer` config is framework-agnostic. It starts a command, waits for a URL to be ready, then runs tests.
- `bun run preview` serves the production build from `dist/`, which is more stable than `dev` for E2E (no HMR noise).
- Alternative: `bun run dev` — faster to start but may have HMR-related flakiness. We will support both.
- Playwright's TypeScript support is first-class; no transpilation needed.

**Alternatives considered**:
- **Cypress**: Heavier, its own test runner, harder to integrate with bun. Rejected.
- **Puppeteer**: Lower-level, no built-in test runner. Rejected.
- **Selenium**: Overkill for this scope. Rejected.

### Q2: What property-based test strategy covers the most game invariants with minimal runtime?

**Decision**: Use `fast-check` with a custom `boardState` arbitrary that generates small grids (4×4), random coin placements, random edges, and random moves. Verify post-move invariants.

**Rationale**:
- Full 7×7 grid with 12 coins has too many states for exhaustive property testing. 4×4 with 6 coins reduces state space while preserving all geometric invariants.
- Key invariants to verify:
  1. `isValidState` holds after every legal move.
  2. `legalJoins` returns only pairs where `isLegalJoin` is true.
  3. `edgeIntersects(a, b, c, d)` === `edgeIntersects(c, d, a, b)` (symmetry).
  4. `pointInPolygon(p, poly)` is deterministic for the same inputs.
  5. After a JOIN, the number of coins does not change.
  6. After a PLACE, `coinsRemaining` decreases by 1.
- Run 1,000 iterations per property. Each iteration is fast (< 1ms) on small grids.

**Alternatives considered**:
- **Model-based testing**: Maintain a reference model and compare states. Powerful but complex to implement. Deferred to future sprint.
- **Exhaustive enumeration**: Enumerate all board states up to N coins. Feasible for 3×3 but explodes for 4×4. Rejected.

### Q3: How to implement "edges block placement along their line"?

**Decision**: Add a `positionBlockedByEdge` helper in `src/core/geometry.ts` that tests if a point lies on the segment of any existing edge. Use it in `legalPlacements` (and optionally `placeCoin`) to filter/reject blocked positions.

**Rationale**:
- The `geometry.ts` module already has `pointOnSegment` (private). We will export it (or a wrapper) for use in `state.ts`.
- `legalPlacements` is the authoritative list of valid PLACE targets; filtering there ensures the UI and engine agree.
- `placeCoin` should also independently validate (defense in depth), but `legalPlacements` is the primary gate.
- A position is blocked if: for ANY existing edge `{from, to}`, the position is collinear with `from` and `to` AND lies between them (inclusive of endpoints? No — endpoints have coins, so they can't be empty anyway. Exclusive of endpoints is sufficient since endpoints are occupied).

**Alternatives considered**:
- Block only positions strictly between edge endpoints: Correct, since endpoints are already occupied by coins.
- Block the entire row/col/diagonal: Would be too restrictive and violate the rules. Rejected.
- Block only if the edge is drawn: Yes, this is what we want. An edge only exists if both endpoints have coins.

## References

- [Playwright webServer docs](https://playwright.dev/docs/test-webserver)
- [fast-check arbitraries](https://fast-check.dev/docs/core-concepts/arbitraries/)
- [Vitest coverage thresholds](https://vitest.dev/config/#coverage)
