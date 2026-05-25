# Implementation Tasks: PWA Conversion

**Feature**: [009-pwa-conversion](specs/009-pwa-conversion/spec.md)  
**Plan**: [specs/009-pwa-conversion/plan.md](specs/009-pwa-conversion/plan.md)  
**Branch**: `009-pwa-conversion`

---

## Phase 1: Dual Build System

### Task 1.1: Create PWA Vite Configuration
**Assignee**: AI  
**Estimate**: 2h  
**Dependencies**: None  
**Status**: 🔲 Not Started

- [ ] Create `vite.pwa.config.ts` with:
  - `base: '/pwa/'`
  - `outDir: 'dist/pwa'`
  - Enhanced PWA manifest (mobile-optimized display, icons)
  - Service worker with offline-first caching
- [ ] Update `vite.config.ts` desktop manifest to distinguish from PWA
- [ ] Ensure both configs share the same alias resolution
- [ ] Verify `bun run build` still outputs to `dist/` (desktop)

**Acceptance**: Running `bun run build` and `bun run build:pwa` produces `dist/` and `dist/pwa/` respectively.

---

### Task 1.2: Update Build Scripts
**Assignee**: AI  
**Estimate**: 30m  
**Dependencies**: Task 1.1  
**Status**: 🔲 Not Started

- [ ] Add `"build:pwa": "tsc && vite build --config vite.pwa.config.ts"` to `package.json`
- [ ] Add `"build:all": "bun run build && bun run build:pwa"` to `package.json`
- [ ] Update `.woodpecker/ci.yml` to run both builds
- [ ] Update `.gitignore` to exclude `dist/pwa/` if needed

**Acceptance**: `bun run build:all` completes without errors producing both outputs.

---

### Task 1.3: Shared Assets Strategy
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: Task 1.1  
**Status**: 🔲 Not Started

- [ ] Verify `public/` icons are copied to both `dist/` and `dist/pwa/` during builds
- [ ] Ensure PWA manifest icons reference correct paths (`/icons/` for desktop, `/pwa/icons/` for PWA)
- [ ] Test that icon assets are accessible at both paths

**Acceptance**: Both builds include identical game assets and icons.

---

## Phase 2: State Persistence Layer

### Task 2.1: Design Persistence Schema
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: None  
**Status**: 🔲 Not Started

- [ ] Define `PersistedSession` interface with version, timestamp, serialized session
- [ ] Choose storage key: `cycles.session.v1`
- [ ] Document schema version and migration strategy
- [ ] Estimate storage size (compressed JSON should be < 50KB)

**Acceptance**: Schema is documented and versioned.

---

### Task 2.2: Implement Persistence Hook
**Assignee**: AI  
**Estimate**: 3h  
**Dependencies**: Task 2.1  
**Status**: 🔲 Not Started

- [ ] Create `src/ui/hooks/usePersistentSession.ts`
- [ ] Wrap `useGameSession` with localStorage persistence
- [ ] Implement debounced save (500ms) on session changes
- [ ] Implement restore on mount with version checking
- [ ] Clear storage on new game / terminal state
- [ ] Integrate into `App.tsx` (replace `useGameSession` with `usePersistentSession`)

**Acceptance**: Session survives tab close/reopen. New game clears old state.

---

### Task 2.3: Handle Storage Limits
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: Task 2.2  
**Status**: 🔲 Not Started

- [ ] Wrap all storage operations in try/catch
- [ ] Log warning if `QuotaExceededError` occurs
- [ ] Gracefully fall back to non-persistent mode if storage unavailable
- [ ] Test in private browsing mode (no storage)

**Acceptance**: Game works in incognito/private mode without crashes.

---

### Task 2.4: Persistence Tests
**Assignee**: AI  
**Estimate**: 2h  
**Dependencies**: Task 2.2  
**Status**: 🔲 Not Started

- [ ] Test: Session serializes and deserializes correctly
- [ ] Test: Version mismatch discards old state
- [ ] Test: New game clears persisted state
- [ ] Test: Terminal state clears persisted state
- [ ] Test: Debounced save fires correctly
- [ ] Test: Graceful fallback when storage unavailable

**Acceptance**: All persistence tests pass.

---

## Phase 3: PWA UI Adaptations

### Task 3.1: Create PWA Entry Point
**Assignee**: AI  
**Estimate**: 4h  
**Dependencies**: Task 1.1  
**Status**: 🔲 Not Started

