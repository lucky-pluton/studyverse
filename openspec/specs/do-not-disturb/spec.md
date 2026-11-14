# Do Not Disturb (DND) Mode

## Purpose
Provides an accessible, distraction-free Do Not Disturb (DND) mode enabling students to enjoy the virtual campus, occupy their favourite seats, see other students studying around them, and track their study duration without receiving chat notifications, unread badges, popups, or being expected to interact.

## Requirements

### Requirement: Accessible DND Toggle
The application SHALL provide a clearly accessible toggle for Do Not Disturb (DND) mode across the study environment (in the top navigation bar, seated study dock, study location header, and inside the location chat panel).

#### Scenario: Toggling DND on and off
- **WHEN** a student clicks the DND toggle button
- **THEN** their DND state toggles between enabled and disabled with immediate visual feedback (e.g. moon icon `🌙`, "DND On" / "DND"), and their preference is saved to persistent storage (`localStorage` and `sessionStorage`).

### Requirement: Presence & Avatar Visibility in DND
The application SHALL maintain the student's full multiplayer presence and visual representation on the campus while DND is active.

#### Scenario: Student remains visible while studying quietly
- **WHEN** a student enables DND mode
- **THEN** they remain visible on the campus map and in their chosen seat; their chibi avatar, nickname, and study-duration timer remain active and visible to others; they remain part of real-time multiplayer presence.

### Requirement: Subtle DND Indicator (🌙)
The application SHALL display a subtle moon indicator (`🌙`) next to the student's nickname or avatar across all views (seats, floating timers, campus map avatar anchors, and student rosters).

#### Scenario: Other students view a peer in DND mode
- **WHEN** Student B looks at Student A who has DND enabled
- **THEN** Student B sees a subtle moon icon (`🌙`) beside Student A's name and avatar timer, indicating that Student A is studying quietly and not participating in conversations.

### Requirement: Chat Suppression & Disabled Input During DND
When DND is enabled, the application SHALL completely suppress incoming chat notifications and disable outgoing message composition.

#### Scenario: Incoming messages while DND active
- **WHEN** another student sends a chat message in the same room while Student A has DND enabled
- **THEN** Student A receives no audio notification, no message preview popup, and no unread-message counter badge on the chat trigger button.

#### Scenario: Attempting to send a message while DND active
- **WHEN** a student with DND active attempts to send a message or quick reaction
- **THEN** the input and send button are disabled, and the banner displays: *"You're in Do Not Disturb mode. Enjoy your quiet study time."*

### Requirement: Cross-Location Persistence
The student's DND preference SHALL persist across seat changes, location navigation, map exploration, and browser refreshes.

#### Scenario: Moving between locations and page refreshes
- **WHEN** a student with DND enabled changes seats, navigates to another location, returns to the campus map, or refreshes the page
- **THEN** DND remains active with all silence guarantees preserved. Disabling DND at any point restores standard chat functionality immediately.

### Requirement: Independence from Study Timers
DND mode SHALL operate independently from the student's study duration tracker and personal Pomodoro timer.

#### Scenario: Timer continuity during DND
- **WHEN** DND is toggled on or off
- **THEN** the student's total session study timer, seat timer, and personal Pomodoro / Focus Timer continue counting without resetting or pausing.
