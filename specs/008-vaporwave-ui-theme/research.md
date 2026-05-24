# Research: Vaporwave Win95 UI Theme and Repository Credit

**Feature**: Vaporwave Win95 UI Theme and Repository Credit
**Date**: 2026-05-24

---

## Decision 1: Visual Regression Testing Approach

**Question**: How to implement automated visual regression testing for a React + Vite + TypeScript project?

**Decision**: Use Vitest with `@vitest/browser` + Playwright for component-level visual regression, supplemented by manual screenshot comparison for cross-browser parity.

**Rationale**:
- The project already uses Vitest for unit and integration tests. Adding `@vitest/browser` allows browser-based component testing within the existing test runner without introducing a second test framework.
- `@vitest/browser` with Playwright provider gives access to real browser rendering engines for accurate visual snapshots.
- Snapshot comparison is native to Vitest (`expect(...).toMatchImageSnapshot()` or `.toMatchFileSnapshot()` with image files).
- Playwright E2E tests are already planned in Sprint 7; extending them for full-page screenshot comparison is minimal additional effort.

**Alternatives considered**:
- **Storybook + Chromatic**: Excellent for design systems, but adds significant tooling overhead (new config, stories to write) for a single feature. Rejected for scope reasons.
- **Cypress + Percy**: Requires Cypress (another test framework) and Percy (paid service). Rejected due to cost and tool proliferation.
- **Manual screenshot testing only**: Insufficient for regression prevention per FR-018.

---

## Decision 2: PWA Manifest and Service Worker

**Question**: What is the simplest, correct way to add PWA support to a Vite + React project?

**Decision**: Use the `vite-plugin-pwa` package from the official PWA Vite ecosystem. It generates the Web App Manifest and injects a service worker with Workbox pre-caching, all configured via `vite.config.ts`.

**Rationale**:
- `vite-plugin-pwa` is the de facto standard for PWA support in Vite projects. It handles manifest generation, service worker injection, and asset pre-caching with minimal configuration.
- It integrates cleanly with the existing Vite build pipeline — no separate build steps.
- Offline support is automatic: Workbox pre-caches the `dist/` assets.
- Manifest fields (`name`, `short_name`, `icons`, `theme_color`, `background_color`, `display`, `start_url`) are configured in the plugin options.

**Alternatives considered**:
- **Manual service worker**: Writing a custom service worker is error-prone and requires manual cache management. Rejected in favor of the well-tested Workbox integration.
- **Cloudflare Pages caching only**: Pages serves static assets, but a service worker is required for true PWA installability and offline play. Rejected.

---

## Decision 3: Responsive Layout Strategy

**Question**: How to make the game board and controls responsive across 320px–1920px without breaking the retro aesthetic?

**Decision**: Use CSS custom properties (variables) for the theme palette and viewport-relative sizing (CSS `clamp()`, `vmin`, `@media` queries) for layout adaptation. The game board SVG scales proportionally within its container.

**Rationale**:
- CSS custom properties allow the entire color palette to be defined once and referenced everywhere, making theme consistency trivial to maintain.
- `vmin`-based sizing for the game board ensures it fits within the smallest viewport dimension (critical on mobile where height is constrained by browser chrome).
- `@media` queries at 480px, 768px, and 1024px breakpoints handle layout shifts (e.g., stacking vs. side-by-side controls).
- SVG viewBox preserves aspect ratio automatically, so the board scales cleanly without JavaScript.

**Alternatives considered**:
- **JavaScript-based responsive scaling**: Adds complexity and potential performance issues. Rejected; CSS handles this natively.
- **Separate mobile/desktop builds**: Overkill for a single-page game. Rejected.

---

## Decision 4: WCAG Testing and Compliance Verification

**Question**: How to verify WCAG 2.1 Level AA compliance (contrast, focus indicators, color independence) automatically?

**Decision**: Use a combination of:
1. **Automated**: Axe-core (via `@axe-core/react` or Playwright `axe-core` integration) for programmatic contrast and a11y rule checking in tests.
2. **Manual**: Lighthouse a11y audit in Chrome DevTools for cross-reference.
3. **Visual**: Manual inspection of focus states and color-blind simulation (Firefox DevTools).

