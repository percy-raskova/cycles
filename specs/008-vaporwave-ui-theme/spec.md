# Feature Specification: Vaporwave Win95 UI Theme and Repository Credit

**Feature Branch**: `008-vaporwave-ui-theme`
**Created**: 2026-05-24
**Status**: Draft
**Input**: User description: "Add Codeberg repository credit link and apply Windows 95 bisexual fuchsia orchid vaporwave color scheme to the UI"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and Access the Source Repository (Priority: P1)

As a visitor or player, I want to see the source code repository clearly credited on the game page with a clickable link, so I can find the project, report issues, or contribute.

**Why this priority**: Open-source attribution is a core expectation. Without a visible link, users cannot discover the repository or engage with the project community.

**Independent Test**: Can be fully tested by loading the game page and verifying that a clickable link to `https://codeberg.org/percy-raskova/cycles` is present and navigable.

**Acceptance Scenarios**:

1. **Given** the game page is loaded in a browser, **When** the page renders, **Then** a clickable text or icon linking to the Codeberg repository is visible without requiring interaction with menus or modals.
2. **Given** the repository link is visible, **When** a user clicks it, **Then** the browser navigates to `https://codeberg.org/percy-raskova/cycles` (or opens it in a new tab).
3. **Given** the game is being played and modals are opened and closed, **When** returning to the main game view, **Then** the repository link remains accessible.

---

### User Story 2 - Experience a Retro Desktop Aesthetic (Priority: P1)

As a player, I want the entire game interface styled with a nostalgic 1990s desktop operating system aesthetic using a vibrant bisexual fuchsia orchid vaporwave color palette, so the visual experience is distinctive, playful, and thematically cohesive.

**Why this priority**: The visual theme is the primary differentiator of this feature. It transforms the game from a generic grid into a memorable, stylized experience.

**Independent Test**: Can be fully tested by visually inspecting the rendered page against the defined color and style requirements.

**Acceptance Scenarios**:

1. **Given** the game page is loaded, **When** the background, menus, buttons, and game board render, **Then** the dominant colors are drawn from a palette of fuchsia, hot pink, magenta, orchid, and lavender, accented with deep teal or navy for contrast.
2. **Given** any interactive button or control on the page, **When** it is rendered in its default state, **Then** it displays with a raised 3D beveled border (highlighted top/left, shadowed bottom/right) consistent with 1990s desktop UI conventions.
3. **Given** any interactive button or control, **When** it is pressed or activated, **Then** its border inverts to appear recessed or sunken.
4. **Given** the game board grid and coins, **When** they render, **Then** their colors harmonize with the overall fuchsia orchid palette rather than clashing with it.
5. **Given** text elements throughout the UI, **When** they render, **Then** they use a monospaced or pixel-style typeface consistent with the retro desktop aesthetic and remain legible against their backgrounds.

---

### User Story 3 - Reset and Undo Moves (Priority: P1)

As a player, I want clearly labeled Reset and Undo buttons that are easy to tell apart, so I can quickly restart a game or take back a mistake without confusion.

**Why this priority**: Reset and undo are essential game controls. If they are hard to find or visually similar, players will accidentally trigger the wrong action, leading to frustration.

**Independent Test**: Can be fully tested by verifying that each button has a unique visual appearance, that clicking Reset starts a new game from the initial state, and that clicking Undo reverts the last move.

**Acceptance Scenarios**:

1. **Given** a game is in progress with at least one move made, **When** the player clicks the Undo button, **Then** the most recent move is reversed and the board state returns to what it was before that move.
2. **Given** a game is in progress, **When** the player clicks the Reset button, **Then** the game immediately returns to the initial empty-board state with no coins placed and no edges drawn.
3. **Given** the game page is rendered, **When** the Reset and Undo buttons are inspected, **Then** they have distinct visual styles (e.g., different colors, icons, or labels) that make them immediately distinguishable from each other and from all other buttons.
4. **Given** the game is at the initial state with no moves made, **When** the Undo button is inspected, **Then** it is visually disabled (dimmed or grayed out) and clicking it has no effect.
5. **Given** the Reset button is visible, **When** it is clicked, **Then** no confirmation dialog is required; the reset happens immediately (consistent with arcade-style action buttons).
6. **Given** the game is on a touch device, **When** the Reset and Undo buttons are inspected, **Then** each is at least 44×44 CSS pixels.

