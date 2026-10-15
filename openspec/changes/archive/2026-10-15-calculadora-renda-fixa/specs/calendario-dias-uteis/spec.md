## Purpose

Counts business days between two dates so that CDI, Selic and annual rates accrue over the right number of days, and discloses whether the count is exact or approximate.

## ADDED Requirements

### Requirement: Exact count from national holidays
The system SHALL fetch national holidays from BrasilAPI (`/api/feriados/v1/{ano}`) for every year in a term and SHALL count business days as weekdays that are not holidays. The start date SHALL be excluded and the maturity date included.

#### Scenario: Carnaval excluded
- **WHEN** a term runs from 2027-02-05 to 2027-02-12 and holidays for 2027 loaded
- **THEN** the count is 3 business days (Feb 10, 11, 12), excluding Carnaval on Feb 8 and 9

### Requirement: Approximation fallback
If the holidays for any year in a term are unavailable, the system SHALL count business days as `dias corridos × 252 / 365` without rounding.

#### Scenario: Holiday fetch fails
- **WHEN** BrasilAPI fails for 2028 and an asset matures in 2028
- **THEN** the asset uses the approximation for its whole term

#### Scenario: Two-year term approximated
- **WHEN** the approximation applies to a 730-day term
- **THEN** the count is 504 business days

### Requirement: Disclose the method in use
Each result SHALL show which method produced its business-day count: "Dias úteis exatos (feriados nacionais)" or "Dias úteis aproximados (252/365)". The indicators panel SHALL show the overall calendar status.

#### Scenario: Mixed methods in one comparison
- **WHEN** one asset uses the exact count and another uses the approximation
- **THEN** each row of the results table shows its own method marker

### Requirement: Cache holidays
The system SHALL store fetched holidays per year in the browser and SHALL NOT request a year again once stored.

#### Scenario: Second visit
- **WHEN** the user returns after holidays for 2026 and 2027 were stored
- **THEN** the system makes no BrasilAPI request for those years
