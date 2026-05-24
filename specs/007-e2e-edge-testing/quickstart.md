# Quickstart: E2E Edge-Case Testing

**Date**: 2026-05-22  
**Feature**: Comprehensive E2E Edge-Case Testing  
**Plan**: [plan.md](plan.md)

## Prerequisites

- [bun](https://bun.sh/) installed
- Node.js available (for Playwright browser downloads)
- Git repository cloned and on branch `007-e2e-edge-testing`

## Install Dependencies

```bash
bun install
```

For Playwright (one-time setup):

```bash
npx playwright install
```

## Run Unit + Integration Tests

```bash
# Watch mode
bun run test

# Single run (CI)
bun run test:run

# With coverage report
bun run test:run --coverage
```

## Run Playwright E2E Tests

```bash
# Run all E2E tests (headless)
bun run e2e

# Run with UI mode (for debugging)
bun run e2e:ui

# Run a specific spec
bun run e2e -- tests/e2e/specs/place-coin.spec.ts
```

The E2E tests automatically start the Vite preview server on `http://localhost:5173` via Playwright's `webServer` config.

## Run Dev Server

```bash
bun run dev
```

Open `http://localhost:5173` in your browser.

## Run Production Build

```bash
bun run build
```

Output goes to `dist/`.

## Lint and Typecheck

```bash
bun run lint        # Biome check
bun run lint:write  # Biome auto-fix
bun run typecheck   # tsc --noEmit
```

## Coverage Report

After running `bun run test:run --coverage`, open:

```
coverage/index.html
```

Check that `src/core/geometry.ts`, `src/core/state.ts`, and `src/core/move.ts` show 100% branch coverage.

## Troubleshooting

### Playwright browsers not found

```bash
npx playwright install
```

### Port 5173 already in use

Either kill the existing process or change the port in `playwright.config.ts`.

### Tests timeout on CI

Increase `timeout` in `playwright.config.ts` or `vitest.config.ts`.

### Pre-commit hook fails

```bash
bun run lint:write
bun run typecheck
bun run test:run
# Stage fixes and re-commit
```