---

### User Story 4 - Interact with Window-Style Dialogs (Priority: P2)

As a player, I want modal dialogs (such as Help, Settings, and About) to appear as floating desktop windows with title bars and close controls, so the retro theme extends to every layer of the interface.

**Why this priority**: Window-style dialogs reinforce the desktop metaphor. Without them, modals would feel like modern overlays breaking the retro immersion.

**Independent Test**: Can be fully tested by opening each modal and verifying its window chrome against the style requirements.

**Acceptance Scenarios**:

1. **Given** a modal dialog is opened (e.g., by clicking Help or Settings), **When** it appears, **Then** it is framed by a window border with a title bar at the top containing the dialog's title.
2. **Given** a modal dialog is open, **When** the title bar is inspected, **Then** it contains a close button (represented as an 'X' or similar icon) aligned to the right.
3. **Given** a modal dialog is open, **When** the close button is clicked, **Then** the dialog dismisses.
4. **Given** a modal dialog is open, **When** the area outside the dialog window is clicked, **Then** the dialog dismisses.
5. **Given** multiple modals could theoretically be open, **When** one is active, **Then** it is rendered as a single focused window (no stacking or multiple simultaneous dialogs).
6. **Given** a modal dialog is open, **When** the Escape key is pressed, **Then** the dialog dismisses.

---

### User Story 5 - Play on Desktop and Mobile Without Friction (Priority: P1)

As a player, I want the game to display correctly and remain fully playable on both a desktop browser (Firefox) and as a Progressive Web App on a mobile device, so I can play wherever I am on whatever device I have.

**Why this priority**: Players use a mix of desktop and mobile devices. A broken mobile layout or missing PWA support excludes a significant portion of users.

**Independent Test**: Can be fully tested by rendering the page at multiple viewport sizes and verifying layout integrity, touch target sizes, and PWA installability.

**Acceptance Scenarios**:

1. **Given** the game page is loaded in Firefox on a desktop monitor at 1920×1080, **When** the page renders, **Then** the game board, controls, and repository link are all visible and accessible without horizontal scrolling.
2. **Given** the game page is loaded on a mobile device or in a mobile-emulated viewport (375×667), **When** the page renders, **Then** the layout adapts so that the game board fits within the viewport width, text remains readable, and no content is clipped or overlaps.
3. **Given** the game is loaded on a touch device, **When** a player attempts to place a coin or join coins, **Then** all interactive targets (coins, buttons, grid intersections) are at least 44×44 CSS pixels to ensure comfortable tapping.
4. **Given** the game page is served with a valid Web App Manifest and service worker, **When** a mobile user selects "Add to Home Screen" from their browser menu, **Then** the game installs as a standalone PWA with a themed splash screen and appropriate icon.
5. **Given** the game is installed as a PWA, **When** launched from the home screen, **Then** it opens in standalone display mode (no browser chrome) and the theme colors apply to the system status bar where supported.
6. **Given** the device is rotated between portrait and landscape orientations, **When** the orientation changes, **Then** the game board and controls reflow gracefully without requiring a page reload.

---

### User Story 6 - Trust the Interface is Accessible by Default (Priority: P1)

As a player with visual sensitivities or using assistive technology, I want the game to be WCAG-compliant with dark mode by default and sufficient color contrast everywhere, so I can play comfortably and confidently.

**Why this priority**: Accessibility is not optional. Dark mode by default respects user preferences, and WCAG compliance ensures the game is usable for people with low vision, color blindness, or other visual needs.

