# Implementation Plan: PWA Conversion

**Feature**: [009-pwa-conversion](specs/009-pwa-conversion/spec.md)  
**Branch**: `009-pwa-conversion`  
**Created**: 2026-05-25

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  User-Agent  │───▶│   Routing    │───▶│  /pwa/ or /      │   │
│  │   Detection  │    │   Function   │    │  (with override) │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
        ┌─────▼──────┐                 ┌──────▼──────┐
        │  Desktop   │                 │    PWA      │
        │   Build    │                 │   Build     │
        │  (/dist)   │                 │  (/dist-pwa)│
        └─────┬──────┘                 └──────┬──────┘
              │                               │
        ┌─────▼──────┐                 ┌──────▼──────┐
        │ Desktop UI │                 │  PWA UI   │
        │ (Win95)    │                 │  (Mobile)  │
        └────────────┘                 └─────────────┘
                                              │
                                       ┌──────▼──────┐
                                       │ localStorage │
                                       │   Session   │
                                       │ Persistence │
                                       └─────────────┘
```

---

## Phase 1: Dual Build System (Week 1)

### Task 1.1: Create PWA Vite Configuration
- **What**: Create `vite.pwa.config.ts` alongside existing `vite.config.ts`
- **Changes**:
  - `vite.config.ts` → desktop build (unchanged, serves `/`)
  - `vite.pwa.config.ts` → PWA build with:
    - `base: '/pwa/'`
    - `outDir: 'dist-pwa'`
    - Enhanced manifest with PWA-specific fields
    - Service worker with offline-first cache strategy
    - Styling adjustments for mobile/touch
- **Validation**: Both builds produce distinct output directories

### Task 1.2: Update Build Scripts
- **What**: Add PWA build commands to `package.json`
- **Changes**:
  - `"build:pwa": "tsc && vite build --config vite.pwa.config.ts"`
  - `"build:all": "npm run build && npm run build:pwa"`
  - Update CI pipeline to build both variants
- **Validation**: `bun run build:all` produces `dist/` and `dist-pwa/`

### Task 1.3: Shared Assets Strategy
- **What**: Ensure icons, fonts, and core game assets are shared between builds
- **Approach**:
  - Keep `public/` directory for shared assets
  - Use symlinks or copy in build scripts
  - Manifest icons reference same files
- **Validation**: Both builds include identical game assets

---

## Phase 2: State Persistence Layer (Week 1-2)

### Task 2.1: Design Persistence Schema
- **What**: Define localStorage schema for game session serialization
- **Schema**:
  ```typescript
  interface PersistedSession {
    version: number;      // Schema version for migrations
    timestamp: number;    // Last save time
    session: SerializedSession;  // From existing serialization.ts
  }
  ```
- **Key**: `cycles.session.v1`
- **Validation**: Schema is versioned and documented

### Task 2.2: Implement Persistence Hook
- **What**: Create `usePersistentSession()` hook wrapping `useGameSession()`
- **Behavior**:
  - On mount: Deserialize from localStorage if present
  - On session change: Debounced save (500ms)
  - On new game / terminal: Clear persisted state
  - On version mismatch: Discard old state, start fresh
- **Integration**: Wrap existing `useGameSession` in `App.tsx`
- **Validation**: Session survives tab close/reopen

### Task 2.3: Handle Storage Limits
- **What**: Graceful degradation when localStorage is full or unavailable
- **Behavior**:
  - Try/catch around all storage operations
  - Warn user if persistence fails (console + optional toast)
  - Continue gameplay even if persistence is unavailable
- **Validation**: Game works in private browsing mode (no storage)

---

## Phase 3: PWA UI Adaptations (Week 2)

### Task 3.1: Create PWA Entry Point
- **What**: Create `src/pwa/App.tsx` as mobile-optimized entry
- **Changes**:
  - Simpler chrome (no Win95 desktop chrome)
  - Touch-first controls (larger hit targets)
  - Bottom sheet modals instead of center dialogs
  - Portrait-optimized board layout
  - Hide taskbar/menu bar; use hamburger menu
- **Shared**: Core game engine, board components, game logic
- **Validation**: PWA UI renders correctly on mobile viewport

### Task 3.2: Install Prompt Component
- **What**: Custom install prompt for browsers supporting `beforeinstallprompt`
- **Behavior**:
  - Detect installability via `beforeinstallprompt` event
  - Show subtle banner (not intrusive) with install button
  - Dismissible; don't show again if user declines
  - iOS Safari: Show "Add to Home Screen" instructions
- **Validation**: Prompt appears on Chrome Android, Edge desktop

### Task 3.3: Offline Fallback Page
- **What**: Static offline page shown when no cache and no network
- **Content**: "CYCLES requires an internet connection for first visit. Please connect and try again."
- **Integration**: Service worker serves this for navigation when offline with empty cache
- **Validation**: Works in airplane mode on first visit

---

## Phase 4: Cloudflare Edge Routing (Week 2-3)

> **Reference**: Cloudflare docs confirm Pages Functions use `env.ASSETS.fetch()` to serve static assets. The A/B testing pattern (modifying `url.pathname` before `env.ASSETS.fetch(url)`) is the recommended approach for serving different content based on request attributes.

### Task 4.1: Single Output Directory with Subpath
- **What**: Build both desktop and PWA into a single `dist/` directory
- **Structure**:
  ```
  dist/
  ├── index.html          # Desktop entry
  ├── assets/             # Desktop JS/CSS bundles
  ├── icons/              # Shared icons
  ├── manifest.json       # Desktop manifest
  ├── pwa/
  │   ├── index.html      # PWA entry
  │   ├── assets/         # PWA JS/CSS bundles
  │   └── manifest.json   # PWA manifest (start_url: "/pwa/")
  ```
- **Build Process**:
  1. `vite build` → outputs desktop to `dist/` (unchanged)
  2. `vite build --config vite.pwa.config.ts` → outputs PWA to `dist/pwa/`
- **Validation**: `dist/pwa/` contains complete standalone PWA build

### Task 4.2: Configure Pages Functions Middleware
- **What**: Create `functions/_middleware.ts` using Cloudflare's file-based routing
- **Behavior** (based on Cloudflare A/B testing pattern):
  ```typescript
  export const onRequest = async (context) => {
    const url = new URL(context.request.url);
    const cookie = context.request.headers.get("cookie") || "";
    const prefersDesktop = cookie.includes("cycles.prefers-desktop=true");
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(
      context.request.headers.get("user-agent") || ""
    );

    // Path already under /pwa/ — serve PWA assets directly
    if (url.pathname.startsWith("/pwa/")) {
      return context.env.ASSETS.fetch(url);
    }

    // Mobile user without desktop preference → redirect to /pwa/
    if (isMobile && !prefersDesktop) {
      url.pathname = "/pwa/" + url.pathname.slice(1);
      return Response.redirect(url.toString(), 302);
    }

    // Desktop or explicit desktop preference → serve desktop assets
    return context.next();
  };
  ```
- **Key Points from Cloudflare Docs**:
  - `env.ASSETS.fetch()` serves static assets from the Pages build output
  - Modifying `url.pathname` before `fetch()` serves assets from a different path
  - Cookie-based override prevents redirect loops
- **Validation**: Tests with different user agents produce correct routing

### Task 4.3: Desktop ↔ PWA Toggle
- **What**: Add version switcher in both UIs
- **Desktop**: Footer link "Switch to Mobile Version" → `/pwa/`
- **PWA**: Settings/menu option "Use Desktop Version" → sets cookie `cycles.prefers-desktop=true; Path=/; Max-Age=2592000`, redirects to `/`
- **Validation**: Toggle works bidirectionally; cookie survives session

### Task 4.4: Deploy Configuration
- **What**: No special wrangler.toml needed for Pages Functions
- **Changes**:
  - `functions/_middleware.ts` is automatically picked up by Cloudflare Pages
  - Both desktop and PWA builds live in same `dist/` output
  - `_routes.json` (optional) to exclude static assets from Function invocations
- **Validation**: Both versions accessible on deployed preview URL

---

## Phase 5: PWA Testing Suite (Week 3)

### Task 5.1: Manifest Validation Tests
- **What**: Unit tests verifying manifest JSON structure
- **Tests**:
  - Required fields present (name, short_name, icons, display, etc.)
  - Icons array has 192px and 512px PNG + SVG
  - Theme/background colors are valid hex
  - Start URL and scope are correct
- **Location**: `tests/pwa/manifest.test.ts`

### Task 5.2: Service Worker Tests
- **What**: Verify SW registration and caching
- **Approach**: Use `msw` or custom test harness to mock SW environment
- **Tests**:
  - SW registers without errors
  - Core assets are in precache manifest
  - Cache-first strategy serves offline
  - Update flow triggers reload prompt
- **Location**: `tests/pwa/service-worker.test.ts`

### Task 5.3: Offline Gameplay Tests
- **What**: Playwright tests in offline mode
- **Tests**:
  - Game loads and is playable with network disconnected
  - All 242 existing unit tests pass (they're pure TS, already offline-capable)
  - State persistence works across reloads
  - Game-over screen displays correctly offline
- **Location**: `tests/pwa/offline.playwright.test.ts`

### Task 5.4: Lighthouse PWA Audit
- **What**: Automated Lighthouse CI check
- **Integration**:
  - `tests/pwa/lighthouse.test.ts` runs Lighthouse programmatically
  - Assert PWA category score ≥ 90
  - Include in CI pipeline (`.woodpecker/ci.yml`)
- **Validation**: Fails CI if PWA score drops below threshold

### Task 5.5: E2E Routing Tests
- **What**: Verify Cloudflare routing logic
- **Tests**:
  - Mobile UA → `/pwa/` (redirect)
  - Desktop UA → `/` (no redirect)
  - Cookie override bypasses UA detection
  - `/pwa/` path serves correct build
- **Location**: `tests/pwa/routing.test.ts`

---

## Phase 6: Service Worker Optimization (Week 3-4)

### Task 6.1: Cache Strategy Configuration
- **What**: Configure `vite-plugin-pwa` workbox options
- **Strategy**:
  - Precache: App shell (HTML, JS, CSS, icons)
  - Runtime cache: Game assets (fonts, sounds if any)
  - Cache naming: `cycles-pwa-v{version}`
  - Cleanup: Delete old caches on activation
- **Validation**: SW activates and caches are populated

### Task 6.2: Update Flow
- **What**: Handle new deployments gracefully
- **Behavior**:
  - New SW waits in background
  - Show "Update available" banner with reload button
  - Auto-update after 24 hours (using `registerType: 'autoUpdate'`)
  - Immediate update on user clicking "Update"
- **Validation**: Old caches are cleaned up after update

### Task 6.3: Background Sync (Optional v1.1)
- **Status**: Out of scope for v1
- **Note**: Documented in plan but deferred. No push notifications.

---

## Testing Strategy

### Test Matrix

| Test Type | Desktop | PWA | Offline |
|-----------|---------|-----|---------|
| Unit (core) | ✅ | ✅ | ✅ (pure TS) |
| Component (React) | ✅ | ✅ | ✅ (jsdom) |
| Integration | ✅ | ✅ | ✅ |
| E2E (Playwright) | ✅ | ✅ | ✅ (throttle network) |
| PWA Audit (Lighthouse) | N/A | ✅ | N/A |
| Manifest Validation | N/A | ✅ | N/A |
| SW Registration | N/A | ✅ | N/A |
| State Persistence | N/A | ✅ | ✅ |

### CI Pipeline Updates

```yaml
# .woodpecker/ci.yml additions
- name: build-pwa
  image: node:20
  commands:
    - bun run build:pwa
  
