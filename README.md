# 🏛️ STUDYVERSE — IIT Madras Virtual Campus

> A tranquil, multiplayer virtual campus simulation inspired by the lush green grounds of **IIT Madras**, where online students study alongside other students in ambient, silent companionship.

Studyverse recreates the feeling of being on a serene university campus: sitting in the iconic Central Library, preparing lecture revisions in the Lecture Hall Complex (LHC), studying quietly beneath the ancient Banyan Tree, or spending a peaceful afternoon at the Open Air Theatre (OAT).

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

## 📋 OpenSpec Spec-Driven Development (SDD)

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

*Disclaimer: This is an independent student-oriented virtual study experience inspired by the natural beauty and academic spirit of IIT Madras. It is not an official institutional application.*