**Independent Test**: Can be fully tested by running automated contrast audits, manual keyboard navigation tests, and screen reader verification of interactive elements.

**Acceptance Scenarios**:

1. **Given** the game page is loaded, **When** the initial render completes, **Then** the interface is displayed in dark mode by default (dark background, light text) regardless of the operating system theme preference.
2. **Given** any text element on the page, **When** its foreground and background colors are measured, **Then** the contrast ratio is at least 4.5:1 for body text and 3:1 for large text (18pt+ or 14pt+ bold) and UI graphical components.
3. **Given** a player who is red-green colorblind (deuteranopia), **When** the game is viewed, **Then** coins, edges, and player indicators remain distinguishable by shape, pattern, or label in addition to color.
4. **Given** a player using only a keyboard, **When** they press the Tab key, **Then** all interactive elements (buttons, board intersections, modal close controls) receive a visible focus indicator with a contrast ratio of at least 3:1 against adjacent colors.
5. **Given** a screen reader is active, **When** the page loads, **Then** the game board is announced with a meaningful description, buttons have accessible labels, and modal dialogs are announced as dialog regions with titles.
6. **Given** visual regression tests are executed, **When** they run against reference snapshots, **Then** no unintended visual changes (color shifts, layout breakage, missing elements) are detected in the UI components.

---

### Edge Cases

