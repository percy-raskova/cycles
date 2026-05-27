
## Repo purpose
- Specification document repo for **CYCLES**, a two-player planar-graph game.
- Canonical rules live in `cycles-spec.md`.
- Implementation lives under `src/` (Vite + React UI, pure TypeScript engine in `src/core/`).
- Implementation artifacts from the speckit workflow are generated under `specs/`.

## Speckit workflow (OpenCode integration)
- Commands live in `.opencode/command/` and are invoked as `/speckit.*` (e.g., `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`, `/speckit.constitution`).
- The active feature directory is tracked in `.specify/feature.json` (`feature_directory`). Downstream commands read this file to locate `spec.md`, `plan.md`, `tasks.md`, etc.
- Default feature directory prefix is **sequential** (`001-feature-name`), configured in `.specify/init-options.json`.
- The Git extension (`.specify/extensions.yml`) auto-commits or prompts for commits before and after most workflow phases.

## Load-bearing files & markers
- `AGENTS.md` is the speckit **context file** (`"context_file": "AGENTS.md"` in `.specify/init-options.json`). The `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->` markers must remain; `/speckit.plan` writes the current plan path between them.
- `.specify/memory/constitution.md` is the project constitution, ratified v1.1.0. It defines 7 core principles including Engine Purity, Test-First Discipline, UI/Engine Separation, Pre-Commit Quality Gates, Accessibility by Default, Immutability by Default, and Canonical Rules Fidelity.

## Dev environment
- **Package manager**: bun. Run `bun install` after pulling changes.
- **Dev server**: `bun run dev` (Vite).
- **Build**: `bun run build` → outputs to `dist/` (configured for Cloudflare Pages).
- **Tests**: `bun run test` (Vitest watch mode) or `bun run test:run` (single run).
- **Lint + format**: `bun run lint` (Biome check) or `bun run lint:write` (auto-fix).
- **Typecheck**: `bun run typecheck` (`tsc --noEmit`).
- **Pre-commit**: Biome on staged files + typecheck + full test suite. Configured via `simple-git-hooks`.
- **Coverage**: 90% threshold for `src/core/` only. UI coverage is not enforced.

## Architecture
- `src/core/` — pure game engine. Zero React imports. Immutable state, pure functions. Must have tests.
- `src/ui/` — React rendering layer. Imports from `@core/` alias. Thin and stateless where possible.
- `public/_redirects` — SPA fallback for Cloudflare Pages.

## Operational notes
- The `.opencode/` directory holds the local `@opencode-ai/plugin` dependency. Its `.gitignore` excludes `node_modules/` and lockfiles; do not commit those.
- There is no root `.gitignore` for build artifacts beyond what was created for this dev environment.
- Bash helper scripts in `.specify/scripts/bash/` must be run from the repo root.
- **jsdom polyfills**: `tests/setup-jsdom.ts` patches `HTMLDialogElement.prototype.showModal` and `.close` because jsdom does not implement the `<dialog>` API. This setup file is referenced in `vitest.config.ts` and runs before all tests.
- **Accessibility testing**: `axe-core` is installed for automated WCAG audits. Tests live in `tests/a11y/`. The `nested-interactive` rule is disabled for SVG `<g role="button">` structures with `<rect>` hit areas, which is semantically valid for the game board.
- **PWA manifest**: `vite-plugin-pwa` generates `manifest.json` and a service worker at build time. Icons are in `public/icons/` (192×192 PNG, 512×512 PNG, SVG). Manifest fields (name, display, theme_color, background_color) are configured in `vite.config.ts`.
- **Visual regression**: Snapshot tests are scaffolded in `tests/visual/` and `src/ui/pages/__tests__/GamePage.a11y.test.tsx`. Actual image capture requires `@vitest/browser` + Playwright in browser mode (`bun run test -- --browser`).
- **Touch targets**: Grid intersections use invisible `<rect>` elements (120×120 SVG units) inside `<g role="button">` to ensure ≥44×44 CSS pixels at all viewport sizes. Menu buttons and face selector buttons are sized to 44×44px in CSS.
- **Responsive sizing**: The game board container uses `min(600px, 85vmin)` width/height and `@media (orientation: portrait)` with `95vw` to fit mobile viewports.
- **Playwright E2E**: Browser end-to-end tests live in `tests/e2e/` (specs, page helpers, fixtures). Run with `bun run e2e`. Uses Vite preview server on port 4173. Chromium tests pass; Firefox binary may need updating (`npx playwright install`).
- **Behavior-first tests**: Core engine tests are organized by game behavior under `src/core/__tests__/behavior/` (placement-rules, join-rules, cycle-closure, move-dispatch, session-lifecycle, terminal-conditions, geometry-basics, geometry-properties) rather than by source module.
- **Shared fixtures**: Reusable board-state fixtures live in `tests/fixtures/board-states.ts` and are imported by both core and integration test layers.
- **Woodpecker CI/CD**: Pipeline configuration in `.woodpecker/ci.yml` for Codeberg/Forgejo. Runs lint → typecheck → unit tests → E2E tests → build.
