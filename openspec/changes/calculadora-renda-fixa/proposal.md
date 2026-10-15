## Why

The user compares Brazilian fixed-income assets in a personal Google Sheet: net-of-tax returns, IR brackets, terms and growth curves. Public calculators (Investidor Sardinha, App Renda Fixa, Valor, AUVP) cover parts of this, but they force a single term, use the `taxa × (1 − IR)` shortcut for equivalent rates and hide which inputs drove a result. A static web app can replace the sheet, pull CDI, Selic and IPCA from the Banco Central, and stay free to host on GitHub Pages.

## What Changes

- New static single-page app, all UI text in Brazilian Portuguese, built with Svelte + Vite + TypeScript and deployed to GitHub Pages (`moesiof.github.io/comparador-renda-fixa`).
- Calculation engine for CDB, LCI, LCA, LIG, LF, CRI, CRA, DEB (comum and incentivada) and Tesouro Direto, with Pré, % do CDI, CDI +, IPCA + and Selic + indexers. It applies the regressive IR table, IOF for redemptions under 30 days and B3 custódia for Tesouro.
- Market indicators fetched from BCB SGS (CDI, Selic, IPCA) and Focus (IPCA expectations per year), each one editable by hand.
- Business-day calendar from BrasilAPI holidays, with a 252/365 approximation as fallback. The UI states which method each result used.
- Three calculators: Comparador (N assets, each with its own maturity, results table and growth chart), Taxa equivalente (isento ↔ tributado, exact result plus the shortcut) and Inflação implícita (pré vs IPCA+ breakeven).
- Comparisons persist in localStorage and encode into the URL, so a link reproduces a comparison.
- A help section ("Como calculamos") documents each formula, data source and fallback.
- Out of scope: monthly contributions (aportes), mark-to-market of Tesouro before maturity, fetching Tesouro Direto prices (the public endpoint returns HTTP 410), user accounts or any server.

## Capabilities

### New Capabilities

- `motor-calculo`: gross accrual per indexer, IR, IOF, custódia, net value, net annualized rate and equivalent-rate math.
- `indicadores-mercado`: fetching CDI, Selic, IPCA and Focus projections from the BCB, manual overrides and source status shown to the user.
- `calendario-dias-uteis`: business-day counting from BrasilAPI holidays, with a 252/365 fallback and disclosure of the method in use.
- `comparador-ativos`: adding, editing and removing assets, results table and growth chart across different maturities.
- `taxa-equivalente`: converting a rate between taxed and tax-exempt assets for a given term.
- `inflacao-implicita`: breakeven inflation between a pré and an IPCA+ asset for the same term.
- `estado-persistente`: localStorage persistence and URL-encoded shareable state.
- `ajuda-formulas`: in-app documentation of formulas, sources and active fallbacks.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- New codebase from scratch: Vite + Svelte + TypeScript, a charting library, and a unit test runner (Vitest) for the engine.
- External runtime dependencies, all called from the browser with CORS verified on 2026-10-15: `api.bcb.gov.br` (SGS), `olinda.bcb.gov.br` (Focus) and `brasilapi.com.br` (holidays). Each one has a manual or approximate fallback.
- GitHub Actions workflow to build and publish to GitHub Pages.
- Tax rules live in one module. A change in the law requires a code change and redeploy, which the user accepted.
