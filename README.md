# 🏛️ SAHEJ-SHALA — IIT Madras Virtual Campus

[![Deploy to GitHub Pages](https://github.com/lucky-pluton/studyverse/actions/workflows/deploy.yml/badge.svg)](https://github.com/lucky-pluton/studyverse/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?style=flat&logo=github)](https://lucky-pluton.github.io/studyverse/)

> **Live Shareable Link**: [https://lucky-pluton.github.io/studyverse/](https://lucky-pluton.github.io/studyverse/)  
> **Direct Campus Preview (Demo Mode)**: [https://lucky-pluton.github.io/studyverse/?demo=true](https://lucky-pluton.github.io/studyverse/?demo=true)

---

A tranquil, multiplayer virtual campus simulation inspired by the lush green grounds of **IIT Madras**, where online students study alongside other students in ambient, silent companionship.

Sahej-Shala recreates the feeling of being on a serene university campus: sitting in the iconic Central Library, preparing lecture revisions in the Lecture Hall Complex (LHC), studying quietly beneath the ancient Banyan Tree, or spending a peaceful afternoon at the Open Air Theatre (OAT).

This is **not** a video conferencing application, social media platform, or conventional productivity dashboard. It is an ambient virtual world designed around:
- **Silent companionship & mutual accountability**
- **A feeling of belonging to a shared campus**
- **Ambient social presence without social media distractions**
- **A peaceful, motivating study atmosphere**

---

## 🌿 Campus Landmarks & Study Destinations

Every major campus destination has its own physical, illustrated study room with predefined seating spots:

1. **🏛️ Central Library (IIT Madras)**:
   - High ceilings, tall windows with outdoor views of rain trees and grazing chital deer, emerald green banker's lamps, teak wood research tables, and individual study cubicles.
   - 10 predefined seats with real-time timers and avatars.

2. **🎓 Lecture Hall Complex (LHC & Classrooms)**:
   - Stepped lecture hall amphitheatre, large chalkboards with mathematics and physics equations, tiered student desks, and adjacent classroom corners for exam preparation.
   - 10 predefined seats with real-time timers and avatars.

3. **🌳 The Grand Banyan Tree Study Grove**:
   - Iconic campus tree-side study spot beneath an ancient banyan canopy with cascading aerial prop roots, stone benches, rustic wooden tables, and sweet birdsong.
   - 10 predefined seats with real-time timers and avatars.

4. **🎭 Open Air Theatre (OAT)**:
   - The legendary IIT Madras amphitheatre with semicircular stone tiers under the open sky and stars, stage timber benches, and evening breezes.
   - 10 predefined seats with real-time timers and avatars.

5. **☕ Campus Café (Himalaya Food Court)**:
   - Cozy campus cafeteria with Chennai filter coffee aroma, blackboard menu, wooden patio tables under striped awnings, and potted palms.
   - 10 predefined seats with real-time timers and avatars.

6. **🦌 Sangam Gardens & Deer Trail**:
   - Verdant botanical lawns, lotus pond, blooming scarlet gulmohar petals falling, and gentle spotted chital deer and blackbucks grazing peacefully in the background.
   - 10 predefined seats with real-time timers and avatars.

7. **🐘 Gajendra Circle (GC) Pavilion**:
   - The world-famous central roundabout of IIT Madras featuring the iconic elephant monument, circular fountain, stone benches, and shady rain trees at the intersection of Delhi and Bonn Avenues.
   - 8 predefined seats with real-time timers and avatars.

8. **✨ Upcoming Verified Campus Destinations**:
   - *Chemplast Cricket Ground Pavilion*
   - *Department of Aerospace Wind Tunnel Quad*
   - *Students Activity Centre (SAC)*
   - *Mandakini & Krishna Hostel Quads*

---

## 🎮 Interactive Gamified Campus Map & Live Occupancy

- **Live Avatar Clusters Directly on Map**: See miniature illustrated avatars resting or studying at their actual physical locations on campus (Central Library, LHC, Banyan Tree Grove, OAT, Campus Café, Sangam Gardens, Gajendra Circle).
- **Occupancy Badges & Dynamic Auras**:
  - Empty: subtle neutral indicator.
  - Students present: vibrant green indicator with subtle radial pulse aura.
  - Nearly full: warm amber indicator.
  - Full: muted red indicator.
- **Interactive Location Preview Popovers**: Hover or tap any destination to view a rich preview card with live seat breakdown, capacity progress bar, present student avatars, and a direct "ENTER LOCATION" action.
- **Live Campus Information Panel & Student Discovery**:
  - Total online students, active spots count, total occupied vs available seats.
  - Location-wise breakdown table with fill levels.
  - "Where Everyone Is Studying" discovery tab showing active learners, their location, and time seated.
- **Exploration Map**: An illustrated cartoonish campus map showing the full layout with Delhi Avenue, Bonn Avenue, Alumni Avenue, Gajendra Circle, green canopies, and free-roaming spotted deer.
- **Interactive Controls**:
  - Zoom in (`+`), Zoom out (`-`), and Reset View (`Fit Campus`).
  - Smooth click-and-drag panning across the entire campus.
  - Hover highlights on buildings with live student counts and study type tags.
  - Quick destination selector cards for one-click travel.
- **Atmospheric Day/Night Cycle**:
  - **Daylight**: Bright, sunlit green campus.
  - **Golden Sunset**: Warm amber hues and evening skies.
  - **Quiet Night**: Deep twilight with starry skies and glowing campus lanterns.
- **Procedural Ambient Audio (Web Audio API)**:
  - Central Library rain & AC hum.
  - LHC classroom quiet focus.
  - Banyan Grove & Sangam rustling leaves with singing birds.
  - Campus Café filter coffee steam & acoustic warmth.
  - OAT open-air evening breeze.

---

## 🌐 3D Campus and 3D Study Rooms

- **Campus built from the map**: The 3D campus (`campus3d.html`, code in `src/campus3d/`) raises every building from its OpenStreetMap footprint: about 3,900 buildings, the real road network, lakes, the campus forest and Guindy National Park next door. Heights use mapped floor counts where they exist and are estimated otherwise.
- **Study spots on the map**: The seven study rooms are pinned at their real places with live student counts. Select one and choose **Enter** to open the room.
- **Rooms in 3D**: A room entered from the 3D campus opens as a 3D scene in the same style. Every seat from the illustrated room has a matching 3D spot, so seats, timers and presence are shared. Switch between **2D** and **3D** from the room's control pill.
- **Tools**: search (`Ctrl K`), guided tour, walking routes over the real paths (distance and minutes on foot), street-level walking, and the time of day with the sun position for Chennai.
- **Updating the map data**: `node scripts/build-campus-data.mjs --fetch` downloads fresh OpenStreetMap data and rewrites `public/data/iitm-campus.json`. Without `--fetch` it reuses the cached download in `scripts/.cache/`.
- **Credit**: Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, available under the ODbL. The credit is shown on the 3D page.
- **IIT Madras seal**: The seal on the 3D Main Gate sign is [IIT Madras Logo (Black and White).svg](https://commons.wikimedia.org/wiki/File:IIT_Madras_Logo_(Black_and_White).svg) by Indian Institute of Technology Madras, via Wikimedia Commons, licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). It is stored as `public/brand/iitm-logo.svg` and recoloured gold in the browser; the recoloured seal is shared under the same licence. Sahej-Shala is not affiliated with or endorsed by IIT Madras.

---

## 👥 Real-Time Multiplayer Presence

- **Dual-Layer Realtime Architecture**:
  - **Local Peer Mode (Default)**: Automatically synchronizes between any browser tabs or windows on the same device using `BroadcastChannel` and `WebStorage` events. Open a second window to test multiplayer immediately with zero configuration!
  - **Global Cloud Mode**: Seamlessly connects to **Supabase Realtime Presence** for cross-device multiplayer across phones, tablets, and different computers. Just supply `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
- **Floating Timers Above Avatars**:
  - Real-time seat timer counting up (`5m`, `18m`, `1h 12m`, `2h 05m`).
  - Synchronized via UTC timestamps to eliminate clock drift across clients.
  - Resets on seat change; stops on leave.
- **Seat Exclusivity**:
  - Students cannot occupy the exact same seat simultaneously.
  - Clear conflict resolution and courteous alerts.
- **Session Duration Counter**:
  - Displays total elapsed study time in the session.
- **Seated Bottom Dock**:
  - Shows current seat name, seat timer, session timer, study focus selector (*Deep Focus, Math & Physics, Writing Essay, Coding & Systems, Language Practice, Exam Prep*), and "Leave Seat" button.

---

## 🎨 Chibi Avatar System & Floating Study Timers

- **Classic Chibi Proportions**: Cute rounded features, oversized heads (~1:1 ratio), expressive eyes with dual sparkle highlights, and blushing cheeks.
- **Location-Appropriate Sitting Poses**:
  - **Desk Pose**: For Central Library and Lecture Hall Complex with study desks and props.
  - **Bench Pose**: For Sangam Gardens and Open Air Theatre with wooden slats and dangling legs.
  - **Café Table Pose**: For Campus Café with round bistro tabletops and coffee mugs.
  - **Tree Lawn Pose**: For Banyan Tree Grove and Gajendra Circle cross-legged on green grass.
- **Tiny Floating Study Timers**: Soft cream pills with dark typography and an emerald presence dot positioned immediately above character heads, updating continuously.

---

## ⏱️ Personal Focus & Pomodoro Productivity Timer

- **Presets**: 25m Pomodoro, 5m Short Break, 50m Deep Focus, 10m Long Break, and 1-120m Custom Slider.
- **Background-Drift Immune**: Uses absolute target timestamps (`endTimestamp`) stored in `localStorage` (`studyverse_focus_timer`) so timers never freeze or lose time during tab throttling.
- **Audio & Completion Prompts**: Plays a gentle 4-note peaceful crystal chime via Web Audio API and surfaces an in-app prompt to transition into a break or repeat session.
- **Independent from Session Tracking**: Runs as a private, client-side productivity tool without disrupting seat occupancy or the campus study duration tracker.

---

## 🌙 Do Not Disturb (DND) Quiet Mode

- **Quiet Focus Sanctuary**: Enjoy studying alongside others without interruptions or expectations to interact.
- **Muted Alerts & Subtle Moon Indicator**: Automatically mutes chat notifications and audio while displaying a subtle `🌙` indicator beside your chibi avatar on seats, floating timers, and the campus map.
- **Persistent Across Campus**: Preserved as you move between study destinations and explore the grounds.

---

## 🛠️ Technology Stack Architecture

The Studyverse tech stack is segregated into distinct, modular layers:

### 1. 🔷 Language & Type System (TypeScript)
* **TypeScript (`~7.0.2` / Modern `ES2023`)**:
  * Primary programming language throughout the entire application, enforcing strict end-to-end type safety from networking wire protocols to UI rendering.
* **Segregated Domain Type Definitions (`src/types/`)**:
  * [`src/types/studyverse.ts`](src/types/studyverse.ts): Core campus domain models (`StudentPresence`, `LocationId`, `AvatarConfig`, `ChatMessage`, `Seat`, `CampusSpot`).
  * [`src/types/statistics.ts`](src/types/statistics.ts): Independent study metrics, session tracking, distribution ratios, and timer records.
  * [`src/types/stopwatch.ts`](src/types/stopwatch.ts): Stopwatch state, lap accumulation, and interval timings.
* **Compiler Configuration (`tsconfig.app.json` & `tsconfig.json`)**:
  * Project references isolating app code from build configurations.
  * `bundler` module resolution with `verbatimModuleSyntax` and `erasableSyntaxOnly` for zero runtime overhead and clean type-stripping.
  * Strict linting rules: `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.

### 2. ⚛️ Core Frontend Framework
* **React 19 (`react` & `react-dom` `19.3.1`)**:
  * Functional component architecture with modern React hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`).
  * **Zero Component Library Dependency**: Pure custom React components built specifically for the interactive campus map, chibi avatars, floating docks, chat panel, stopwatch, and pomodoro timer.

### 3. 🎨 Styling & Design System
* **Tailwind CSS v4 (`4.3.5` via `@tailwindcss/vite`)**:
  * Next-generation CSS-first utility engine with instant build times.
  * **IIT Madras Campus Theme**: Calming organic palette featuring forest rain-tree green (`#2d5a43`), warm cream parchment (`#faf6f0`), and teak wood accents (`#ded2c1`).
* **Lucide React (`1.72.0`)**:
  * Consistent, lightweight SVG iconography across all campus navigation, timers, and chat panels.
* **Canvas Confetti (`1.9.4`)**:
  * Client-side particle animations celebrating focus milestone completions.

### 4. 🌐 Real-Time Multiplayer & Networking (4-Tier Hybrid Stack)
* **Tier 1 — Supabase Realtime (`@supabase/supabase-js` `2.119.0`)**:
  * Presence Channels (`studyverse_campus_presence`) for seat occupancy & presence sync.
  * Broadcast Channels (`studyverse_chat_{locationId}`) for location-isolated chat & audio notifications.
* **Tier 2 — Global WebRTC Cloud Mesh (`trystero` `0.27.0`)**:
  * Peer-to-peer data mesh over Port 443 WSS Nostr relays for zero-config global multiplayer.
* **Tier 3 — Cloud MQTT WebSocket Relay (`paho-mqtt` `1.1.0` & `@types/paho-mqtt`)**:
  * Public EMQX/HiveMQ WebSocket broker relay for reliable cross-network fallback.
* **Tier 4 — Local Multi-Tab Sync (`BroadcastChannel` & WebStorage)**:
  * Zero-configuration same-device synchronization across multiple tabs and windows.

### 5. 🔊 Procedural Audio Engine
* **Web Audio API (Browser Native Standards)**:
  * Pure procedural audio synthesis implemented in `src/services/soundService.ts` with **zero external audio file dependencies** (guaranteed offline reliability, 0 network requests, zero 404s).
  * Synthesizes ambient soundscapes (Central Library AC/rain hum, Banyan Tree rustling leaves & birdsong, Campus Café acoustic warmth).
  * Procedural dual-tone notification chime (D5 587.33Hz + A5 880Hz) with linear attack & smooth exponential decay.
  * Autonomous browser audio autoplay policy handling (`suspended` &rarr; `running`).

### 6. ⚡ Build, Tooling & Quality Assurance
* **Vite 8 (`8.3.6` with `@vitejs/plugin-react` `6.1.2`)**:
  * Ultra-fast ESM development server and Rollup/Rolldown production bundler.
* **Oxlint (`1.90.0`)**:
  * High-performance Rust-based JavaScript/TypeScript linter.
* **Puppeteer Core (`25.17.0`)**:
  * Multi-context browser automation test suites validating real-time multiplayer presence, dual-user chat chimes, and responsive layout containment.
* **OpenSpec (`@fission-ai/openspec`)**:
  * Spec-Driven Development (SDD) schema and requirement validation.

### 7. 🚀 Hosting & CI/CD
* **GitHub Pages**:
  * Static production deployment at [https://lucky-pluton.github.io/studyverse/](https://lucky-pluton.github.io/studyverse/).
* **GitHub Actions (`.github/workflows/deploy.yml`)**:
  * Automated type-checking (`tsc -b`), production bundling (`vite build`), and GitHub Pages deployment on push to `main`.

---

Studyverse integrates with [OpenSpec](https://openspec.dev/) by Fission-AI for spec-driven engineering and AI agent alignment:

```bash
# Validate all system specifications
npx @fission-ai/openspec@latest validate --specs

# List active capabilities and requirements
npx @fission-ai/openspec@latest list --specs
```

Active specifications are maintained under `openspec/specs/`:
- `openspec/specs/campus-map/spec.md`: Campus Map & Occupancy
- `openspec/specs/chibi-avatars/spec.md`: Chibi Avatar System & Sitting Poses
- `openspec/specs/floating-study-timers/spec.md`: Tiny Floating Study Timers
- `openspec/specs/focus-timer/spec.md`: Personal Focus & Pomodoro Timer
- `openspec/specs/multiplayer-presence/spec.md`: Real-time Multiplayer Presence & Seat Exclusivity

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build
npm run preview
```

---

## 🤝 Contributing

We welcome improvements from developers and students through our maintainer-controlled **Fork-and-Pull-Request** workflow.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for full instructions on:
- How to fork and set up the repository locally.
- Design principles and chibi illustration guidelines.
- How pull request reviews, automated CI builds, and maintainer approvals work.

---

*Disclaimer: This is an independent student-oriented virtual study experience inspired by the natural beauty and academic spirit of IIT Madras. It is not an official institutional application.*
