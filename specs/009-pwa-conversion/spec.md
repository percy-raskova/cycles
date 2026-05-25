# Feature Specification: PWA Conversion

**Feature Branch**: `009-pwa-conversion`  
**Created**: 2026-05-25  
**Status**: Draft  
**Input**: User description: "consider that we will be making a PWA so we need the full pwa conversion and tests. pwa should exist alongside desktop and cloudflare should be able to sort between the two"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install Game as PWA (Priority: P1)

As a player on a mobile device or desktop browser, I want to install CYCLES as a standalone app on my home screen so that I can launch it quickly without typing a URL.

**Why this priority**: Installation is the defining characteristic of a PWA. Without it, the game remains just a website. This unlocks app-like discoverability and re-engagement.

**Independent Test**: Can be fully tested by verifying the browser recognizes the site as installable (manifest + service worker meet PWA criteria) and delivers the install prompt on supported platforms.

**Acceptance Scenarios**:

1. **Given** a player visits CYCLES in a modern browser, **When** the page loads, **Then** the browser should detect it as an installable PWA and offer an "Add to Home Screen" or install option.
2. **Given** a player installs the PWA, **When** they launch it from the home screen, **Then** it opens in standalone mode (no browser chrome) with the correct app name, icon, and theme colors.
3. **Given** the PWA is installed, **When** the player opens it, **Then** it displays a splash screen or loading state with the app icon and theme colors while the game initializes.

---

### User Story 2 - Offline Gameplay (Priority: P1)

As a player, I want to continue playing CYCLES even when I lose internet connectivity so that I can play on airplanes, subways, or areas with poor signal.

**Why this priority**: Offline capability is a core PWA promise and a major value proposition for a game. Without offline support, the PWA is indistinguishable from a regular website.

**Independent Test**: Can be fully tested by disconnecting the network and verifying the game still loads and functions. The core game engine is already pure TypeScript, so this is primarily a caching and service worker challenge.

**Acceptance Scenarios**:

1. **Given** the player has visited CYCLES at least once while online, **When** they disconnect from the internet and reload the page, **Then** the game loads completely from cache and is playable.
2. **Given** the player is offline, **When** they place coins and join edges, **Then** all game mechanics function identically to the online version with no degradation.
3. **Given** the player is offline, **When** they finish a game, **Then** the game-over screen displays normally and local state is preserved.

---

### User Story 3 - Persistent Game State (Priority: P2)

As a player, I want my in-progress game to survive browser restarts and device reboots so that I can resume exactly where I left off.

**Why this priority**: Players may be interrupted mid-game. State persistence reduces frustration and increases session length. This is especially important for a turn-based strategy game that may span multiple real-world sessions.

**Independent Test**: Can be fully tested by starting a game, closing the browser/tab, reopening it, and verifying the board state, current player, move history, and score are all restored exactly.

**Acceptance Scenarios**:

1. **Given** a player has made several moves in an active game, **When** they close the browser tab and reopen it, **Then** the board is restored with all coins, edges, current player, and remaining supply count intact.
2. **Given** a game is in progress, **When** the player clicks "New Game" or the game reaches a terminal state, **Then** the persisted state is cleared and a fresh game begins.
3. **Given** a player starts a new game after completing one, **When** they close and reopen the browser, **Then** only the latest game state is restored (not the completed one).

---

### User Story 4 - Cloudflare Edge Routing (Priority: P2)

As an operator, I want Cloudflare to automatically serve the PWA or desktop version based on device capabilities or user preference so that mobile users get the optimal experience without manual URL selection.

**Why this priority**: Maintaining two versions (PWA and desktop) requires clear routing logic. Automatic detection reduces user friction and ensures the right experience is delivered.

**Independent Test**: Can be fully tested by simulating different user agents or edge requests and verifying the correct version is served.

**Acceptance Scenarios**:

1. **Given** a request from a mobile device with PWA support, **When** Cloudflare processes the request, **Then** the PWA-capable version is served with full service worker and manifest.
2. **Given** a request from a desktop browser, **When** Cloudflare processes the request, **Then** the desktop version is served with the full vaporwave Win95 UI.
3. **Given** a player explicitly requests the desktop version on a mobile device (via a toggle or URL parameter), **When** Cloudflare processes the request, **Then** the desktop version is served.

---

### User Story 5 - PWA Testing & Validation (Priority: P3)

