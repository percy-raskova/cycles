# Data Model: Vaporwave Win95 UI Theme and Repository Credit

**Feature**: Vaporwave Win95 UI Theme and Repository Credit
**Date**: 2026-05-24

---

## Entity: Theme Configuration

The theme is defined entirely through CSS custom properties (variables) in a single stylesheet. No runtime JavaScript theme state is required since the spec mandates dark mode by default with no user toggle.

| Property | Type | Description |
|----------|------|-------------|
| `--color-bg` | CSS `<color>` | Deep navy background for the page |
| `--color-surface` | CSS `<color>` | Elevated surface color for panels and dialogs |
| `--color-surface-raised` | CSS `<color>` | Slightly lighter surface for hover/raised states |
| `--color-fuchsia` | CSS `<color>` | Primary accent color (magenta highlights) |
| `--color-hot-pink` | CSS `<color>` | Secondary accent for active and important states |
| `--color-magenta` | CSS `<color>` | Tertiary accent for borders and decorative elements |
| `--color-orchid` | CSS `<color>` | Soft accent for hover and secondary interactive states |
| `--color-lavender` | CSS `<color>` | Light border and divider color |
| `--color-text-primary` | CSS `<color>` | Primary body text (light lavender-white) |
| `--color-text-secondary` | CSS `<color>` | Muted/secondary text |
| `--color-teal` | CSS `<color>` | Cool contrast accent for links and tertiary actions |
| `--color-teal-light` | CSS `<color>` | Hover state for teal elements |
| `--font-display` | CSS `<family-name>` | Primary display typeface (VT323) |
| `--font-body` | CSS `<family-name>` | Body text typeface (Space Mono) |
| `--shadow-raised` | CSS `<shadow>` | Box shadow for raised 3D button effect |
| `--shadow-sunken` | CSS `<shadow>` | Box shadow/inset for recessed/pressed button effect |
| `--border-raised` | CSS `<border>` | Highlighted top/left, shadowed bottom/right border |
| `--border-sunken` | CSS `<border>` | Inverted border for pressed state |

**Validation Rules**:
- All color values must be valid CSS color syntax (hex, rgb, or hsl).
- All color pairs used for text-on-background must achieve WCAG 2.1 AA contrast (4.5:1 for body text, 3:1 for large text/UI components).
- Font families must reference loaded web fonts with appropriate fallbacks (`monospace`, `sans-serif`).

---

## Entity: PWA Manifest

The Web App Manifest describes the application to the browser for PWA installation.

| Field | Type | Value | Description |
|-------|------|-------|-------------|
| `name` | string | `"CYCLES"` | Full application name displayed in install prompts |
| `short_name` | string | `"CYCLES"` | Short name for home screen icon labels |
| `description` | string | `"A two-player planar-graph strategy game"` | App description for store listings |
| `start_url` | string | `"/"` | URL loaded when the app is launched from the home screen |
| `display` | string | `"standalone"` | Display mode: no browser chrome |
| `background_color` | string | `"#0a0a1a"` | Splash screen background (matches `--color-bg`) |
| `theme_color` | string | `"#ff00ff"` | Status bar/theme color (matches `--color-fuchsia`) |
| `icons` | array | `[{ src, sizes, type }]` | Icon set for various device requirements |

**Icon Requirements**:
- 192×192 PNG for home screen icon
- 512×512 PNG for splash screen
- SVG icon for scalable fallback
- All icons must be pre-generated and placed in `public/icons/`

---

## Entity: Repository Credit

| Field | Type | Value | Description |
|-------|------|-------|-------------|
| `url` | string | `"https://codeberg.org/percy-raskova/cycles"` | Canonical repository URL |
| `label` | string | `"Source Code"` or `"View on Codeberg"` | Accessible link text |
| `target` | string | `"_blank"` | Opens in new tab |
| `rel` | string | `"noopener noreferrer"` | Security attribute for external links |
| `position` | enum | `"footer"` or `"header"` | Layout placement |

---

## Entity: Reset Button

| Field | Type | Value | Description |
|-------|------|-------|-------------|
| `label` | string | `"Reset"` or icon (e.g., circular arrow) | Visible label or icon |
| `variant` | enum | `"reset"` | CSS variant for distinct styling |
| `onClick` | function | `() => void` | Callback to reset game state |
| `disabled` | boolean | `false` | Always enabled |
| `ariaLabel` | string | `"Reset game to initial state"` | Screen reader label |

**Styling**: Uses `--color-hot-pink` or `--color-magenta` background. Distinct from Undo via color and iconography.

---

## Entity: Undo Button

| Field | Type | Value | Description |
|-------|------|-------|-------------|
| `label` | string | `"Undo"` or icon (e.g., curved back arrow) | Visible label or icon |
| `variant` | enum | `"undo"` | CSS variant for distinct styling |
| `onClick` | function | `() => void` | Callback to undo last move |
| `disabled` | boolean | `true` when move history empty | Disabled when no moves exist |
| `ariaLabel` | string | `"Undo last move"` | Screen reader label |

**Styling**: Uses `--color-teal` or `--color-orchid` background. Distinct from Reset via color and iconography.

---

## Entity: Visual Regression Snapshot

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Descriptive name of the UI state (e.g., `"initial-load"`) |
| `component` | string | React component or page route being captured |
| `viewport` | object | `{ width, height, deviceScaleFactor }` |
| `threshold` | number | Pixel diff tolerance (default 0.2) |
| `snapshotPath` | string | Relative path to the reference `.png` file |

**Snapshot States to Capture**:
1. `initial-load` — Game page on first render
2. `face-selector-open` — Face selector modal visible
3. `help-modal-open` — Help dialog window open
4. `settings-modal-open` — Settings dialog window open
5. `game-over-panel` — Game over screen displayed

---

## State Transitions

No runtime state transitions are introduced by this feature. The theme is static CSS; the PWA manifest is a build-time artifact. The only dynamic behavior is:

1. **Modal open/close**: Triggered by user interaction (button click, Escape key, outside click). No data model state change — purely UI visibility.
2. **Button state change**: Default → hover → active → disabled. Purely CSS-driven via `:hover`, `:active`, `:disabled` pseudo-classes.
3. **Reset action**: When clicked, the game session is replaced with a fresh initial state. Move history is cleared. Undo button becomes disabled.
4. **Undo action**: When clicked (and enabled), the most recent move is reversed by replaying the game session from the initial state up to the move before the last one. If the undone move was a cycle-closing JOIN, all flipped coins are restored. Undo button becomes disabled if no moves remain.

