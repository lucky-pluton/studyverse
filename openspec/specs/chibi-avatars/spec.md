# Chibi Avatar System

## Purpose
Provides a consistent, adorable chibi-style avatar visualization system for student companions with diverse appearances and location-appropriate sitting postures.

## Requirements

### Requirement: Chibi Character Styling
The avatar renderer SHALL render characters with classic chibi proportions, including slightly oversized heads with chubby cheeks, big sparkling anime catchlights, sweet smiles, and compact bodies.

#### Scenario: Onboarding avatar selection
- **WHEN** a student selects an avatar during onboarding
- **THEN** their chosen character (hair, skin, clothing, accessories, and study prop) is preserved and displayed identically across the campus map and study spaces.

### Requirement: Location-Appropriate Sitting Poses
The avatar renderer SHALL adapt the character's posture based on the study location or seat type.

#### Scenario: Student sits at a desk
- **WHEN** a student occupies a desk in the Central Library or Lecture Hall Complex
- **THEN** the avatar displays a wooden desk surface in the foreground with hands typing or holding a book.

#### Scenario: Student sits under a tree
- **WHEN** a student studies at the Banyan Tree Grove or Gajendra Circle
- **THEN** the avatar displays a cross-legged sitting posture on a soft green lawn patch.

