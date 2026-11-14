# Multiplayer Presence & Seat Exclusivity

## Purpose
Coordinates real-time student presence and enforces seat exclusivity so that each seat in a study space can only be occupied by one student at a time.

## Requirements

### Requirement: Real-time Presence Synchronization
The system SHALL propagate student join, leave, seat change, and heartbeat events across all active peers using Supabase Realtime or BroadcastChannel fallback.

#### Scenario: Peer connects or disconnects
- **WHEN** a student enters a location or closes their tab
- **THEN** their presence indicator and avatar cluster update immediately on the campus map and location view.

### Requirement: Seat Conflict Resolution
Each study seat SHALL be exclusive to one student at a time.

#### Scenario: Seat contention
- **WHEN** two students attempt to claim the same seat concurrently
- **THEN** the earlier occupant retains the seat and the second student is gently notified to select another spot.

