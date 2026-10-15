# indicadores-mercado Specification

## Purpose

Supplies the CDI, Selic and IPCA values that the calculators depend on, fetched from the Banco Central or set by hand, and tells the user where each value came from.

## Requirements

### Requirement: Fetch indicators on load
On page load, the browser SHALL fetch from the Banco Central, with no server of its own: CDI annualized (SGS 4389), Selic meta (SGS 432), Selic efetiva annualized (SGS 1178), IPCA accumulated over 12 months (SGS 13522) and the median Focus IPCA expectation for each calendar year (Olinda Expectativas, annual series, latest survey date).

#### Scenario: Successful fetch
- **WHEN** every request succeeds
- **THEN** the indicators panel shows each value with its reference date and the label "Banco Central" or "Focus"

### Requirement: Indicator used by each indexer
% do CDI and CDI + SHALL use CDI annualized. Selic + SHALL use Selic efetiva annualized. IPCA + SHALL use the Focus projection per year. Selic meta and IPCA 12 meses SHALL appear for reference only.

#### Scenario: Selic meta is not used in math
- **WHEN** Selic meta is 13,75% and Selic efetiva is 13,65%
- **THEN** a Selic + asset accrues at 13,65% a.a. plus its spread

### Requirement: Manual override
The user SHALL be able to edit each indicator used in math, including each Focus year. An edited value SHALL replace the fetched one in every calculation and SHALL display a "manual" marker. The user SHALL be able to restore the fetched value.

#### Scenario: Override CDI
- **WHEN** the user edits CDI to 12,00%
- **THEN** every result recomputes with 12,00% and the CDI field shows the "manual" marker

#### Scenario: Restore fetched value
- **WHEN** the user clicks "restaurar" on an overridden indicator
- **THEN** the system returns to the last fetched value and removes the marker

### Requirement: Fetch failure
If a request fails or times out after 20 seconds, the system SHALL keep the last value cached in the browser, if any, marked with its date. If no cached value exists, the field SHALL stay empty, require manual input and block calculations that depend on it with a message in Portuguese.

#### Scenario: Offline with cache
- **WHEN** the BCB request fails and a cached CDI from a previous visit exists
- **THEN** the panel shows the cached CDI with the label "valor salvo em <data>"

#### Scenario: Offline without cache
- **WHEN** the BCB request fails and no cached CDI exists
- **THEN** the CDI field asks for manual input and assets indexed to CDI show "Informe o CDI para calcular"

### Requirement: Cache fetched indicators
The system SHALL store fetched indicators in the browser and SHALL reuse them for up to 12 hours before fetching again.

#### Scenario: Reload within 12 hours
- **WHEN** the user reloads the page 1 hour after a successful fetch
- **THEN** the system uses the cached values without calling the BCB
