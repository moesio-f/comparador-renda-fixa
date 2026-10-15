## 1. Setup

- [x] 1.1 Scaffold Vite + Svelte 5 + TypeScript project with `base: '/comparador-renda-fixa/'`, strict TS and `lang="pt-BR"` in `index.html`
- [x] 1.2 Add Vitest, Chart.js and lz-string; add `test`, `check` and `build` scripts
- [x] 1.3 Add CSS tokens (gray scale, emerald accent, error red, light and dark under `prefers-color-scheme`), Inter font and tabular numerals
- [x] 1.4 Add pt-BR formatters for currency, percentage, percentage points and dates, with tests (`R$ 10.000,00`, `11,71%`)

## 2. Calculation engine

- [x] 2.1 Write `tax-rules.ts`: IR brackets, IOF table (days 1 to 29), regime and custody preset per asset type, DEB incentivada flag
- [x] 2.2 Write `accrual.ts`: gross factor for Pré, % do CDI (daily compounding), CDI +, Selic + and IPCA + (per-year projection, last year repeated)
- [x] 2.3 Write `result.ts`: gross → IOF → IR → custody (Tesouro Selic exempt up to R$ 10.000,00) → net, net a.a., net % do CDI
- [x] 2.4 Add input validation with Portuguese error messages
- [x] 2.5 Write `equivalence.ts`: exact and shortcut conversions in both directions for Pré, % do CDI and IPCA +
- [x] 2.6 Write `breakeven.ts`: breakeven inflation
- [x] 2.7 Write engine tests covering every numeric scenario in the `motor-calculo`, `taxa-equivalente` and `inflacao-implicita` specs (1,291632; 1,325103; 86,53%; IR boundaries 180/181/720/721; IOF 66% at day 10; 5,61%)
- [x] 2.8 Check the custody fee and IR interaction against the official Tesouro Direto simulator and settle the open question in design.md

## 3. Data sources

- [x] 3.1 Write `cache.ts`: localStorage wrapper with try/catch and TTL
- [x] 3.2 Write `bcb.ts`: fetch SGS 4389, 432, 1178, 13522 and Olinda Focus annual IPCA medians in parallel with a 20 s timeout; parse the `dd/mm/yyyy` dates and decimal strings
- [x] 3.3 Add parser tests using recorded BCB responses
- [x] 3.4 Write `holidays.ts`: lazy per-year BrasilAPI fetch with permanent per-year cache
- [x] 3.5 Write `business-days.ts`: exact count (start excluded, maturity included) or `dc × 252 / 365`, returning the method; test the Carnaval scenario and the 730 → 504 approximation

## 4. App state and routing

- [x] 4.1 Write the hash router for the four routes
- [x] 4.2 Write `app.svelte.ts` with `$state` for assets, calculator inputs and indicator overrides, and `$derived` results
- [x] 4.3 Persist state to localStorage on change and restore on load
- [x] 4.4 Write `url.ts`: versioned lz-string encode/decode, URL-over-saved priority with the replace prompt, "Link inválido" on decode failure; add round-trip tests

## 5. UI

- [x] 5.1 Build the app shell: header with navigation and the indicator chip strip with source markers (fetched, cached, manual, unavailable)
- [x] 5.2 Build the indicator editor: manual override per indicator and per Focus year, "restaurar" action, missing-value messages
- [x] 5.3 Build the Comparador asset list: add, edit, duplicate, remove; term as date or days with the other shown; empty state
- [x] 5.4 Build the Comparador results table: all columns, sortable, best row highlighted, per-row business-day method marker
- [x] 5.5 Build the growth chart: monthly points plus maturity, net value if redeemed on each date, lines ending at their maturity, hover tooltip
- [x] 5.6 Build the Taxa equivalente page: direction, indexer, rate, term; exact and shortcut results with the p.p. difference; IR bracket line; table by term
- [x] 5.7 Build the Inflação implícita page: breakeven, tax-neutral note, Focus average comparison, missing-projection message
- [x] 5.8 Build "Como calculamos": formulas with worked examples using the current CDI, sources with series codes, live source status, anchors for contextual links
- [x] 5.9 Wire "Copiar link" with the "Link copiado" confirmation
- [x] 5.10 Check the layout at 375 px and 1280 px widths, and keyboard focus on every control

## 6. Review and deploy

- [x] 6.1 Search the UI strings for em dashes and English leftovers; review the copy for repetition
- [x] 6.2 Check that the production bundle stays under 150 KB gzipped
- [x] 6.3 Add the GitHub Actions workflow: typecheck, test, build, upload and deploy to Pages
- [x] 6.4 Enable Pages with the "GitHub Actions" source, push, and verify the live site fetches BCB, Focus and BrasilAPI data from `moesio-f.github.io`
