# Architecture Decisions

## 2026-05-20: Dev Environment Scaffold

### TypeScript strict + Vite + Vitest
Vite provides the dev server and React build. Vitest provides the test runner with native ESM support and sub-second watch mode, which makes TDD viable. `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are enabled to catch the category of bugs LLMs reliably produce.

### Biome for lint and format (Option B)
Biome replaces both ESLint and Prettier in a single Rust-based tool. The user explicitly chose Option B: Biome's built-in complexity rules instead of adding `eslint-plugin-sonarjs`. This means we get cognitive complexity gating (`noExcessiveCognitiveComplexity`, threshold 15) but we do not get max function length (50) or max file length (300) enforcement. Those gaps are acceptable because the primary defense against LLM sprawl here is the `core/` / `ui/` split and mandatory test coverage, not file-length metrics.

### `core/` / `ui/` split
The game engine (board state, move validation, geometry, cycle detection) lives in `src/core/` with zero React imports and 100% test coverage target. React in `src/ui/` imports from `core/` and is a thin rendering layer. This makes the engine trivially testable and allows a CLI version or alternate UI without rewriting logic.

### fast-check for property-based testing
Game invariants like "coin count never exceeds 12" and "coinsRemaining + placedCoins === 12" are expressed as one-line property tests. This surfaces edge cases example-based tests miss.

### simple-git-hooks + lint-staged
Pre-commit runs Biome on staged files, then `tsc --noEmit`, then the full test suite. This is heavier than lint-staged alone but keeps the barrier low: the project is small enough that the full test loop is still sub-second.

### bun as package manager
Chosen for speed. The lockfile (`bun.lockb`) should be committed.

### Cloudflare Pages
Build command: `bun run build` (or `npm run build` in CI). Output directory: `dist`. `public/_redirects` contains a SPA fallback so client-side routing works.

### No GitHub Actions CI
The user explicitly declined CI as overkill for this workflow. Pre-commit hooks are the enforcement layer.
