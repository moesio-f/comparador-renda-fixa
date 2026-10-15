## Context

The repository is empty apart from OpenSpec. See proposal.md for motivation and specs/ for behavior. Constraints that shape the design:

- Static hosting on GitHub Pages under the subpath `/comparador-renda-fixa/`. No server and no SPA fallback for unknown paths.
- Every external call runs from the browser. CORS was checked on 2026-10-15: BCB SGS and BrasilAPI answer `Access-Control-Allow-Origin: *`, Olinda echoes the origin. ANBIMA's holiday `.xls` sends no CORS header, and the Tesouro Direto JSON returns 410.
- Financial math must match the spec scenarios to the stated decimals, so the engine needs unit tests that run apart from the UI.

## Goals / Non-Goals

**Goals:**
- Keep a pure calculation engine with no UI or network imports, testable with Vitest.
- Isolate every tax constant (IR brackets, IOF table, exemptions, custody) in one file.
- Make the data source of every number traceable in the UI.
- Ship a light bundle: target under 150 KB gzipped for the first load.

**Non-Goals:**
- Precision beyond IEEE double. Display rounding handles presentation, and no decimal library is needed.
- Adjusting maturities that fall on weekends or holidays.
- Offline-first behavior beyond the indicator and holiday caches (no service worker).
- Unit tests for the UI layer. The engine and the data parsers get tests.

## Decisions

### Stack: Svelte 5 + Vite + TypeScript
The user chose it. Svelte 5 runes (`$state`, `$derived`) give reactive recomputation without a store library, which covers the "recompute on change" requirement directly.

### Hash routing
Routes live in the hash: `#/comparador`, `#/taxa-equivalente`, `#/inflacao-implicita`, `#/como-calculamos`. GitHub Pages serves `index.html` only at the root, so history-mode routes would 404 on reload. With four routes, a 20-line hash router is enough, and a router library would add weight without benefit.

### Engine layout
```
src/lib/engine/
  tax-rules.ts            IR table, IOF table, exemptions per type, custody
  accrual.ts              gross factor per indexer over a business-day count, and its inverse
  result.ts               gross → IOF → IR → custody → net, net p.a., % do CDI
  equivalence.ts          exact and shortcut conversions
  breakeven.ts            breakeven inflation
src/lib/data/
  bcb.ts                  SGS + Olinda fetch and parse
  holidays.ts             BrasilAPI fetch, per-year cache
  business-days.ts        exact count or 252/365, returns { businessDays, method }
  cache.ts                localStorage wrapper with try/catch and TTL
src/lib/state/
  app.svelte.ts           $state for assets, inputs, overrides
  url.ts                  encode/decode shareable state
```
The engine takes plain inputs (`{ indexer, rate, term, indicators }`) and returns plain results. It never fetches. Asset types map to a `{ regime, custodia }` preset in `tax-rules.ts`, so the math depends on the regime and never checks for "CDB" or "LCA".

### Code in English, UI in Portuguese
Identifiers, comments, file and directory names and CSS names are in English. Only user-facing text is in Brazilian Portuguese.

### Exact equivalence by closed-form inversion
For exempt → taxed: target net gain `G`, required gross gain `G / (1 − IR)`, required annual rate `(1 + G/(1 − IR))^(252/du) − 1`. For % do CDI, invert the daily formula: `p = ((1 + R)^(1/252) − 1) / ((1 + CDI)^(1/252) − 1)`. Both directions have a closed form, so the engine needs no numeric solver. IPCA + inverts on the spread, with the IPCA projection held fixed.

### Chart shows net value if redeemed on each date
Each point on the growth chart applies the IR and IOF bracket for that date, so the curve shows what the user would receive on redemption that day. This makes the IR bracket steps visible, which the user's sheet also shows. Exempt assets with grace periods show a hypothetical value, and the help section says so. One point per month plus the maturity date keeps a 10-year chart at about 120 points per line.

Alternative considered: gross curve with tax only at maturity. Rejected because it hides the bracket effect, which drives most comparisons.

### Chart library: Chart.js
Chart.js ships tooltips, a legend and responsive resizing out of the box, at about 65 KB gzipped with tree-shaking. uPlot is lighter (about 20 KB) but needs custom tooltip and legend code. Simplicity wins for v1. The chart sits behind one component, so a swap later touches one file.