- **Repository link on small viewports**: The repository credit must remain visible and clickable on narrow screens (e.g., mobile browsers) without breaking the layout.
- **Color contrast accessibility**: All text colored with the fuchsia orchid palette must maintain sufficient contrast against its background to be readable.
- **Modal focus trapping**: When a window-style dialog is open, keyboard focus should remain within the dialog until it is closed.
- **Repository link in modals**: If the About modal also mentions the repository, the link must not duplicate the primary credit in a way that creates visual clutter.
- **Theme consistency across game states**: The retro theme must persist whether the game is in progress, paused, or showing the game-over screen.
- **Button state feedback**: Disabled buttons (e.g., when no moves are available) must visually indicate their disabled state while remaining within the color palette.
- **Mobile keyboard push**: When a text input (if any) receives focus on mobile, the viewport must not shift in a way that permanently hides the game board or controls.
- **PWA offline play**: If the device loses connectivity after installing the PWA, the game must still load and function because all assets are cached by the service worker.
- **High-DPI displays**: On screens with device pixel ratios above 1 (Retina, OLED), borders, text, and the game board must remain crisp and not appear blurry or pixelated.
- **Firefox-specific rendering**: In Firefox, 3D beveled borders, custom fonts, and SVG game board elements must render identically to Chromium-based browsers with no layout shifts or missing styles.
- **System dark/light toggle**: If the OS switches between dark and light mode while the game is open, the interface must remain in dark mode (no flash of unstyled light content).
- **Zoom up to 200%**: When the browser zoom is set to 200%, all content must remain visible and functional without requiring horizontal scrolling or losing interactive elements off-screen.
- **Undo after reset**: After clicking Reset, the Undo button must remain disabled until a new move is made; it must not attempt to undo moves from the previous game.
- **Undo at game start**: When no moves have been made, the Undo button must be disabled and non-interactive.
- **Rapid undo clicks**: Clicking Undo multiple times in quick succession must undo moves sequentially without errors or visual glitches.
- **Reset during opponent's turn**: Reset must work at any time regardless of whose turn it is.
- **Undo after cycle closure**: Undoing a move that closed a cycle must restore all flipped coins to their pre-flip faces and remove the newly drawn edge.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game page MUST display a persistent, clickable link to the canonical source repository (`https://codeberg.org/percy-raskova/cycles`) that is visible without opening any modal dialogs.
- **FR-002**: The repository link MUST open the Codeberg repository in a new browser tab or navigate to it directly when activated.
- **FR-003**: The entire game interface MUST adopt a visual theme inspired by 1990s desktop operating systems, characterized by raised and recessed 3D beveled borders on interactive elements.
- **FR-004**: The color palette MUST be dominated by bisexual fuchsia orchid and vaporwave tones, including shades of fuchsia, hot pink, magenta, orchid, and lavender, with deep teal or navy used for contrast and backgrounds.
- **FR-005**: All buttons, input elements, and interactive controls MUST visually indicate their default (raised), pressed/active (recessed), and disabled states through border and fill styling.
- **FR-006**: Modal dialogs (Help, Settings, About, and any future dialogs) MUST render as floating desktop windows with a visible title bar containing the dialog title and a close control.
- **FR-007**: Modal dialogs MUST be dismissible by clicking the title-bar close control, clicking outside the window frame, or pressing the Escape key.
- **FR-008**: Text throughout the UI MUST use a typeface consistent with the retro desktop aesthetic (e.g., monospaced or pixel-style) and MUST remain legible at all supported viewport sizes.
- **FR-009**: The game board grid, coins, and edges MUST recolor to harmonize with the fuchsia orchid palette without losing their functional recognizability.
- **FR-010**: The repository credit and the retro theme MUST not interfere with game logic, move validation, or test execution.
- **FR-011**: The layout MUST be responsive: the game MUST be fully playable and visually coherent on viewport widths from 320px (mobile) to 1920px (desktop) without horizontal scrolling.
- **FR-012**: All interactive touch targets (buttons, grid intersections, coins) MUST be at least 44×44 CSS pixels to comply with WCAG 2.2 Target Size (Minimum).
- **FR-013**: The application MUST provide a valid Web App Manifest (`manifest.json`) with appropriate icons, display mode (`standalone`), theme color, and background color so that it can be installed as a PWA.
- **FR-014**: The game MUST default to dark mode on initial load and MUST remain in dark mode regardless of the user's OS-level light/dark preference.
- **FR-015**: The interface MUST meet WCAG 2.1 Level AA contrast requirements: body text at least 4.5:1, large text and UI components at least 3:1.
- **FR-016**: Information MUST not be conveyed by color alone; coins, player indicators, and status elements MUST also be distinguishable by shape, pattern, text label, or iconography.
- **FR-017**: All interactive elements MUST have a visible keyboard focus indicator with a contrast ratio of at least 3:1 against adjacent colors.
- **FR-018**: The game MUST include automated visual regression tests that capture and compare snapshots of key UI states to prevent unintended visual changes.
- **FR-019**: The application MUST function identically in Firefox (latest stable) and Chromium-based browsers, with no layout, rendering, or interaction differences.
- **FR-020**: The game MUST provide a Reset button that immediately returns the game to the initial empty-board state when clicked, regardless of game phase or current player.
- **FR-021**: The game MUST provide an Undo button that reverts the most recent move (PLACE or JOIN), restoring the board state, current player, and move history to their pre-move condition.
- **FR-022**: The Reset and Undo buttons MUST be visually distinct from each other and from all other controls, using unique colors, icons, or labels that prevent accidental misidentification.
- **FR-023**: The Undo button MUST be disabled (visually and functionally) when the move history is empty (i.e., no moves have been made yet or after a Reset).

### Key Entities

