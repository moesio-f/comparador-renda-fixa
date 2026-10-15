# tema Specification

## Purpose

Lets the user pick a light or dark theme that overrides the OS preference, and keeps that choice between visits.

## Requirements

### Requirement: Theme toggle
The system SHALL show a single icon button in the header that switches the active theme between light and dark. The button SHALL show the icon of the theme it switches to and SHALL carry an accessible label naming that theme ("Usar tema escuro" or "Usar tema claro").

#### Scenario: Switch to dark
- **WHEN** the active theme is light and the user clicks the theme button
- **THEN** the app renders in dark and the button label reads "Usar tema claro"

#### Scenario: Switch back to light
- **WHEN** the active theme is dark and the user clicks the theme button
- **THEN** the app renders in light and the button label reads "Usar tema escuro"

### Requirement: Default follows the OS
While the user has not chosen a theme, the system SHALL use the OS color scheme and SHALL follow changes to it without a reload.

#### Scenario: First visit on a dark OS
- **WHEN** a user with no stored theme opens the app on an OS set to dark
- **THEN** the app renders in dark

#### Scenario: OS changes during the session
- **WHEN** a user with no stored theme has the app open and the OS switches from light to dark
- **THEN** the app switches to dark without a reload

### Requirement: Stored choice overrides the OS
After the user clicks the theme button, the system SHALL save the chosen theme to browser storage, SHALL apply it on later visits regardless of the OS setting, and SHALL ignore OS changes while a choice is stored. If browser storage is unavailable, the toggle SHALL still work for the current page view.

#### Scenario: Choice survives reload
- **WHEN** the user on a dark OS picks light and reloads the page
- **THEN** the app renders in light

#### Scenario: OS change ignored after a choice
- **WHEN** the user has picked light and the OS switches to dark
- **THEN** the app stays light

#### Scenario: Storage blocked
- **WHEN** the browser blocks storage and the user clicks the theme button
- **THEN** the theme switches, and the next visit follows the OS again

### Requirement: No flash on load
The system SHALL apply the stored theme before the first paint, so the page never shows the other theme while loading.

#### Scenario: Reload with light chosen on a dark OS
- **WHEN** the user has picked light on a dark OS and reloads the page
- **THEN** no frame renders with the dark background

### Requirement: Chart follows the active theme
The growth chart SHALL use the colors of the active theme, whether that theme comes from the OS or from the stored choice, and SHALL update when the theme changes.

#### Scenario: Toggle with a chart on screen
- **WHEN** the comparador shows the growth chart and the user switches the theme
- **THEN** the chart's lines, gridlines and labels switch to the new theme's colors

### Requirement: Theme stays out of shared links
The system SHALL NOT encode the theme in the "Copiar link" URL, and opening a shared link SHALL NOT change the recipient's theme.

#### Scenario: Open a link from a dark-theme user
- **WHEN** a user with light stored opens a link copied by a user with dark stored
- **THEN** the app renders in light
