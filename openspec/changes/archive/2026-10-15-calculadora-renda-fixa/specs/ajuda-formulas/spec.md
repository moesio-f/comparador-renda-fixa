## Purpose

Documents in the app how each number is calculated and where each input comes from, so the user can audit any result.

## ADDED Requirements

### Requirement: Help section
The app SHALL provide a "Como calculamos" section, in Portuguese, covering: indexer accrual formulas, the IR table, the IOF table, the custody fee, the exact and shortcut equivalence formulas, breakeven inflation, business-day counting with its fallback, and the data sources with their series codes.

#### Scenario: Open help
- **WHEN** the user opens "Como calculamos"
- **THEN** the page lists each formula with a worked example using the current CDI

### Requirement: Contextual links
Each method marker, source label and the exact and shortcut values SHALL link to the matching part of the help section.

#### Scenario: Click the approximation marker
- **WHEN** the user clicks "Dias úteis aproximados (252/365)" on a result
- **THEN** the help section opens at the business-day counting entry

### Requirement: Live status in help
The help section SHALL show the current state of each data source: fetched (with date), cached (with date), manual or unavailable.

#### Scenario: Calendar on fallback
- **WHEN** BrasilAPI failed for 2028
- **THEN** the help section states that terms reaching 2028 use the 252/365 approximation

### Requirement: Language and style
All UI text SHALL be in Brazilian Portuguese, use Brazilian number formatting (comma as decimal separator, dot as thousands separator, "R$" prefix) and SHALL NOT contain em dashes.

#### Scenario: Number formatting
- **WHEN** the app displays ten thousand reais and a rate of eleven point seven percent
- **THEN** the values read "R$ 10.000,00" and "11,71%"
