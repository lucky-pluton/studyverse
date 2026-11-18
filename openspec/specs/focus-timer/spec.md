# Personal Focus & Pomodoro Timer

## Purpose
Provides an independent, personal productivity timer (Pomodoro, Short Break, Deep Focus, Long Break, and Custom) distinct from the overall session study duration and campus seat occupancy, allowing students to structure their focus cycles while studying silently alongside peers.

## Requirements

### Requirement: Core Presets and Custom Time Intervals
The system SHALL provide standard focus and break intervals including:
- **Pomodoro**: 25-minute standard focus interval.
- **Short Break**: 5-minute recovery interval.
- **Deep Focus**: 50-minute uninterrupted focus interval.
- **Long Break**: 10-minute restorative break.
- **Custom Timer**: Adjustable slider between 1 and 120 minutes with quick-pick chips (15, 25, 45, 60, 90, 120m).

#### Scenario: Switching Timer Presets
- **WHEN** a student clicks or taps a preset chip (e.g. "Pomodoro", "Deep Focus", "Short Break", "Custom")
- **THEN** the timer updates its duration and mode immediately, resetting intervals cleanly without leaving orphaned timers.

#### Scenario: Adjusting Custom Slider
- **WHEN** a student adjusts the custom duration slider between 1 and 120 minutes
- **THEN** the countdown display and total duration update immediately in real time.

### Requirement: Circular Progress Indicator & Monospace Countdown
The timer SHALL render an SVG circular progress indicator with stroke-dashoffset transition, central mode badge, pulsing status indicator, and large monospace countdown digits (`MM:SS` or `HH:MM:SS`).

#### Scenario: Observing Active Countdown
- **WHEN** the timer is running
- **THEN** the circular ring smoothly depletes in synchronization with the elapsed percentage, and the status dot pulses.

### Requirement: Background-Tab Drift Immunity & Timestamp Calculation
The timer SHALL compute time remaining based on target timestamps (`endTimestamp`) rather than pure repeated `setInterval` decrements so that browser tab throttling does not cause timer drift.

#### Scenario: Backgrounding Browser Tab
- **WHEN** a student leaves the Studyverse tab or minimizes the browser window
- **THEN** upon returning, the timer recalculates remaining duration directly from `Date.now()` and `endTimestamp` without falling behind.

### Requirement: Local Persistence & Multi-Tab Synchronization
The timer mode, remaining duration, running state, start/end timestamps, sound preference, and completion count SHALL persist in `localStorage` under `studyverse_focus_timer` so page reloads do not wipe active sessions.

#### Scenario: Reloading the Webpage
- **WHEN** a student reloads the browser tab while a focus timer is running
- **THEN** the timer resumes seamlessly with the correct remaining countdown.

#### Scenario: Returning After Timer Expired While Inactive
- **WHEN** a student returns to the tab after the end timestamp has passed
- **THEN** the timer cleanly marks completion without restarting, stops the ticker, and displays the completion modal once.

### Requirement: Completion Audio & 4 Next Actions Modal
Upon countdown completion, the system SHALL play a gentle four-note crystal-style chime (C5 -> E5 -> G5 -> C6) when unmuted and display a completion modal offering 4 specific next actions:
1. Start / Repeat Focus Session (25m)
2. Take Short Break (5m)
3. Take Long Break (10m)
4. Close notification / Dismiss

#### Scenario: Timer reaches zero
- **WHEN** a focus countdown concludes (reaches 0:00)
- **THEN** the completion modal appears with the 4 action choices and the 4-note chime plays.

### Requirement: Strict Independence from Campus Session Tracking
The Personal Focus Timer SHALL operate independently from campus seat occupancy timers (`currentUser.seatEnteredAt`) and overall campus session duration (`currentUser.sessionEnteredAt`).

#### Scenario: Changing Campus Seats or Leaving Seat
- **WHEN** a student changes seats or leaves their seat in any campus study room
- **THEN** the personal focus timer continues running without interruption, and seat actions do not affect the focus countdown.
