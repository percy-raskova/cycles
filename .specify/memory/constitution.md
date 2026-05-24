<!--
SYNC IMPACT REPORT
Version change: 1.0.0 → 1.1.0 (two new principles + expanded workflow section)
Modified principles: None renamed
Added principles:
  - VI. Immutability by Default
  - VII. Canonical Rules Fidelity
Expanded sections:
  - Development Workflow & Quality Gates: added Speckit workflow detail,
    property-based testing mandate, No-CI / pre-commit-only enforcement
Removed sections: None
Templates requiring updates:
  - All templates reviewed and verified aligned ✅
Deferred items: RATIFICATION_DATE still TODO — original adoption date unknown
-->

# CYCLES Constitution

## Core Principles

### I. Engine Purity

The game engine in `src/core/` MUST remain a pure TypeScript module with zero framework dependencies.

- No React imports, no DOM references, no browser APIs in `src/core/`.
- All state is immutable; all functions are pure and side-effect free.
- The engine is independently testable with no UI rendering required.
- UI components in `src/ui/` consume engine state via thin, stateless React wrappers.

**Rationale**: Separating game logic from rendering ensures the rules can be tested in isolation, reused across platforms (web, CLI, future native), and reasoned about without React lifecycle complexity.

### II. Test-First Discipline

Every change to `src/core/` MUST be driven by a failing test before implementation.

- `src/core/` maintains a minimum 90% test coverage threshold enforced in CI.
- Property-based tests (fast-check) MUST cover geometric invariants and edge cases.
- Integration tests MUST verify full user journeys: place coin, join coins, close cycle, auto-pass, terminal state.
- The pre-commit hook runs the full test suite; a failing suite blocks commit.

**Rationale**: The game rules are subtle and edge-case heavy. Test-first development catches rule violations at write-time rather than play-test-time.

### III. UI/Engine Separation

`src/ui/` is a rendering layer only. It MUST NOT contain game logic, state mutation, or rule enforcement.

- All state changes flow through engine actions (`place`, `join`, `pass`).
- UI components are thin and stateless where possible.
- The `@core/` alias is the only permitted import path from `src/ui/` into `src/core/`.

**Rationale**: Prevents UI bugs from corrupting game state and allows the UI to be radically restyled (e.g., vaporwave themes) without touching rule correctness.

### IV. Pre-Commit Quality Gates

No commit may reach the repository without passing all automated quality checks.

- Biome lint and format MUST pass on staged files.
- `tsc --noEmit` MUST pass with zero errors.
- The full Vitest suite MUST pass with zero failures.
- `simple-git-hooks` enforces this via `lint-staged`.

**Rationale**: Automated gates prevent style drift, type regressions, and broken tests from entering the codebase, preserving velocity for all contributors.

### V. Accessibility by Default

The user interface MUST be usable by players with diverse abilities and devices.

- Dark mode is the default; no light-mode flash on load.
- All text MUST meet WCAG 2.1 Level AA contrast (4.5:1 body, 3:1 large text/UI).
- Information MUST NOT be conveyed by color alone; use shape, pattern, or labels.
- All interactive elements MUST have visible keyboard focus indicators (≥3:1 contrast).
- Touch targets MUST be at least 44×44 CSS pixels.

**Rationale**: Accessibility is not a feature to add later; it is a constraint on every UI decision. Retro aesthetics (vaporwave, Win95) must not compromise legibility or navigability.

### VI. Immutability by Default

All game state MUST be treated as immutable. Mutating state in-place is forbidden.

- Engine data structures (`GameState`, `Coin`, `Edge`, `Session`) MUST use `readonly` fields, `ReadonlyMap`, and `readonly` arrays.
- State transition functions MUST return new objects; they MUST NOT modify inputs.
- UI components MUST NOT mutate engine state directly; all mutations flow through engine action functions.

**Rationale**: Immutability makes state changes explicit, enables cheap undo/redo, prevents React re-render bugs, and allows property-based testing to reason about state transitions as pure functions.

### VII. Canonical Rules Fidelity

The engine implementation MUST match `cycles-spec.md` exactly. The written rules are the single source of truth.

- Any ambiguity in the spec MUST be resolved by consulting `cycles-spec.md` before changing code.
- New rules discovered during development (e.g., edge blocking placement) MUST be documented in `cycles-spec.md` before being enforced in the engine.
- The CLI and web UIs MUST present identical game behavior; divergence is treated as a bug in the engine, not a UI variation.

**Rationale**: A board game has no "undefined behavior." If two implementations of CYCLES produce different outcomes for the same sequence of moves, at least one is wrong. The written rules prevent this.

---

## Technology Stack Requirements

- **Language**: TypeScript 5.x with strict mode enabled (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **Frontend**: React 18.x, Vite 5.x, pure CSS (no CSS-in-JS libraries).
- **Package Manager**: bun.
- **Lint/Format**: Biome (replaces ESLint + Prettier).
- **Test Runner**: Vitest with `@testing-library/react` and `fast-check` for property-based testing.
- **Deployment**: Cloudflare Pages via `wrangler pages deploy`.
- **Build Output**: Static `dist/` directory; SPA fallback via `public/_redirects`.

---

## Development Workflow & Quality Gates

1. **Speckit Workflow**: All features flow through `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`. The active feature directory is tracked in `.specify/feature.json`. Artifacts (spec, plan, research, data-model, contracts, tasks) live under `specs/NNN-feature-name/`.
2. **Branching**: Each feature gets a sequentially numbered branch (`NNN-feature-name`).
3. **No CI/CD**: The project intentionally has no GitHub Actions or remote CI. Quality is enforced exclusively through local pre-commit hooks. This is a deliberate constraint, not a gap.
4. **Pre-commit**: `simple-git-hooks` → `lint-staged` (Biome) → `tsc --noEmit` → `vitest run`.
5. **Coverage Gate**: `src/core/` must maintain ≥90% coverage; UI coverage is encouraged but not enforced.
6. **Complexity Gate**: Cognitive complexity per function SHOULD NOT exceed 15; exemptions MUST be documented inline.
7. **Property-Based Testing**: Invariants (e.g., coin count never exceeds 12, `edgeIntersects` symmetry, `coinsRemaining + placedCoins === 12`) MUST be expressed as `fast-check` property tests in addition to example-based tests.

---

## Governance

This Constitution supersedes all other development practices in the CYCLES repository.

### Amendment Procedure

1. Propose an amendment as a modification to `.specify/memory/constitution.md`.
2. Update the **Sync Impact Report** (HTML comment at top of file) to document version bump rationale.
3. Follow semantic versioning for the Constitution version:
   - **MAJOR**: Backward-incompatible principle removal or redefinition.
   - **MINOR**: New principle added, new mandatory section, or materially expanded guidance.
   - **PATCH**: Clarifications, wording improvements, typo fixes.
4. Amendments take effect immediately upon merge to the main branch.

### Compliance Review

- All PRs MUST verify compliance with the Constitution (engine purity, test coverage, pre-commit gates, accessibility).
- The `AGENTS.md` file is the runtime guidance document; it MUST be updated when Constitution changes affect tooling, workflow, or directory structure.

---

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): Original project start date unknown; set when first contributor confirms | **Last Amended**: 2026-05-24
