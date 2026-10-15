# taxa-equivalente Specification

## Purpose

Converts a rate between taxed and tax-exempt assets for a given term, so the user can tell what an LCI/LCA must pay to match a CDB and the other way around.

## Requirements

### Requirement: Convert between taxed and exempt
The user SHALL enter a direction (tributado → isento or isento → tributado), an indexer (Pré, % do CDI or IPCA +), a rate and a term. The system SHALL return the rate the other side needs to reach the same net value at maturity.

#### Scenario: CDB to LCI over two years
- **WHEN** CDI is 13,65%, the direction is tributado → isento, the rate is 100% do CDI and the term is 730 days
- **THEN** the exact equivalent is 86,53% do CDI

#### Scenario: LCA to CDB over two years
- **WHEN** CDI is 13,65%, the direction is isento → tributado, the rate is 86,53% do CDI and the term is 730 days
- **THEN** the exact equivalent is 100,00% do CDI (within 0,01 p.p.)

### Requirement: Show exact and shortcut results
The system SHALL show the exact result (IR applied once on the compounded gain at maturity) as the main number and the shortcut `taxa × (1 − IR)`, or `taxa ÷ (1 − IR)` in the other direction, beside it. The system SHALL show the difference between the two in percentage points.

#### Scenario: Both results displayed
- **WHEN** the user converts 100% do CDI over 730 days to isento
- **THEN** the page shows 86,53% do CDI as exact, 85,00% do CDI as shortcut and a difference of 1,53 p.p.

### Requirement: IR bracket shown
The system SHALL show the IR bracket that applies to the entered term.

#### Scenario: Term in the 17,5% bracket
- **WHEN** the term is 400 days
- **THEN** the page shows "IR de 17,5% (361 a 720 dias)"

### Requirement: Equivalence table by term
Below the single result, the system SHALL show the exact equivalent rate for the same input at terms of 180, 360, 720 and 1080 days and at the entered term.

#### Scenario: Table rows
- **WHEN** the user converts 100% do CDI to isento
- **THEN** the table lists the equivalent for 180, 360, 720 and 1080 days and for the entered term
