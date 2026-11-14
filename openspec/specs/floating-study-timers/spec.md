# Floating Study Timers

## Purpose
Displays live study duration counters directly above student avatars to provide silent companionship, motivation, and study accountability.

## Requirements

### Requirement: Tiny Floating Timer Pill
The system SHALL display a compact, soft cream timer pill immediately above each occupied avatar's head showing their continuous time seated.

#### Scenario: Timer formatting
- **WHEN** a student has been seated for a given duration
- **THEN** the timer displays concise human-readable time (e.g. 5m, 18m, 45m, 1h 12m, 2h 05m) with dark typography and an emerald pulse dot.

### Requirement: Live Continuous Updates
The timer SHALL continuously recalculate and increment in real time without requiring a manual refresh.

#### Scenario: Active study session
- **WHEN** time elapses while a student is studying in a seat
- **THEN** the floating pill updates seamlessly across all connected clients.