- [ ] Create `src/pwa/App.tsx` — mobile-optimized game shell
- [ ] Create `src/pwa/main.tsx` — PWA entry point
- [ ] Simplify chrome: remove Win95 desktop chrome (no taskbar, title bar, menu bar)
- [ ] Add hamburger menu for settings/help
- [ ] Optimize board layout for portrait/mobile viewport
- [ ] Use bottom sheet modals instead of center dialogs
- [ ] Increase touch targets (≥ 44×44px)
- [ ] Update `vite.pwa.config.ts` to use `src/pwa/main.tsx` as entry

**Acceptance**: PWA UI renders correctly on 375×812 mobile viewport.

---

### Task 3.2: Install Prompt Component
**Assignee**: AI  
**Estimate**: 2h  
**Dependencies**: Task 3.1  
**Status**: 🔲 Not Started

- [ ] Create `src/pwa/components/InstallPrompt.tsx`
- [ ] Listen for `beforeinstallprompt` event
- [ ] Show dismissible install banner with button
- [ ] Remember dismissal in localStorage (don't show again for 30 days)
- [ ] iOS Safari: Show "Add to Home Screen" instructions
- [ ] Add to PWA App layout

**Acceptance**: Install prompt appears on Chrome Android and Edge desktop.

---

### Task 3.3: Offline Fallback Page
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: Task 1.1  
**Status**: 🔲 Not Started

- [ ] Create `public/offline.html` — static fallback page
- [ ] Content: "CYCLES requires an internet connection for first visit"
- [ ] Configure service worker to serve `offline.html` when offline with empty cache
- [ ] Style with vaporwave theme colors

**Acceptance**: Airplane mode on first visit shows offline page.

---

## Phase 4: Cloudflare Edge Routing

### Task 4.1: Build PWA into Subdirectory
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: Task 1.3  
**Status**: 🔲 Not Started

- [ ] Verify `vite.pwa.config.ts` outputs to `dist/pwa/`
- [ ] Ensure `dist/pwa/` contains complete standalone build
- [ ] Verify `dist/pwa/index.html` references assets with `/pwa/` base path
- [ ] Test both builds in `bun run preview`

**Acceptance**: `dist/pwa/` contains functional PWA build.

---

### Task 4.2: Create Pages Functions Middleware
**Assignee**: AI  
**Estimate**: 2h  
**Dependencies**: Task 4.1  
**Status**: 🔲 Not Started

- [ ] Create `functions/_middleware.ts` (file-based routing)
- [ ] Implement user agent detection for mobile devices
- [ ] Redirect mobile requests from `/` to `/pwa/`
- [ ] Check `cycles.prefers-desktop` cookie to skip redirect
- [ ] Ensure `/pwa/*` paths serve PWA assets via `env.ASSETS.fetch()`
- [ ] Add `functions/tsconfig.json` if needed

**Acceptance**: Middleware routes mobile UA to `/pwa/`, desktop stays at `/`.

---

### Task 4.3: Desktop ↔ PWA Toggle
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: Task 4.2  
**Status**: 🔲 Not Started

- [ ] Desktop: Add "Switch to Mobile Version" link in footer/status bar
- [ ] PWA: Add "Use Desktop Version" option in settings/menu
- [ ] Setting desktop preference cookie: `cycles.prefers-desktop=true; Path=/; Max-Age=2592000`
- [ ] Clear cookie when switching back to mobile
- [ ] Redirect after cookie change

**Acceptance**: Toggle works bidirectionally; cookie persists.

---

### Task 4.4: Deploy Configuration
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: Task 4.3  
**Status**: 🔲 Not Started

- [ ] Verify `functions/` directory is included in build output
- [ ] Create `_routes.json` to exclude static assets from Function invocations (optional optimization)
- [ ] Test deploy to Cloudflare Pages preview
- [ ] Verify both `/` and `/pwa/` are accessible

**Acceptance**: Both versions accessible on deployed preview URL.

---

## Phase 5: PWA Testing Suite

### Task 5.1: Manifest Validation Tests
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: Task 1.1  
**Status**: 🔲 Not Started

- [ ] Create `tests/pwa/manifest.test.ts`
- [ ] Test: Required fields present (name, short_name, icons, display, etc.)
- [ ] Test: Icons array has 192px, 512px PNG + SVG
- [ ] Test: Theme/background colors are valid hex
- [ ] Test: Start URL and scope are correct

**Acceptance**: All manifest validation tests pass.

---

### Task 5.2: Service Worker Tests
**Assignee**: AI  
**Estimate**: 2h  
**Dependencies**: Task 1.1  
**Status**: 🔲 Not Started

- [ ] Create `tests/pwa/service-worker.test.ts`
- [ ] Test: SW registration succeeds
- [ ] Test: Core assets are in precache manifest
- [ ] Test: Cache-first strategy serves offline
- [ ] Test: Update flow triggers reload prompt

**Acceptance**: All service worker tests pass.

---

### Task 5.3: Offline Gameplay Tests
**Assignee**: AI  
**Estimate**: 2h  
**Dependencies**: Task 3.1  
**Status**: 🔲 Not Started

- [ ] Create `tests/pwa/offline.playwright.test.ts`
- [ ] Test: Game loads and is playable with network disconnected
- [ ] Test: All existing game mechanics function offline
- [ ] Test: Game-over screen displays correctly offline
- [ ] Test: State persistence works across reloads

**Acceptance**: Playwright offline tests pass.

---

### Task 5.4: Lighthouse PWA Audit
**Assignee**: AI  
**Estimate**: 2h  
**Dependencies**: Task 3.1  
**Status**: 🔲 Not Started

- [ ] Install `lighthouse` as dev dependency
- [ ] Create `tests/pwa/lighthouse.test.ts`
- [ ] Run Lighthouse programmatically against PWA build
- [ ] Assert PWA category score ≥ 90
- [ ] Update `.woodpecker/ci.yml` to run Lighthouse audit

**Acceptance**: Lighthouse PWA score ≥ 90; CI fails if below threshold.

---

### Task 5.5: E2E Routing Tests
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: Task 4.2  
**Status**: 🔲 Not Started

- [ ] Create `tests/pwa/routing.test.ts`
- [ ] Test: Mobile UA → `/pwa/` (redirect)
- [ ] Test: Desktop UA → `/` (no redirect)
- [ ] Test: Cookie override bypasses UA detection
- [ ] Test: `/pwa/` path serves correct build

**Acceptance**: All routing tests pass.

---

### Task 5.6: Run Full Test Suite
**Assignee**: AI  
**Estimate**: 1h  
**Dependencies**: Tasks 5.1–5.5  
**Status**: 🔲 Not Started

- [ ] Run `bun run test:run` — all 268+ tests should pass
- [ ] Run `bun run lint` — no errors
- [ ] Run `bun run typecheck` — no errors
- [ ] Run `bun run build:all` — both builds succeed

**Acceptance**: All quality gates pass.

---

## Phase 6: Service Worker Optimization

### Task 6.1: Cache Strategy Configuration
**Assignee**: AI  
**Estimate**: 2h  
**Dependencies**: Task 1.1  
**Status**: 🔲 Not Started

- [ ] Configure `vite-plugin-pwa` workbox options
- [ ] Precache: App shell (HTML, JS, CSS, icons)
- [ ] Runtime cache: Game assets (fonts)
- [ ] Cache naming: `cycles-pwa-v{version}`
- [ ] Cleanup old caches on activation

**Acceptance**: SW activates and caches are populated correctly.

---

### Task 6.2: Update Flow
**Assignee**: AI  
**Estimate**: 2h  
**Dependencies**: Task 6.1  
**Status**: 🔲 Not Started

- [ ] Configure `registerType: 'autoUpdate'` in vite-plugin-pwa
- [ ] Create update prompt UI ("Update available — Reload")
- [ ] Auto-update after 24 hours
- [ ] Clean up old caches after update

**Acceptance**: Old caches cleaned up; update prompt appears.

---

## Summary

| Phase | Tasks | Est. Total |
|-------|-------|------------|
| Phase 1: Dual Build | 3 tasks | 3.5h |
| Phase 2: Persistence | 4 tasks | 7h |
| Phase 3: PWA UI | 3 tasks | 7h |
| Phase 4: Cloudflare Routing | 4 tasks | 5h |
| Phase 5: Testing | 6 tasks | 9h |
| Phase 6: SW Optimization | 2 tasks | 4h |
| **Total** | **22 tasks** | **~35.5h** |

---

## Definition of Done

- [ ] Two builds (`dist/` and `dist/pwa/`) both pass all quality gates
- [ ] PWA build achieves Lighthouse PWA score ≥ 90
- [ ] Game state persists across browser restarts
- [ ] Cloudflare routing directs mobile → `/pwa/`, desktop → `/`
- [ ] Install prompt works on Chrome Android and Edge desktop
- [ ] All 268 existing tests pass + 20+ new PWA tests pass
- [ ] Both versions deployed and accessible on preview URL
- [ ] README updated with PWA build and deploy instructions
