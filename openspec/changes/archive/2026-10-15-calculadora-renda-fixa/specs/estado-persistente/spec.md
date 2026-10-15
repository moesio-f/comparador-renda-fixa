## Purpose

Keeps the user's assets and manual indicator values between visits and lets them share a comparison as a link, with no server.

## ADDED Requirements

### Requirement: Save to browser storage
The system SHALL save the comparador assets, the inputs of each calculator and manual indicator overrides to browser storage on every change, and SHALL restore them on the next visit. If browser storage is unavailable, the app SHALL work without persistence.

#### Scenario: Restore on return
- **WHEN** the user adds two assets, closes the tab and opens the app again
- **THEN** the two assets appear with the same fields

#### Scenario: Storage blocked
- **WHEN** the browser blocks storage access
- **THEN** the app works normally and starts empty on each visit

### Requirement: Shareable link
The system SHALL offer a "Copiar link" action that encodes the current calculator inputs into the URL and copies it to the clipboard. The link SHALL carry manual indicator overrides but SHALL NOT carry fetched indicator values.

#### Scenario: Copy link
- **WHEN** the user clicks "Copiar link" on the comparador
- **THEN** the clipboard holds a URL that reproduces the asset list and shows a confirmation "Link copiado"

### Requirement: URL takes priority
When the app opens with state in the URL, the system SHALL load that state instead of the saved state, and SHALL ask before overwriting the saved state with it.

#### Scenario: Open a shared link
- **WHEN** the user opens a shared link while having saved assets of their own
- **THEN** the app shows the linked assets and a prompt "Substituir sua comparação salva por esta?"

#### Scenario: Malformed link
- **WHEN** the URL state cannot be decoded
- **THEN** the app ignores it, loads the saved state and shows "Link inválido"
