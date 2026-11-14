# Multiplayer Presence & Seat Exclusivity

## Purpose
Coordinates real-time student presence and enforces seat exclusivity across the virtual campus so that each seat in a study space can only be occupied by one student at a time, connecting students across any browser, incognito window, or device worldwide.

## Requirements

### Requirement: Multi-Tier Real-Time Presence Synchronization
The system SHALL propagate student join, leave, seat change, and heartbeat events across all active peers using Supabase Realtime when configured, an automatic zero-configuration Global Cloud Relay over secure TLS WebSockets for cross-device presence, and BroadcastChannel for zero-latency multi-tab sync.

#### Scenario: Peer connects or disconnects
- **WHEN** a student enters a location or closes their tab
- **THEN** their presence indicator and avatar cluster update immediately on the campus map and location view across all connected devices.

### Requirement: Cross-Device and Incognito Isolation Bridging
The system SHALL support cross-device communication across isolated browser environments (including private/incognito windows and mobile devices) through the cloud transport layer.

#### Scenario: Two independent sessions connect
- **WHEN** two sessions open on different devices or in normal vs. incognito windows
- **THEN** both sessions receive each other's presence, render avatars in their respective locations, and synchronize seat status.

### Requirement: Seat Conflict Resolution
Each study seat SHALL be exclusive to one student at a time.

#### Scenario: Seat contention
- **WHEN** two students attempt to claim the same seat concurrently
- **THEN** the earlier occupant retains the seat and the second student is gently notified to select another spot.

### Requirement: Reconnection and Stale Peer Cleanup
The system SHALL automatically handle network reconnections and purge inactive peers after heartbeat expiration without dropping active students.

#### Scenario: Unexpected disconnection
- **WHEN** a student loses internet connection or closes their browser without sending an explicit leave event
- **THEN** the transport's Last Will or heartbeat timeout detects the inactivity and removes the student from the campus occupancy.
