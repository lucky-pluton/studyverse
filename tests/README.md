# Studyverse Test & Verification Suites

This directory contains automated Puppeteer and Node.js end-to-end verification suites for Studyverse.

## Test Scripts Overview

- **`test_dnd_suite.cjs`**: Verifies 10 scenarios for Do Not Disturb (DND) state, peer message blocking, badge suppression, session continuity, and storage persistence.
- **`verify_chat_multiplayer.cjs`**: Tests multi-student real-time chat, topic tags, and message propagation.
- **`verify_production_chat_sound.cjs`**: Verifies Web Audio API synthetic audio triggers and chime mute states.
- **`test_stopwatch_and_layout.cjs`**: Verifies Pomodoro, Stopwatch, and layout responsiveness.
- **`test_dock_overflow_and_overlap_comprehensive.cjs`**: Validates StudyDock positioning, avoiding collision with chat and location panels.
- **`test_study_statistics_and_ui_suite.cjs`**: Tests study analytics, streak calculations, and session metrics.
- **`test_campus_map_prototype.cjs`**: Verifies campus map canvas rendering, zoom controls, and location markers.
- **`verify_visual_spacing.cjs`**: Validates location card padding, typography, and responsive breakpoints.
- **`verify_corrected_ui.cjs`**: Validates visual alignments across desktop and mobile.

## Running Tests

Run any suite using Node or npm:

```bash
# Run specific suites via npm:
npm run test:dnd
npm run test:chat
npm run test:sound
npm run test:layout

# Or run any script directly:
node tests/test_dnd_suite.cjs
```

