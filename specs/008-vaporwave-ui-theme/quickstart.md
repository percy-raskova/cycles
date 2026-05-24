# Quickstart: Vaporwave Win95 UI Theme and Repository Credit

**Feature**: Vaporwave Win95 UI Theme and Repository Credit
**Date**: 2026-05-24

---

## Prerequisites

- bun ≥ 1.0
- Node.js ≥ 18 (for Vitest browser mode and Playwright)
- Firefox (latest stable) and a Chromium-based browser (Chrome/Edge) for cross-browser verification

## Install

```bash
# From the repository root
bun install

# Install Playwright browsers (for visual regression tests)
bunx playwright install chromium firefox
```

## Development

```bash
# Start the Vite dev server
bun run dev

# Run tests in watch mode
bun run test

# Run the full test suite (including visual regression)
bun run test:run

# Lint and typecheck
bun run lint
bun run typecheck
```

## Build and Deploy

```bash
# Production build
bun run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name cycles-game --branch=main
```

## Theme Development

### Color Palette

All colors are defined as CSS custom properties in the theme stylesheet. Edit the variables to adjust the palette:

```css
:root {
  --color-bg: #0a0a1a;
  --color-surface: #14142b;
  --color-fuchsia: #ff00ff;
  --color-hot-pink: #ff69b4;
  /* ... etc ... */
}
```

### Fonts

The theme loads two Google Fonts via `<link>` in `index.html`:

- **VT323** (400 weight) — display headings, title bars
- **Space Mono** (400, 700 weight) — body text, controls

To change fonts, update the Google Fonts link and the `--font-display` / `--font-body` custom properties.

### Adding a New Modal

1. Import the `Modal` component from `src/ui/components/Modal.tsx`.
2. Add state to the parent component:
   ```tsx
   const [isOpen, setIsOpen] = useState(false);
   ```
3. Render the modal:
   ```tsx
   <Modal
     isOpen={isOpen}
     onClose={() => setIsOpen(false)}
     title="Modal Title"
   >
     <p>Modal content here.</p>
   </Modal>
   ```

## PWA Testing

### Local PWA Testing

1. Build the project: `bun run build`
2. Serve `dist/` locally over HTTPS:
   ```bash
   bunx serve dist -l 4173
   ```
3. Open `https://localhost:4173` in Chrome/Edge.
4. Open DevTools → Application → Manifest to verify manifest fields.
5. Click "Install" in the address bar (or DevTools → Application → Service Workers → "Install").

### Lighthouse PWA Audit

1. Build and serve as above.
2. Open Chrome DevTools → Lighthouse.
3. Select "Progressive Web App" category.
4. Run audit. Target score: ≥90.

### Mobile Testing

1. Open the deployed URL (`https://cycles.percypedia.biz`) on a mobile device.
2. In the browser menu, select "Add to Home Screen".
3. Launch from the home screen. Verify:
   - No browser chrome visible (standalone mode)
   - Theme color applied to status bar
   - Game board fits within viewport
   - Touch targets are comfortable (≥44×44px)

## Accessibility Testing

### Automated (Axe-core)

Axe-core runs as part of the Vitest test suite. To run accessibility tests in isolation:

```bash
bun run test -- --grep "accessibility"
```

### Manual Verification

1. **Keyboard navigation**: Tab through every interactive element. Every button, link, and board intersection must be reachable.
2. **Focus indicator**: Check that focused elements have a visible 2px outline in `--color-fuchsia`.
3. **Contrast**: Use Firefox DevTools → Accessibility panel to inspect contrast ratios.
4. **Color blindness**: Use Firefox DevTools → Accessibility → "Simulate" to test deuteranopia and protanopia.
5. **Screen reader**: Enable NVDA (Windows) or VoiceOver (macOS/iOS). Navigate the game board and verify coins/intersections are announced.

## Visual Regression Testing

### Running Snapshot Tests

```bash
# Update all snapshots (after intentional visual changes)
bun run test -- --update

# Run visual regression tests only
bun run test -- --grep "visual"
```

### Reviewing Failures

When a visual test fails:
1. Check the diff output in `tests/__snapshots__/`.
2. If the change is intentional, update snapshots with `--update`.
3. If the change is unexpected, investigate the CSS or component change that caused it.

### Cross-Browser Parity

After making visual changes, verify in both Firefox and Chromium:

```bash
# Screenshot comparison script (manual)
# 1. Open Firefox, navigate to game, take screenshot at 1280×720
# 2. Open Chrome, navigate to game, take screenshot at 1280×720
# 3. Compare in image diff tool (e.g., GIMP, Krita, or online diff checker)
```

## Troubleshooting

### Fonts not loading

- Verify Google Fonts `<link>` is present in `index.html`.
- Check DevTools Network tab for 404s on font requests.
- Ensure `font-display: swap` is set to prevent invisible text during load.

### PWA not installable

- Check DevTools → Application → Manifest for errors.
- Verify `manifest.json` is served with `Content-Type: application/json`.
- Ensure icons exist at the paths specified in the manifest.
- Service worker must be registered; check DevTools → Application → Service Workers.

### Contrast failures in tests

- Use an online contrast checker (e.g., WebAIM Contrast Checker) with the exact hex values.
- Adjust `--color-text-primary`, `--color-text-secondary`, or background colors.
- For fuchsia accents on dark backgrounds, consider adding a subtle glow or border to improve perceived contrast.

