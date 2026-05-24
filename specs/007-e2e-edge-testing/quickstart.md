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
bun run test:coverage

# Verbose output with per-test timing
bun run test:verbose

# Open HTML report
bun run test:report
```

## Run Playwright E2E Tests

```bash
# Run all E2E tests (headless, Chromium + Firefox)
bun run e2e

# Run Chromium only
bun run e2e -- --project=chromium

# Run with UI mode (for debugging)
bun run e2e:ui

# Run a specific spec
bun run e2e -- tests/e2e/specs/place-coin.spec.ts

# Open HTML report
bun run e2e:report
```

The E2E tests automatically start the Vite preview server on `http://localhost:4173` via Playwright's `webServer` config.

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

### Port 4173 already in use

Either kill the existing process or change the port in `playwright.config.ts` and `vite preview --port`. Preview uses 4173 by default; dev server uses 5173.

### Tests timeout on CI

Increase `timeout` in `playwright.config.ts` or `vitest.config.ts`.

### Pre-commit hook fails

```bash
bun run lint:write
bun run typecheck
bun run test:run
# Stage fixes and re-commit
```