**Rationale**:
- Axe-core is the industry standard for automated accessibility testing and integrates cleanly with React component tests.
- Playwright + axe-core can run full-page audits as part of the E2E suite.
- Manual verification catches issues automated tools miss (e.g., focus ring visibility on custom-styled buttons).

**Alternatives considered**:
- **Pa11y**: Good for full-page scans, but less granular than axe-core for component tests. Considered as a secondary tool.
- **WAVE browser extension**: Manual-only. Useful for spot-checks but not for CI. Rejected as primary approach.

---

## Decision 5: Font Strategy for Retro Aesthetic

**Question**: What typeface best captures the 1990s desktop aesthetic while maintaining legibility and accessibility?

**Decision**: Use "VT323" from Google Fonts as the primary display typeface, with "Space Mono" as the fallback body font. Both are monospaced and evoke the era without sacrificing readability.

**Rationale**:
- VT323 is a bitmap-style font inspired by low-resolution terminals and DOS interfaces. It captures the retro feel for headings and UI labels.
- Space Mono is a clean, well-hinted monospaced font with excellent legibility at small sizes for body text and controls.
- Google Fonts CDN is reliable, free, and requires no self-hosting setup.
- Both fonts support a wide character set and render well on all target platforms (Firefox, Chromium, mobile).

**Alternatives considered**:
- **Press Start 2P**: Very pixelated and blocky. Difficult to read at small sizes and poor for body text. Rejected for primary use.
- **MS Sans Serif (system font)**: The actual Windows 95 font, but not available on all systems and less distinctive. Rejected.
- **Self-hosted pixel font**: Adds asset management overhead. Rejected in favor of Google Fonts simplicity.

---

## Decision 6: Color Palette Definition

**Question**: What specific hex values define the "bisexual fuchsia orchid" vaporwave palette?

**Decision**: Define a palette with CSS custom properties using the following concrete values:

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#0a0a1a` | Deep navy background |
| `--color-surface` | `#14142b` | Elevated surface (panels, dialogs) |
| `--color-surface-raised` | `#1e1e3f` | Slightly lighter surface |
| `--color-fuchsia` | `#ff00ff` | Primary accent, highlights |
| `--color-hot-pink` | `#ff69b4` | Secondary accent, active states |
| `--color-magenta` | `#ff00cc` | Tertiary accent, borders |
| `--color-orchid` | `#da70d6` | Soft accent, hover states |
| `--color-lavender` | `#e6e6fa` | Light text, borders |
| `--color-text-primary` | `#f0e6ff` | Primary body text (light lavender-white) |
| `--color-text-secondary` | `#b8a9c9` | Secondary/muted text |
| `--color-teal` | `#008080` | Contrast accent, links |
| `--color-teal-light` | `#20b2aa` | Hover states for teal elements |

**Rationale**:
- The dark navy background (`#0a0a1a`) provides the "dark mode by default" requirement while making fuchsia/magenta colors pop.
- Lavender-white text (`#f0e6ff`) on dark navy achieves >12:1 contrast ratio, far exceeding WCAG AAA.
- Hot pink (`#ff69b4`) and orchid (`#da70d6`) provide softer accents for non-interactive elements.
- Teal provides a cool contrast to the warm pinks, creating visual depth.

---

## Resolved Clarifications

- **NEEDS CLARIFICATION**: Visual regression tool → Resolved: `@vitest/browser` + Playwright snapshots.
- **NEEDS CLARIFICATION**: PWA setup → Resolved: `vite-plugin-pwa` with Workbox.
- **NEEDS CLARIFICATION**: Responsive strategy → Resolved: CSS custom properties + `vmin` + `@media` queries.
- **NEEDS CLARIFICATION**: WCAG testing → Resolved: Axe-core in tests + Lighthouse + manual verification.
- **NEEDS CLARIFICATION**: Retro typeface → Resolved: VT323 (display) + Space Mono (body).
- **NEEDS CLARIFICATION**: Exact color values → Resolved: Defined 12-token CSS custom property palette.

**No remaining clarifications.**
