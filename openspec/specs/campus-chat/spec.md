# Real-Time Location-Based Campus Chat

## Purpose
Provides an optional, lightweight, distraction-free real-time chat channel for students studying in the same virtual study location. Enables ambient student encouragement, question sharing, and study camaraderie without turning Studyverse into a noisy social network.

## Requirements

### Requirement: Location-Scoped Chat Channels
The system SHALL isolate chat messages strictly to the study location currently occupied by the student (e.g. Central Library, Lecture Hall Complex, Banyan Tree, Campus Café, Sangam Gardens, Open Air Theatre, Gajendra Circle).

#### Scenario: Messages sent in a location
- **WHEN** a student sends a message while in Central Library
- **THEN** only students currently in Central Library receive the message; students in Lecture Hall or on the Campus Map do not receive it.

#### Scenario: Navigating between locations
- **WHEN** a student navigates from one location to another (e.g. Library to LHC)
- **THEN** they cleanly leave the old location's chat channel and join the new location's channel without interrupting their overall study session.

### Requirement: Multi-Tier Real-Time Broadcast
The system SHALL deliver messages instantly using Supabase Realtime Broadcast when configured, and automatically fall back to decentralized WebRTC data channels over Port 443 WSS Nostr relays and BroadcastChannel for cross-device, firewall-proof communication.

#### Scenario: Real-time broadcast
- **WHEN** a student submits a valid message
- **THEN** the message is dispatched to all peers in the same room channel within milliseconds without permanent database storage.

### Requirement: Optional & Non-Distracting Experience (Quiet Study)
The chat interface SHALL remain optional, collapsible, and non-intrusive to support productive deep work.

#### Scenario: Chat minimised and Quiet Study mode
- **WHEN** a student minimises chat with Quiet Study enabled
- **THEN** incoming messages are received in the background without audio or visual distraction; upon reopening, messages are visible in chronological order.

### Requirement: Safety, Sanitization & Rate Limiting
The system SHALL enforce safety limits to prevent abuse and spam in anonymous sessions.

#### Scenario: Safety safeguards
- **WHEN** a student sends a message
- **THEN** the text is validated (max 300 characters, non-empty, HTML stripped), rate-limited to 1 message per second, and fellow students have one-click options to report messages or mute students for the session.

### Requirement: Quick Study Reactions
The system SHALL provide one-click study shortcuts (e.g. "👋 Hello!", "📚 Let's study!", "⏱️ Starting focus", "☕ Taking a break", "💪 Keep going!", "🙌 Good luck!") for effortless encouragement.
