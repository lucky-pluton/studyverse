# Campus Map & Occupancy

## Purpose
Provides an interactive, gamified simulation of the IIT Madras virtual campus displaying active student presence across academic and recreational study spaces.

## Requirements

### Requirement: Interactive Campus Map Navigation
The system SHALL provide a pannable, zoomable illustrated map of the IIT Madras campus with all primary study locations clearly marked.

#### Scenario: User navigates campus map
- **WHEN** a student views the main campus screen
- **THEN** they can pan and zoom across the illustrated grounds with buildings, pathways, and green spaces remaining visually anchored.

### Requirement: Live Location Occupancy Indicators
Each study location on the campus map SHALL display a floating occupancy status badge indicating whether it is empty, active, nearly full, or at capacity.

#### Scenario: Occupancy changes in real time
- **WHEN** a student occupies or vacates a seat at a study destination
- **THEN** the occupancy status badge and count updates immediately across all connected clients.
