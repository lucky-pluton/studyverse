# Personal Focus & Pomodoro Timer

## Purpose
Provides an independent, personal productivity timer (Pomodoro, Short Break, Deep Focus, Long Break, and Custom) distinct from the overall session study duration, allowing students to structure their focus cycles while studying silently alongside peers.

## Requirements

### Requirement: Preset and Custom Time Intervals
The system SHALL provide standard focus and break intervals including 25-minute Pomodoro, 5-minute Short Break, 50-minute Deep Focus, 10-minute Long Break, and an adjustable Custom duration between 1 and 120 minutes.

#### Scenario: Switching Timer Presets
- **WHEN** a student clicks or taps a preset chip (e.g. "Pomodoro", "Deep Focus", "Short Break")
- **THEN** the timer updates its duration and mode while keeping the session state consistent.

### Requirement: Background-Tab Drift Immunity
The timer SHALL compute time remaining based on target timestamps (`endTimestamp`) rather than pure intervals so that browser tab throttling does not cause timer drift.

#### Scenario: Backgrounding Browser Tab
- **WHEN** a student leaves the Studyverse tab or minimizes the browser window
- **THEN** upon returning, the timer calculates remaining duration from the actual elapsed system clock time without falling behind.

### Requirement: Local Persistence
The timer mode, remaining duration, running state, and audio preference SHALL persist in `localStorage` under `studyverse_focus_timer` so page reloads do not wipe active sessions.

#### Scenario: Reloading the Webpage
- **WHEN** a student reloads the browser tab while a focus timer is running
- **THEN** the timer resumes seamlessly with the correct remaining countdown.

### Requirement: Completion Audio & Break Prompts
Upon countdown completion, the system SHALL play a peaceful 4-note chime (when unmuted) and display an in-app completion toast with one-click actions to start a break or repeat focus.

#### Scenario: Timer reaches zero
- **WHEN** a focus countdown concludes (reaches 0:00)
- **THEN** a chime sound plays and a banner appears offering a break or repeat session.

