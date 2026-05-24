# UI Component Contract: Modal (Window Dialog)

**Feature**: Vaporwave Win95 UI Theme and Repository Credit
**Contract Type**: React Component Interface
**Date**: 2026-05-24

---

## Component: `Modal`

A modal dialog styled as a 1990s desktop window with title bar, close button, and beveled frame.

### Props Interface

```typescript
interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Called when the modal should close (user action or programmatic) */
  onClose: () => void;
  /** Title displayed in the window title bar */
  title: string;
  /** Modal content (React nodes) */
  children: React.ReactNode;
  /** Optional additional CSS class for the dialog container */
  className?: string;
}
```

### Behavior Contract

1. **Open**: When `isOpen` transitions from `false` to `true`, the modal renders as a `<dialog>` element opened via `.showModal()`.
2. **Close triggers**: The `onClose` callback MUST fire when any of the following occur:
   - The title-bar close button ("X") is clicked.
   - The backdrop area outside the window frame is clicked.
   - The `Escape` key is pressed while the dialog has focus.
3. **Focus management**: When opened, focus MUST move to the first focusable element inside the dialog (or the dialog itself if no focusable children). Focus MUST be trapped within the dialog until it closes.
4. **Accessibility**: The `<dialog>` element MUST have `aria-modal="true"` and `aria-labelledby` pointing to the title bar text.
5. **Animation**: No entrance/exit animations are required. Immediate show/hide is acceptable per the retro aesthetic.

### Styling Contract

- **Window frame**: Beveled border with highlighted top/left edges and shadowed bottom/right edges.
- **Title bar**: Solid background color (e.g., `--color-fuchsia` or `--color-magenta`), with title text left-aligned and close button right-aligned.
- **Content area**: Background uses `--color-surface`, with internal padding.
- **Close button**: Small square button with "X" text, beveled, positioned in the title bar right corner.

---

## Component: `MenuBar`

The top navigation/control bar containing the game title, repository link, and control buttons.

### Props Interface

```typescript
interface MenuBarProps {
  /** Callback to open the Help modal */
  onOpenHelp: () => void;
  /** Callback to open the Settings modal */
  onOpenSettings: () => void;
  /** Optional additional CSS class */
  className?: string;
}
```

### Behavior Contract

1. **Repository link**: A persistent anchor element linking to `https://codeberg.org/percy-raskova/cycles` with `target="_blank"` and `rel="noopener noreferrer"`.
2. **Control buttons**: Two buttons ("?" for Help, "⚙" for Settings) that call their respective callbacks on click.
3. **Layout**: On desktop (≥768px), elements are arranged horizontally. On mobile (<768px), the layout may stack or use a compact form, but all elements remain visible and tappable.

---

## Component: `Button` (Theme Button)

A reusable button component enforcing the Win95 beveled styling.

### Props Interface

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant: "default" | "primary" | "close" | "reset" | "undo" */
  variant?: 'default' | 'primary' | 'close' | 'reset' | 'undo';
  /** If true, renders in disabled visual state and prevents interaction */
  disabled?: boolean;
}
```

### Styling Contract

- **Default state**: Raised 3D border (`border-top`, `border-left` lighter; `border-bottom`, `border-right` darker).
- **Hover state**: Slightly brighter background (`--color-surface-raised`).
- **Active/pressed state**: Inverted border (sunken appearance), slightly darker background.
- **Disabled state**: Dimmed colors, flat border (no 3D effect), `cursor: not-allowed`.
- **Primary variant**: Uses `--color-fuchsia` background with `--color-text-primary` text.
- **Close variant**: Small square button (e.g., 20×20px) for title-bar close controls.
- **Reset variant**: Uses `--color-hot-pink` or `--color-magenta` background with a distinctive icon (e.g., circular arrow or "R" label) to signal a destructive/restart action.
- **Undo variant**: Uses `--color-teal` or `--color-orchid` background with a distinctive icon (e.g., curved back arrow or "U" label) to signal a reverse action.

---

## Theme Contract: CSS Custom Properties

All UI components MUST reference colors, fonts, and effects through the following CSS custom properties. No hardcoded color values are permitted in component styles.

### Required Properties

| Property | Expected Usage |
|----------|---------------|
| `--color-bg` | Page background, dialog backdrop |
| `--color-surface` | Panel/dialog backgrounds |
| `--color-surface-raised` | Hover states, lighter surfaces |
| `--color-fuchsia` | Primary accent, active highlights |
| `--color-hot-pink` | Secondary accent |
| `--color-magenta` | Tertiary accent, borders |
| `--color-orchid` | Soft accent, hover |
| `--color-lavender` | Light borders, dividers |
| `--color-text-primary` | All primary body text |
| `--color-text-secondary` | Muted text, placeholders |
| `--color-teal` | Link color, cool accent |
| `--color-teal-light` | Link hover color |
| `--font-display` | Headings, title bars, labels |
| `--font-body` | Body text, descriptions |
| `--shadow-raised` | Raised button/panel shadow |
| `--shadow-sunken` | Pressed button/panel inset |

### Contrast Guarantees

| Text on Background | Minimum Contrast |
|--------------------|-----------------|
| `--color-text-primary` on `--color-bg` | 12:1 (WCAG AAA) |
| `--color-text-primary` on `--color-surface` | 10:1 (WCAG AAA) |
| `--color-text-secondary` on `--color-bg` | 7:1 (WCAG AAA) |
| `--color-fuchsia` on `--color-bg` | 3:1 (WCAG AA for UI components) |

---

## Accessibility Contract

### Keyboard

| Element | Tab Order | Focus Indicator | Activation |
|---------|-----------|-----------------|------------|
| Repository link | Natural | 2px solid `--color-fuchsia` outline | Enter/click |
| Menu buttons | Natural | 2px solid `--color-fuchsia` outline | Enter/Space/click |
| Board intersections | Natural (if focusable) | 2px solid `--color-fuchsia` ring | Enter/Space/click |
| Modal close button | First inside modal | 2px solid `--color-fuchsia` outline | Enter/Space/click |
| Modal content links | Natural | 2px solid `--color-fuchsia` outline | Enter/click |
| Reset button | Natural | 2px solid `--color-fuchsia` outline | Enter/Space/click |
| Undo button | Natural | 2px solid `--color-fuchsia` outline | Enter/Space/click |

### Screen Reader

| Element | Required ARIA/Role |
|---------|-------------------|
| Game board | `role="application"` or `aria-label="CYCLES game board, 7 by 7 grid"` |
| Coins | `aria-label="Coin at row {r}, column {c}, showing {face}"` |
| Intersection dots | `aria-label="Empty intersection at row {r}, column {c}"` |
| MenuBar | `role="banner"` |
| Modal dialog | `<dialog>` with `aria-modal="true"` and `aria-labelledby` |
| Repository link | `aria-label="View source code on Codeberg"` |
| Reset button | `aria-label="Reset game to initial state"` |
| Undo button | `aria-label="Undo last move"` |