- name: pwa-audit
  image: cypress/browsers:latest
  commands:
    - bun run test:pwa
```

---

## Dependencies & Risks

### New Dependencies
- `workbox-window` (for SW update UI) - already bundled with vite-plugin-pwa
- `lighthouse` (for CI audit) - dev dependency

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Two builds double build time | Medium | Parallel builds in CI; local dev uses single build |
| Storage quota exceeded | Low | Compressed session JSON; alert if >100KB |
| SW update breaks active games | Medium | Save before reload; session persistence survives |
| iOS Safari PWA limitations | Medium | Test on real devices; graceful degradation |
| Cache invalidation issues | Medium | Versioned cache names; aggressive cleanup |

---

## Definition of Done

- [ ] Two builds (`dist/` and `dist-pwa/`) both pass `bun run typecheck && bun run lint && bun run test:run`
- [ ] PWA build achieves Lighthouse PWA score ≥ 90
- [ ] Game state persists across browser restarts (localStorage)
- [ ] Cloudflare routing directs mobile → `/pwa/`, desktop → `/`
- [ ] Install prompt works on Chrome Android and Edge desktop
- [ ] All 242 existing tests pass + 15+ new PWA tests pass
- [ ] Both versions deployed and accessible on preview URL
- [ ] README updated with PWA build and deploy instructions

---

## Rollback Plan

If issues arise:
1. Revert to single build (`vite.config.ts` only)
2. Remove `/pwa/` path from Cloudflare routing
3. Keep state persistence hook (it's backward-compatible)
4. PWA tests can be skipped with `bun run test:run --exclude tests/pwa/`
