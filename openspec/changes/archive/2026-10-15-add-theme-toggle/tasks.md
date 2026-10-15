## 1. CSS tokens

- [x] 1.1 Set `color-scheme: light dark` on `:root` and rewrite the UI tokens in `src/app.css` as `light-dark(<light>, <dark>)`; delete the `@media (prefers-color-scheme: dark)` block at line 24
- [x] 1.2 Rewrite the chart palette (`--series-1..8`) the same way; delete the second `@media` block
- [x] 1.3 Add `:root[data-theme='light'] { color-scheme: light }` and `:root[data-theme='dark'] { color-scheme: dark }`
- [x] 1.4 Verify with no `data-theme` that the app still follows the OS in both modes (devtools emulation)

## 2. Theme state

- [x] 2.1 Add a theme module in `src/lib/state/` exposing the effective theme and `toggle()`, reading/writing through `readCache`/`writeCache` with key `theme`
- [x] 2.2 When nothing is stored, derive the theme from `matchMedia` and follow its changes
- [x] 2.3 `toggle()` sets `data-theme` on `<html>` and the stored value in the same synchronous call
- [x] 2.4 Unit tests: default from OS, toggle flips and stores, stored value wins over OS, storage failure still toggles

## 3. No-flash load

- [x] 3.1 Add an inline script in `index.html` `<head>`, before the stylesheet, that reads `renda-fixa:theme` inside try/catch and sets `data-theme`
- [x] 3.2 Verify a reload with light stored on a dark OS shows no dark frame (devtools performance screenshots)

## 4. UI

- [x] 4.1 Add the icon button next to "Copiar link" in `src/App.svelte`, showing the target theme's icon with label "Usar tema escuro" / "Usar tema claro"
- [x] 4.2 Check the header at phone width alongside the nav breakpoint in `src/app.css`
- [x] 4.3 Switch `GrowthChart.svelte` from its own `matchMedia` listener to the theme module; verify the chart recolors on toggle

## 5. Wrap-up

- [x] 5.1 Confirm "Copiar link" output contains no theme value
- [x] 5.2 Run `npm run check`, `npm test` and `npm run build`
