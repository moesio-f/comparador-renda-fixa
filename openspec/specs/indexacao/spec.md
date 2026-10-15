# indexacao Specification

## Purpose

Proves site ownership to Google Search Console so the owner can see search data and manage indexing, without adding any tracking for visitors.

## Requirements

### Requirement: Google site verification
The page head SHALL include `<meta name="google-site-verification" content="XNbgU703w1WzOOWSGYzw1vMPGNItXfHe5C6--gi3_2k" />`. The system SHALL NOT load any Google script or make any request to Google from the visitor's browser for this purpose.

#### Scenario: Googlebot verifies ownership
- **WHEN** Google Search Console fetches the deployed index page
- **THEN** the head contains the verification meta tag with the token above

#### Scenario: No requests from visitors
- **WHEN** a visitor loads the page
- **THEN** the browser makes no request to a Google domain because of the verification tag
