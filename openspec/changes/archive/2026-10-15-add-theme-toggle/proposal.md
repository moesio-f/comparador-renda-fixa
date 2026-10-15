## Why

The app switches between light and dark only through the OS `prefers-color-scheme` setting. A user who wants a different theme than their OS has no way to pick one.

## What Changes

- Add a single icon button in the header, next to "Copiar link", that toggles between light and dark.
- On first visit (no stored choice) the app follows the OS theme and keeps tracking it live.
- A click stores the choice in browser storage; the stored choice overrides the OS on later visits.
- Apply the stored theme before first paint, so a reload never flashes the other theme.
- Make the growth chart follow the effective theme (stored choice or OS), not only the OS.
- Rewrite the color tokens in `app.css` with `light-dark()` so each token defines both themes in one place.

## Capabilities

### New Capabilities
- `tema`: light/dark theme selection, its default from the OS, persistence, no-flash load, and chart colors following the active theme.

### Modified Capabilities

## Impact

- `src/app.css`: UI tokens and chart palette move from `@media (prefers-color-scheme: dark)` blocks to `light-dark()` values; `[data-theme]` selectors set `color-scheme`.
- `index.html`: inline script that reads the stored theme and sets `data-theme` on `<html>` before the stylesheet paints.
- `src/App.svelte`: toggle button in the header.
- `src/lib/ui/GrowthChart.svelte`: theme detection switches from a raw `matchMedia` listener to the effective theme.
- New theme state module under `src/lib/state/`.
- Browser support floor rises to `light-dark()`: Chrome 123, Safari 17.5, Firefox 120.
- The theme does not travel in shared links.
