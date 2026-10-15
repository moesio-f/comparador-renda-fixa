# inflacao-implicita Specification

## Purpose

Computes the breakeven inflation between a pré asset and an IPCA+ asset over the same term, so the user can judge which one wins under their inflation expectation.

## Requirements

### Requirement: Breakeven inflation
The user SHALL enter a pré rate, an IPCA + spread and a term. The system SHALL compute the annual IPCA at which both assets reach the same value at maturity: `(1 + pré) / (1 + spread) − 1`. Both assets share the term and therefore the IR rate, so the breakeven does not depend on tax, and the page SHALL say so in one line.

#### Scenario: Breakeven
- **WHEN** the pré rate is 13,00% a.a. and the IPCA + spread is 7,00% a.a.
- **THEN** the breakeven inflation is 5,61% a.a.

### Requirement: Compare against Focus
The system SHALL show the average Focus IPCA projection over the term next to the breakeven, and SHALL state which asset wins if inflation matches Focus: "Pré vence se o IPCA ficar abaixo de X%" and "IPCA+ vence se o IPCA ficar acima de X%".

#### Scenario: Focus below breakeven
- **WHEN** the breakeven is 5,61% and the average Focus projection over the term is 4,50%
- **THEN** the page states that the pré asset wins under the Focus projection

### Requirement: Missing projection
If no IPCA projection is available, the system SHALL still compute the breakeven and SHALL hide the Focus comparison with a note asking the user to fill in the IPCA projection.

#### Scenario: Focus unavailable
- **WHEN** the Focus fetch failed and the user has not entered projections
- **THEN** the breakeven shows and the Focus comparison shows "Informe a projeção de IPCA para comparar"