### URL state: lz-string in the hash query
Shared state goes into `#/comparador?s=<lz-string compressToEncodedURIComponent(JSON)>`. JSON with short keys stays readable in code, and lz-string (about 3 KB) keeps a 5-asset link under about 400 characters. Each payload carries a version field `v: 1`, so a future schema change can migrate old links.

### Fetch and cache policy
- Indicators: fetch all in parallel on load with a 20 s timeout each. Cache the whole set with a timestamp, TTL 12 h. A failed fetch falls back to the cached value with its date.
- Holidays: fetch lazily for the years spanned by the current assets. Cache each year with no TTL, since past and planned national holidays rarely change.
- Every `localStorage` access goes through `cache.ts` inside try/catch, so blocked storage degrades to no persistence.

### Visual direction: lean, numbers first
The user asked for a modern, lean look and accepted a later redesign. Choices:

```
┌──────────────────────────────────────────────────────────────┐
│ Renda Fixa   Comparador  Taxa equivalente  Inflação  Ajuda   │
├──────────────────────────────────────────────────────────────┤
│ CDI 13,65% ●  Selic 13,75% ●  IPCA 12m 4,58% ●  Focus ●  ⚙  │  ← chip strip
├───────────────────────────┬──────────────────────────────────┤
│ Ativos           [+ Novo] │  Resultado              [Copiar] │
│ ┌───────────────────────┐ │  ┌────────────────────────────┐  │
│ │ CDB  110% CDI  2 anos │ │  │ table: líquido, a.a., %CDI │  │
│ │ R$ 10.000,00          │ │  └────────────────────────────┘  │
│ └───────────────────────┘ │  ┌────────────────────────────┐  │
│ ┌───────────────────────┐ │  │ chart                      │  │
│ │ LCA  92% CDI  1 ano   │ │  │                            │  │
│ └───────────────────────┘ │  └────────────────────────────┘  │
└───────────────────────────┴──────────────────────────────────┘
        mobile: single column, assets above results
```

- Type: Inter from Google Fonts, `font-variant-numeric: tabular-nums` on every number so columns align.
- Color: neutral gray scale for surfaces and text, one accent (emerald) for the best result and primary actions, red only for errors. Light and dark themes follow `prefers-color-scheme`, defined as CSS custom properties on `:root`.
- Surfaces: 1 px borders and 12 px radius, no drop shadows and no gradients.
- Density: compact asset cards that expand on click to edit, so a 6-asset comparison fits one screen at 1280×800.
- Source markers: a small dot per indicator (filled for fetched, outline for cache, pencil for manual), each a link into the help section.
- No UI kit. Hand-written CSS with tokens keeps the bundle small and the look consistent.

### Deployment
A GitHub Actions workflow on push to `main` runs typecheck, Vitest, `vite build` with `base: '/comparador-renda-fixa/'`, then `actions/upload-pages-artifact` and `actions/deploy-pages`. A failed test blocks the deploy.

### Custody fee does not reduce the IR base
The B3 tariff page and the Tesouro Direto rules describe the fee as accrued daily on the position value and deducted from the amount received at redemption, maturity or coupon. IR applies to the gain alone. No source found on 2026-10-15 says the fee reduces the IR base, so the engine computes IR on the gross gain and subtracts the fee separately. If an official source says otherwise, the change is one line in `result.ts`.

## Risks / Trade-offs

- [BrasilAPI is community-run and may go down or change shape] → The 252/365 fallback plus per-year caching, and each result discloses its method.
- [BCB SGS responses can be slow; series 432 took about 20 s on one probe] → Parallel fetches, 20 s timeout, cached values shown at once while a refresh runs.
- [Tax law changes, e.g. a revived MP 1303 taxing LCI/LCA] → All rules sit in `tax-rules.ts`. The user accepted that a law change means a code change and redeploy.
- [Constant CDI over the whole term overstates or understates long pós-fixados] → Accepted for v1. The user can override CDI by hand, and the help section states the assumption.
- [IPCA per calendar year applied over business days ignores monthly seasonality and the IPCA lag in Tesouro IPCA+] → Accepted. The approximation error is small next to the forecast uncertainty, and the help section states it.
- [Custody fee modeled as a daily pro-rata charge on the gross balance; B3 charges semiannually on the position value] → Small difference over long terms. Documented in help.
- [URL payloads from older versions] → The `v` field allows migration. Unknown versions show "Link inválido".

## Migration Plan

This is the first deploy. Enable GitHub Pages with the source set to "GitHub Actions" in the repository settings, push to `main`, and check the published URL. Rollback: revert the commit on `main` and the workflow redeploys the previous build.
