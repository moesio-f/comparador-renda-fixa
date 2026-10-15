## Purpose

Lets the user enter several fixed-income assets with their own rates and maturities and compare their net returns in a table and a chart.

## ADDED Requirements

### Requirement: Manage assets
The user SHALL be able to add, edit, duplicate and remove assets. Each asset SHALL have: a name (optional, defaulting to type and rate), type, indexer, rate, invested amount and term. The term SHALL accept either a maturity date or a number of calendar days, and the system SHALL show the other form alongside.

#### Scenario: Add a CDB
- **WHEN** the user adds a CDB at 110% do CDI, R$ 10.000,00, maturing in 730 days
- **THEN** the asset appears in the list with the maturity date computed from today

#### Scenario: Duplicate an asset
- **WHEN** the user duplicates an asset
- **THEN** a copy with the same fields appears below it, ready to edit

### Requirement: Per-asset maturity
Each asset SHALL keep its own maturity. The system SHALL NOT force a shared term.

#### Scenario: Different maturities
- **WHEN** the user compares an LCA maturing in 1 year and a CDB maturing in 3 years
- **THEN** each asset is computed to its own maturity

### Requirement: Results table
The system SHALL show a table with one row per asset containing: net value, net gain, IR, IOF, custody fee, net annualized rate, net rate as % do CDI and the business-day method. The IOF and custody columns SHALL appear only when at least one asset pays that cost; otherwise a note below the table SHALL state that no asset pays it. The row with the highest net annualized rate SHALL be highlighted. The user SHALL be able to sort by any numeric column.

#### Scenario: No asset pays IOF
- **WHEN** every asset has a term of 30 days or more
- **THEN** the table has no IOF column and shows "Nenhum ativo paga IOF."

#### Scenario: Best asset highlighted
- **WHEN** three assets have net annualized rates of 11,2%, 11,9% and 11,5%
- **THEN** the row with 11,9% is highlighted

### Requirement: Growth chart
The system SHALL plot the net value of each asset over time, from today until the latest maturity, with one line per asset. Each line SHALL end at its asset's maturity. Hovering over a point SHALL show the date and the net value of each asset at that date.

#### Scenario: Line ends at maturity
- **WHEN** one asset matures in 1 year and another in 3 years
- **THEN** the first line stops at 1 year and the second continues to 3 years

### Requirement: Recompute on change
The system SHALL recompute results and chart when any asset or indicator changes, without a submit button.

#### Scenario: Edit rate
- **WHEN** the user changes a rate from 110% to 120% do CDI
- **THEN** the table and chart update without further action

### Requirement: Empty state
With no assets, the comparador SHALL show an empty state inviting the user to add the first asset.

#### Scenario: First visit
- **WHEN** the user opens the comparador with no saved assets and no URL state
- **THEN** the page shows the empty state with an "Adicionar ativo" button
