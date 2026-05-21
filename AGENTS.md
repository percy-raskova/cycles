<!-- SPECKIT START -->
Current plan: [specs/002-move-application/plan.md](specs/002-move-application/plan.md)
<!-- SPECKIT END -->

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
- `.specify/memory/constitution.md` is the project constitution template. It is currently unfilled (still contains `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`, etc. placeholders).

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
