# Studyverse tests

## What runs in CI

Every pull request runs two jobs (`.github/workflows/ci.yml`):

| Job | What it runs |
| :--- | :--- |
| Build & Test Verification | `npm run build`, then `npm run test:dnd` (Do Not Disturb, plain Node, no browser) |
| Browser Tests | builds the app, serves it with `vite preview`, then `npm run test:browser` |

`npm run test:browser` (`tests/run-browser-suite.cjs`) runs these scripts in Chrome and fails if any of them exits with an error or prints a failure line:

| Script | Checks |
| :--- | :--- |
| `test_campus_explorer_experience.cjs` | 2D map: hover previews, walking to and entering every study spot |
| `test_open_all_places_3d.cjs` | every study spot opens from the 3D campus, with its seats |
| `test_three_campus_prototype.cjs` | the 3D campus loads and responds |
| `test_focus_timer_master.cjs` | Pomodoro timer edge cases |
| `test_stopwatch_and_layout.cjs` | stopwatch, timer independence, mobile layout |
| `test_chat_shared_reports.cjs` | a chat message reported by two students is hidden for everyone |

## Running them yourself

```bash
npm run dev                          # serves the app at http://localhost:5173
npm run test:browser                 # in a second terminal
npm run test:dnd                     # no server needed
```

Settings come from environment variables (`tests/env.cjs`):

| Variable | Default |
| :--- | :--- |
| `BASE_URL` | `http://localhost:5173` |
| `CHROME_PATH` | the usual Chrome install path for your OS |
| `ARTIFACTS_DIR` | `studyverse-test-artifacts` in your temp folder (screenshots go here) |

## Scripts that are out of date

These were written for earlier versions of the interface. Run against today's app they report the failures below, so CI doesn't run them. Each needs updating before it can be trusted again:

| Script | What it reports today |
| :--- | :--- |
| `test_campus_map_prototype.cjs` | "Campus Identity Panel missing", "category legend pills missing", "Expected at least 5 location cards, found 0" |
| `verify_corrected_ui.cjs` | "Canvas background or cards missing" (and it exits successfully even when it fails) |
| `verify_visual_spacing.cjs` | "Expected at least 6 connector lines!" (its other layout checks pass) |
| `test_dock_overflow_and_overlap_comprehensive.cjs` | "Leave Seat button not found", then failed DND toggle and topic checks |
| `test_study_statistics_and_ui_suite.cjs` | "Timer utility container not open", then failed statistics checks |
| `test_fullscreen_iitm_experience.cjs` | "No element found for selector: header button[data-nav-id=\"library\"]" |
| `test_spacious_3d_campus.cjs` | "No element found for selector: [data-test-id=\"enter-study-room-btn\"]" (an id from the removed 3D prototype) |
| `test_chat_sound_multiuser_suite.cjs` | "Expected unread count to increment, got 0" |
| `verify_chat_multiplayer.cjs` (`npm run test:chat`) | times out waiting for the chat box (`input[placeholder*=\"Message\"]`) |

Other scripts:

- `verify_production_chat_sound.cjs` checks the live site (`lucky-pluton.github.io/studyverse`), not your local build.
- `test_3d_responsive.cjs` only saves screenshots for a person to look at.
- `inspect_*.cjs` capture the reference 3D maps used while building the 3D campus. They're not tests.