- **Repository Credit**: A visible UI element linking to the project's Codeberg repository. Key attribute: URL must be `https://codeberg.org/percy-raskova/cycles`.
- **Theme Palette**: The defined set of colors (fuchsia, hot pink, magenta, orchid, lavender, deep teal/navy) applied consistently across all UI surfaces.
- **Window Dialog**: A modal overlay styled as a 1990s desktop window with title bar, close button, and beveled frame. Key behavior: dismissible via close button, outside click, or Escape key.
- **PWA Manifest**: A JSON file describing the application for browser installation. Key attributes: `name`, `short_name`, `icons`, `display`, `theme_color`, `background_color`, `start_url`.
- **Visual Regression Snapshot**: A captured image of a rendered UI component or page state used for automated comparison during testing.
- **Reset Button**: A control that immediately restarts the game from the initial state. Key behavior: no confirmation required, works at any time.
- **Undo Button**: A control that reverts the most recent move. Key behavior: disabled when no moves exist, restores full pre-move state including flipped coins.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The repository link is visible on the game page within 2 seconds of initial load without requiring any user interaction.
- **SC-002**: Clicking the repository link successfully navigates to `https://codeberg.org/percy-raskova/cycles`.
- **SC-003**: All interactive controls (buttons, selectable elements) exhibit clear visual state changes (raised default, recessed active, dimmed disabled) that are distinguishable by sight.
- **SC-004**: The color scheme is applied consistently across 100% of visible UI components (menu bar, game board, buttons, modals, text) with no unstyled or default-colored elements remaining.
- **SC-005**: All modal dialogs display a title bar with a close control and dismiss correctly via click-outside, close button, or Escape key.
- **SC-006**: Text legibility is maintained: all body text achieves a contrast ratio of at least 4.5:1 against its background; large text and UI components achieve at least 3:1.
- **SC-007**: The existing test suite (179 tests) continues to pass with no regressions caused by the visual theme changes.
- **SC-008**: The game remains fully playable: users can place coins, join coins, close cycles, trigger auto-pass, and reach game over without the theme interfering with interaction.
- **SC-009**: The layout renders correctly at viewport widths of 320px, 375px, 768px, 1024px, and 1920px with no horizontal scroll, clipped content, or overlapping elements.
- **SC-010**: All touch targets measure at least 44×44 CSS pixels when inspected in browser DevTools.
- **SC-011**: The PWA passes the Lighthouse PWA audit with a score of at least 90, including valid manifest, service worker, and installability.
- **SC-012**: Automated visual regression tests cover at least the following states: initial load, face selector open, Help modal open, Settings modal open, game over panel displayed.
- **SC-013**: Manual keyboard navigation tests confirm that every interactive element is reachable via Tab and has a visible focus indicator.
- **SC-014**: The game renders identically in Firefox and Chromium when compared via screenshots of the same viewport size.
- **SC-015**: The game loads and is playable in standalone PWA mode on a mobile device after being added to the home screen.
- **SC-016**: Clicking the Reset button returns the game to the initial state within 100ms, with zero coins and zero edges on the board.
- **SC-017**: Clicking the Undo button correctly reverts the last move, including restoring flipped coins and removing the last-placed edge, within 100ms.
- **SC-018**: *(Post-launch validation, not buildable work)* In a user test with 5 participants, zero participants confuse the Reset and Undo buttons or trigger the wrong action on first use. This is a qualitative outcome metric measured after deployment, not a task to implement.

## Assumptions

- The "bisexual fuchsia orchid" palette is interpreted as a vaporwave-inspired combination of bright pinks, magentas, orchids, and lavenders against dark backgrounds, not a literal bisexual pride flag layout.
- "Windows 95 style" refers to the visual language of 3D beveled borders, title bars, and close buttons, not functional behaviors of a full operating system (e.g., no taskbar, start menu, or window resizing is required).
- The repository credit will be placed in a non-intrusive location (e.g., a footer or subtle header area) that does not obstruct the game board or primary controls.
- The existing game logic, state management, and test infrastructure remain unchanged; this feature is purely a visual and attribution layer.
- The Codeberg repository URL (`https://codeberg.org/percy-raskova/cycles`) is the canonical and permanent source location.
- The PWA will be served via Cloudflare Pages, which supports HTTPS and custom domains required for service workers and manifest files.
- Visual regression tests will use Vitest with `@vitest/browser` or Playwright screenshots, consistent with the existing test infrastructure.
- Accessibility audits will be performed using automated tools (e.g., Axe, Lighthouse) supplemented by manual keyboard and screen reader verification.
