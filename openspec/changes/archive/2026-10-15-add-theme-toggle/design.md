## Context

Dark mode exists today and keys off the OS in three places: two `@media (prefers-color-scheme: dark)` blocks in `src/app.css` (UI tokens at line 24, chart palette at line 207) and a `matchMedia` listener in `GrowthChart.svelte` that rebuilds the chart. `src/lib/data/cache.ts` already wraps `localStorage` with try/catch. Requirements live in `specs/tema/spec.md`.

## Goals / Non-Goals

**Goals:**
- One source of truth for the effective theme, read by both CSS and the chart.
- Each color token defined once, covering both themes.

**Non-Goals:**
- A third "Sistema" state. Clearing storage is the only way back to following the OS.
- Themes beyond light and dark.

## Decisions

### `data-theme` on `<html>`, absent until the user picks
The stored value is `light` or `dark`. With no stored value, `<html>` has no `data-theme` attribute and CSS follows the OS, which covers "track the OS live" with no JS listener for the CSS side.

```
stored value   <html> attribute     color-scheme     result
─────────────  ───────────────────  ───────────────  ─────────────
(none)         (none)               light dark       follows OS
light          data-theme="light"   light            light
dark           data-theme="dark"    dark             dark
```

### Tokens use `light-dark()`
`:root` sets `color-scheme: light dark` and each token becomes `light-dark(<light>, <dark>)`. `[data-theme=light]` and `[data-theme=dark]` only set `color-scheme`. Both `@media` blocks go away.

Alternative: keep the `@media` blocks and add `:root[data-theme=dark]` copies. Rejected because every dark value would live in two places (about 25 tokens), and they drift.

### Inline script in `index.html` sets the attribute before paint
A few lines in `<head>`, before the stylesheet, read the stored theme inside try/catch and set `data-theme`. Loading it from `main.ts` would run after first paint and flash the OS theme. The module writes through `writeCache('theme', ...)`, so the script reads `localStorage['renda-fixa:theme']` and parses the `{ value, savedAt }` JSON that `cache.ts` stores.

### Theme state module in `src/lib/state/`
A small rune-based module exposes the effective theme (`light` | `dark`) and a `toggle()`. It computes the effective theme from the stored choice, or from `matchMedia('(prefers-color-scheme: dark)')` when none is stored, and listens to `matchMedia` changes for that case. `toggle()` flips the effective theme, writes storage through `cache.ts`, and sets `data-theme` on `<html>`. The header button and `GrowthChart` both read it. `GrowthChart` drops its own `matchMedia` listener.

Alternative: `GrowthChart` watches `data-theme` with a MutationObserver. Rejected because it still needs `matchMedia` for the no-choice case, so two sources instead of one.

### Chart resolves tokens through a probe element
An unregistered custom property computes to its specified value, so `getPropertyValue('--bg')` returns the literal `light-dark(#f7f7f8, #0e0e10)`, which canvas can't parse. `GrowthChart` sets `color: var(--token)` on a hidden span and reads back `getComputedStyle(span).color`, which the browser resolves against the active `color-scheme`.

Alternative: register each token with `@property { syntax: '<color>' }` so it computes to a plain color. Rejected because it adds about 25 registrations to fix one consumer.

### Chart reads tokens after the attribute changes
`GrowthChart` rebuilds when `theme.current` changes. `toggle()` must set the attribute before the state update reaches the chart's effect, or the chart reads stale tokens. Setting the attribute and the rune in the same synchronous call satisfies this, since Svelte effects run after the microtask.

## Risks / Trade-offs

- [`light-dark()` needs Chrome 123, Safari 17.5, Firefox 120] → Older browsers fall back to no color on the affected properties. Accepted; the app targets current browsers.
- [Inline script key drifts from the module key] → Keep the key as one string documented in both places; a test can assert the module's key matches the one in `index.html`.
- [Stored choice hides OS changes forever] → Accepted per the two-state decision.
