## Purpose

Computes gross and net returns of Brazilian fixed-income assets held to maturity, applying IR, IOF and custody costs, so every calculator in the app shares the same math.

## ADDED Requirements

### Requirement: Supported asset types and tax defaults
The system SHALL support the asset types CDB, LCI, LCA, LIG, LF, CRI, CRA, DEB and Tesouro Direto. Each type SHALL set a default tax regime: CDB, LF, DEB comum and Tesouro Direto are taxed by the regressive IR table, and LCI, LCA, LIG, CRI, CRA and DEB incentivada are exempt for individuals (pessoa física). DEB SHALL expose an "incentivada" flag that switches its regime to exempt.

#### Scenario: LCA defaults to exempt
- **WHEN** the user adds an LCA
- **THEN** the system computes it with zero IR and zero IOF

#### Scenario: Incentivized debenture
- **WHEN** the user adds a DEB and marks it as incentivada
- **THEN** the system computes it with zero IR

#### Scenario: Common debenture
- **WHEN** the user adds a DEB without the incentivada flag
- **THEN** the system applies the regressive IR table

### Requirement: Indexers
The system SHALL support the indexers Pré (annual rate), % do CDI (percentage of CDI), CDI + (CDI plus annual spread), IPCA + (IPCA plus annual spread) and Selic + (Selic plus annual spread). Annual rates SHALL convert to daily rates on a 252 business-day basis. For % do CDI, the daily factor SHALL be `1 + p × ((1 + CDI)^(1/252) − 1)`, compounded over the business days of the term. CDI and Selic SHALL stay constant at the current indicator value for the whole term. IPCA SHALL use the projection of each calendar year for the business days that fall in that year.

#### Scenario: 100% do CDI over two years
- **WHEN** CDI is 13,65% a.a. and an asset pays 100% do CDI for 504 business days
- **THEN** the gross factor is 1,13650² = 1,291632 (rounded to 6 decimals)

#### Scenario: 110% do CDI compounds daily
- **WHEN** CDI is 13,65% a.a. and an asset pays 110% do CDI for 504 business days
- **THEN** the gross factor is 1,325103 (rounded to 6 decimals), above 1 + 1,1 × 0,291632

#### Scenario: IPCA projection per year
- **WHEN** an IPCA + asset spans 2026 and 2027 and the projections are 5,22% for 2026 and 4,30% for 2027
- **THEN** the system applies 5,22% a.a. to the 2026 business days and 4,30% a.a. to the 2027 business days

#### Scenario: Term past the last projected year
- **WHEN** an IPCA + asset matures after the last year with a projection
- **THEN** the system repeats the last available projection for the remaining years

### Requirement: Regressive IR table
For taxed assets, the system SHALL apply IR on the gain at redemption using calendar days held: 22,5% up to 180 days, 20% from 181 to 360 days, 17,5% from 361 to 720 days and 15% above 720 days.

#### Scenario: Bracket boundaries
- **WHEN** a taxed asset is held for 180, 181, 720 and 721 calendar days
- **THEN** the IR rates are 22,5%, 20%, 17,5% and 15% respectively

### Requirement: IOF on short redemptions
For taxed assets redeemed within 29 calendar days, the system SHALL apply IOF on the gain using the regressive table from 96% on day 1 to 3% on day 29, and 0% from day 30 onward. IR SHALL apply to the gain after IOF.

#### Scenario: Ten-day redemption
- **WHEN** a taxed asset is held for 10 calendar days
- **THEN** the system levies IOF at 66% of the gain and IR at 22,5% of the remaining gain

#### Scenario: Thirty-day redemption
- **WHEN** a taxed asset is held for 30 calendar days
- **THEN** the system levies no IOF

### Requirement: Tesouro Direto custody fee
For Tesouro Direto assets, the system SHALL deduct the B3 custody fee of 0,20% a.a. pro rata, applied to the invested balance. Tesouro Selic SHALL be exempt from the fee on the portion up to R$ 10.000,00. The fee SHALL reduce the net value and SHALL appear as a separate line in the result.

#### Scenario: Tesouro Selic under the exemption limit
- **WHEN** the user invests R$ 5.000,00 in Tesouro Selic
- **THEN** the custody fee is zero

#### Scenario: Tesouro Prefixado
- **WHEN** the user invests R$ 5.000,00 in a Tesouro Prefixado
- **THEN** the system deducts 0,20% a.a. pro rata on the balance

### Requirement: Result per asset
For each asset, the system SHALL return the invested amount, gross value, gross gain, IOF, IR, custody fee, net value, net gain, net annualized rate (252 business-day basis) and the net rate expressed as % do CDI. The net rate as % do CDI SHALL be the percentage that, accrued daily as defined for the % do CDI indexer, produces the same net factor over the same business days.

#### Scenario: Net annualized rate of a taxed CDB
- **WHEN** CDI is 13,65% a.a. and a CDB pays 100% do CDI for 730 calendar days (504 business days)
- **THEN** the net gain is 24,7887% of the investment and the net annualized rate is 11,71% a.a. (86,53% do CDI)

### Requirement: Input validation
The system SHALL reject negative rates below −100%, zero or negative terms and zero or negative invested amounts, showing the error next to the field in Portuguese. The system SHALL NOT compute a result for an asset with invalid input.

#### Scenario: Zero term
- **WHEN** the user sets the term of an asset to 0 days
- **THEN** the field shows "O prazo deve ser maior que zero" and the asset shows no result