As a developer, I want automated tests that verify PWA compliance so that regressions in offline capability, installability, or service worker behavior are caught before deployment.

**Why this priority**: PWA features are notoriously fragile. Service workers, caching strategies, and manifest validation require continuous testing to prevent silent failures.

**Independent Test**: Can be fully tested by running a test suite that validates Lighthouse PWA audit scores, service worker registration, and offline functionality.

**Acceptance Scenarios**:

1. **Given** the test suite runs in CI, **When** PWA tests execute, **Then** they verify the manifest is valid JSON with required fields (name, icons, display, theme_color, background_color).
2. **Given** the test suite runs, **When** service worker tests execute, **Then** they verify the SW registers successfully and caches core game assets.
3. **Given** the test suite runs, **When** offline tests execute, **Then** they simulate network disconnection and verify the game remains functional.
4. **Given** the test suite runs, **When** Lighthouse audit tests execute, **Then** they verify the PWA category score is at least 90/100.

---

### Edge Cases

- What happens when a player with a cached PWA visits after a game update? (Service worker update strategy)
- How does the system handle storage quota exceeded when persisting game state?
- What happens if the service worker fails to register? (Graceful fallback to online-only mode)
- How is game state handled when the same user has the PWA installed on multiple devices? (No sync expected for v1, each device independent)
- What happens when a player starts the PWA while offline for the very first time (no cache yet)? (Show offline error page with instructions to connect first)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a valid Web App Manifest with required fields (name, short_name, icons, display, theme_color, background_color, start_url, scope).
- **FR-002**: System MUST register a Service Worker that caches the app shell and game assets for offline use.
- **FR-003**: System MUST serve a cached version of the game when the device is offline (cache-first strategy for assets, network-first for API if any).
- **FR-004**: System MUST persist active game state (board, coins, edges, current player, history) to local storage and restore it on page load.
- **FR-005**: System MUST clear persisted state when a player starts a new game or the game reaches a terminal state.
- **FR-006**: System MUST present an install prompt or installation guidance on browsers that support PWA installation.
- **FR-007**: System MUST open in standalone display mode when launched from the installed PWA icon (no browser address bar).
- **FR-008**: Cloudflare edge MUST route requests to the PWA or desktop version based on path prefix: `/pwa/` serves the PWA build, `/` serves the desktop build. Mobile user agents are automatically redirected to `/pwa/`, and users can explicitly opt into either version via a toggle.
- **FR-009**: System MUST provide a fallback experience when the PWA is accessed offline for the first time (no cache) with a clear message.
- **FR-010**: System MUST include PWA validation tests in the test suite covering manifest validity, service worker registration, offline functionality, and Lighthouse PWA score.

### Key Entities *(include if feature involves data)*

- **PWA Manifest**: JSON configuration defining app identity (name, icons, colors, display mode) consumed by browsers during install.
- **Service Worker**: Background script controlling caching strategy, offline behavior, and asset serving. Key attributes: cache name, cached asset list, fetch handler strategy.
- **Game State Persistence**: Serialized session data stored in browser storage (localStorage or IndexedDB) to survive restarts. Key attributes: session snapshot, timestamp, version.
- **Cache Storage**: Browser Cache API entries holding app shell (HTML/CSS/JS), game engine, and icon assets for offline use.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Lighthouse PWA audit score is 90 or higher on both mobile and desktop.
- **SC-002**: Players can install CYCLES as a PWA on Chrome, Safari (iOS), and Edge with no errors.
- **SC-003**: Game remains fully playable after disconnecting from the internet (all 242 existing tests pass in offline mode).
- **SC-004**: Game state is restored within 1 second of reopening the PWA after browser/device restart.
- **SC-005**: Cloudflare routing correctly serves the intended version (PWA vs desktop) with 100% accuracy in test scenarios.
- **SC-006**: Service worker updates itself within 24 hours of a new deployment without requiring manual cache clearing.

## Assumptions

- The existing Vite + React build pipeline with vite-plugin-pwa will be used as the foundation for PWA generation.
- PWA and desktop versions share the same core game engine and state management (no engine divergence).
- Game state persistence uses localStorage for v1 (simplest); IndexedDB may be considered for future expansion.
- Cloudflare Pages is the hosting platform; edge routing uses Cloudflare Workers or Pages Functions.
- No push notifications or background sync for v1 (out of scope).
- Both PWA and desktop versions maintain 100% test pass rate (existing 242 tests must continue to pass).
