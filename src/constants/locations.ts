import type { LocationDefinition } from '../types/studyverse';

export const LOCATIONS: Record<string, LocationDefinition> = {
  library: {
    id: 'library',
    name: 'Central Library',
    tagline: 'The Academic Beacon of IIT Madras',
    category: 'Academic',
    description: 'Multi-tiered reference stacks, expansive air-conditioned reading halls, polished wooden desks with emerald lamps, and high floor-to-ceiling windows overlooking lush campus greenery.',
    themeColor: '#2d5a43', // Deep IITM academic green
    badgeBg: '#e5eee8',
    icon: '🏛️',
    mapX: 48,
    mapY: 26,
    ambientTrack: 'library',
    musicNotes: ['Page turn rustle', 'Gentle AC hum', 'Quiet academic focus'],
    seats: [
      { id: 'lib-cubicle-01', name: 'Silent Study Desk 01 (Lamp)', type: 'desk', x: 18, y: 44, description: 'Single oak desk with personal reading lamp and power socket.' },
      { id: 'lib-cubicle-02', name: 'Silent Study Desk 02 (Lamp)', type: 'desk', x: 38, y: 44, description: 'Quiet individual study cubicle flanked by science journals.' },
      { id: 'lib-cubicle-03', name: 'Silent Study Desk 03 (Lamp)', type: 'desk', x: 62, y: 44, description: 'Desk near the computer science and mathematics stacks.' },
      { id: 'lib-cubicle-04', name: 'Silent Study Desk 04 (Lamp)', type: 'desk', x: 82, y: 44, description: 'Desk near the engineering reference section.' },

      { id: 'lib-window-01', name: 'Greenery Window Bay (North)', type: 'window', x: 12, y: 72, description: 'Sunlit desk overlooking the shady rain trees and deer trail.' },
      { id: 'lib-window-02', name: 'Greenery Window Bay (South)', type: 'window', x: 88, y: 72, description: 'Large corner desk framed by tall glass with botanical views.' },

      { id: 'lib-table-01', name: 'Central Research Table — Seat A', type: 'table', x: 34, y: 76, sharedGroupId: 'central-oak', description: 'Long teak study table for collaborative silent revision.' },
      { id: 'lib-table-02', name: 'Central Research Table — Seat B', type: 'table', x: 50, y: 76, sharedGroupId: 'central-oak', description: 'Long teak study table for collaborative silent revision.' },
      { id: 'lib-table-03', name: 'Central Research Table — Seat C', type: 'table', x: 66, y: 76, sharedGroupId: 'central-oak', description: 'Long teak study table for collaborative silent revision.' },

      { id: 'lib-armchair', name: 'Periodical Nook Armchair', type: 'chair', x: 50, y: 22, description: 'Plush reading armchair tucked between IEEE archives.' },
    ],
  },

  lhc: {
    id: 'lhc',
    name: 'Lecture Hall Complex (LHC)',
    tagline: 'Modern Lecture Theatres & Classrooms',
    category: 'Academic',
    description: 'Stepped amphitheatre classrooms, expansive chalkboards, tiered lecture rows, and quiet discussion rooms where students revise coursework and prepare for semester examinations.',
    themeColor: '#784824', // Warm terracotta / campus brick
    badgeBg: '#f7ede4',
    icon: '🎓',
    mapX: 25,
    mapY: 34,
    ambientTrack: 'lhc',
    musicNotes: ['Chalkboard echoes', 'Soft clock ticks', 'Pen strokes on paper'],
    seats: [
      { id: 'lhc-hall1-01', name: 'Lecture Hall 1 — Front Row A', type: 'desk', x: 26, y: 46, description: 'Front row tiered desk with direct view of the blackboard.' },
      { id: 'lhc-hall1-02', name: 'Lecture Hall 1 — Front Row B', type: 'desk', x: 44, y: 46, description: 'Front row tiered desk with direct view of the blackboard.' },
      { id: 'lhc-hall1-03', name: 'Lecture Hall 1 — Front Row C', type: 'desk', x: 62, y: 46, description: 'Front row tiered desk with direct view of the blackboard.' },
      
      { id: 'lhc-hall1-04', name: 'Lecture Hall 1 — Mid Tier Left', type: 'tier', x: 20, y: 72, description: 'Elevated tiered lecture bench with wide notebook space.' },
      { id: 'lhc-hall1-05', name: 'Lecture Hall 1 — Mid Tier Center', type: 'tier', x: 44, y: 72, description: 'Elevated tiered lecture bench in the quiet center zone.' },
      { id: 'lhc-hall1-06', name: 'Lecture Hall 1 — Mid Tier Right', type: 'tier', x: 68, y: 72, description: 'Elevated tiered lecture bench near the side aisle.' },

      { id: 'lhc-crc-01', name: 'Classroom CRC-101 — Corner Desk', type: 'desk', x: 84, y: 38, description: 'Secluded corner desk in the adjacent classroom wing.' },
      { id: 'lhc-crc-02', name: 'Classroom CRC-101 — Window Desk', type: 'window', x: 86, y: 68, description: 'Classroom desk bathed in soft daylight filtering through trees.' },

      { id: 'lhc-podium', name: 'Teaching Assistant Desk', type: 'desk', x: 12, y: 26, description: 'Organized study desk beside the projector and reference texts.' },
      { id: 'lhc-balcony', name: 'Mezzanine Overlook Bench', type: 'bench', x: 78, y: 20, description: 'Quiet wooden bench along the breezy LHC first-floor corridor.' },
    ],
  },

  banyan: {
    id: 'banyan',
    name: 'Banyan Tree Study Grove',
    tagline: 'Under the Ancient Shady Canopy',
    category: 'Outdoor',
    description: 'A legendary majestic banyan tree with cascading aerial roots, stone plinths, and wooden study benches nestled in dappled sunshine with songbirds singing in the leaves.',
    themeColor: '#365338', // Verdant banyan foliage
    badgeBg: '#e6ede6',
    icon: '🌳',
    mapX: 42,
    mapY: 62,
    ambientTrack: 'banyan',
    musicNotes: ['Rustling banyan leaves', 'Sweet cuckoo calls', 'Gentle campus breeze'],
    seats: [
      { id: 'banyan-stone-01', name: 'Sacred Root Circular Bench (East)', type: 'bench', x: 30, y: 52, sharedGroupId: 'banyan-plinth', description: 'Curved stone bench built around the ancient central trunk.' },
      { id: 'banyan-stone-02', name: 'Sacred Root Circular Bench (West)', type: 'bench', x: 68, y: 52, sharedGroupId: 'banyan-plinth', description: 'Curved stone bench sheltered beneath thick leafy boughs.' },

      { id: 'banyan-picnic-01', name: 'Garden Timber Table — Seat A', type: 'table', x: 18, y: 76, sharedGroupId: 'banyan-timber', description: 'Rustic wooden outdoor table under deep shade.' },
      { id: 'banyan-picnic-02', name: 'Garden Timber Table — Seat B', type: 'table', x: 34, y: 76, sharedGroupId: 'banyan-timber', description: 'Rustic wooden outdoor table under deep shade.' },

      { id: 'banyan-lawn-01', name: 'Shady Lawn Bench 01', type: 'bench', x: 74, y: 74, description: 'Cast-iron garden bench surrounded by fallen leaves and ferns.' },
      { id: 'banyan-lawn-02', name: 'Shady Lawn Bench 02', type: 'bench', x: 88, y: 74, description: 'Quiet bench on the edge of the grassy glade.' },

      { id: 'banyan-canopy-01', name: 'Aerial Root Reading Spot', type: 'chair', x: 50, y: 78, description: 'Wooden Adirondack chair nestled between natural root curtains.' },
      { id: 'banyan-quiet', name: 'Quiet Pathway Bench', type: 'bench', x: 14, y: 38, description: 'Bench beside the gravel path where spotted deer often stroll.' },

      { id: 'banyan-sunbeam', name: 'Dappled Sunlight Bench', type: 'bench', x: 82, y: 34, description: 'Bench catching warm gentle golden hour sunbeams through leaves.' },
      { id: 'banyan-hammock', name: 'Canopy Rocking Seat', type: 'chair', x: 50, y: 24, description: 'Suspended wooden swing bench swaying softly in the breeze.' },
    ],
  },

  oat: {
    id: 'oat',
    name: 'Open Air Theatre (OAT)',
    tagline: 'Iconic Open-Sky Amphitheatre',
    category: 'Iconic Landmark',
    description: 'The world-famous IIT Madras OAT. Stepped semicircular stone terraces under the open Chennai sky, sheltered by tall rain trees, offering a tranquil, airy space for deep focus.',
    themeColor: '#475569', // Granite stone slate
    badgeBg: '#f1f5f9',
    icon: '🎭',
    mapX: 74,
    mapY: 36,
    ambientTrack: 'oat',
    musicNotes: ['Open-air acoustics', 'Distant tree whispers', 'Evening breeze'],
    seats: [
      { id: 'oat-tier-lower-01', name: 'Amphitheatre Lower Tier — A', type: 'tier', x: 32, y: 64, sharedGroupId: 'oat-low', description: 'Smooth granite terrace step close to the green apron.' },
      { id: 'oat-tier-lower-02', name: 'Amphitheatre Lower Tier — B', type: 'tier', x: 50, y: 68, sharedGroupId: 'oat-low', description: 'Center stage terrace step with open panoramic sky.' },
      { id: 'oat-tier-lower-03', name: 'Amphitheatre Lower Tier — C', type: 'tier', x: 68, y: 64, sharedGroupId: 'oat-low', description: 'Smooth granite terrace step close to the east trees.' },

      { id: 'oat-tier-mid-01', name: 'Amphitheatre Mid Tier — Seat 1', type: 'tier', x: 22, y: 46, description: 'Wide stone tier halfway up the bowl under tree branches.' },
      { id: 'oat-tier-mid-02', name: 'Amphitheatre Mid Tier — Center', type: 'tier', x: 50, y: 48, description: 'Center terrace with great sightlines and natural airflow.' },
      { id: 'oat-tier-mid-03', name: 'Amphitheatre Mid Tier — Seat 3', type: 'tier', x: 78, y: 46, description: 'Wide stone tier on the gentle hillside.' },

      { id: 'oat-tier-top-01', name: 'Upper Crest Terrace — West', type: 'tier', x: 18, y: 26, description: 'Top row bench with sweeping views over the whole arena.' },
      { id: 'oat-tier-top-02', name: 'Upper Crest Terrace — East', type: 'tier', x: 82, y: 26, description: 'Top row bench surrounded by fragrant flowering bushes.' },

      { id: 'oat-stage-01', name: 'Stage Edge Wooden Bench 01', type: 'bench', x: 36, y: 84, description: 'Timber bench on the wooden apron platform.' },
      { id: 'oat-stage-02', name: 'Stage Edge Wooden Bench 02', type: 'bench', x: 64, y: 84, description: 'Timber bench on the wooden apron platform.' },
    ],
  },

  cafe: {
    id: 'cafe',
    name: 'Campus Café (Himalaya)',
    tagline: 'Fresh Filter Coffee & Discussions',
    category: 'Cafeteria',
    description: 'The cozy heart of student refreshment. Steaming Chennai filter coffee, warm outdoor wooden tables under striped awnings, indoor booths, and potted areca palms.',
    themeColor: '#845328', // Rich coffee mocha
    badgeBg: '#faede4',
    icon: '☕',
    mapX: 28,
    mapY: 75,
    ambientTrack: 'cafe',
    musicNotes: ['Filter coffee steam', 'Warm acoustic strums', 'Gentle collegiate murmurs'],
    seats: [
      { id: 'cafe-patio-01', name: 'Outdoor Shaded Table 01', type: 'table', x: 16, y: 48, description: 'Outdoor round marble table beneath the striped canopy.' },
      { id: 'cafe-patio-02', name: 'Outdoor Shaded Table 02', type: 'table', x: 30, y: 48, description: 'Patio seat next to flowering red hibiscus planters.' },

      { id: 'cafe-booth-01', name: 'Cozy Terracotta Booth — A', type: 'booth', x: 16, y: 78, sharedGroupId: 'himalaya-booth', description: 'Plush corner booth with wooden table and power socket.' },
      { id: 'cafe-booth-02', name: 'Cozy Terracotta Booth — B', type: 'booth', x: 32, y: 78, sharedGroupId: 'himalaya-booth', description: 'Plush corner booth with wooden table and power socket.' },

      { id: 'cafe-bistro-01', name: 'Central Discussion Table', type: 'table', x: 52, y: 64, description: 'High-top polished timber table with fresh eucalyptus.' },
      { id: 'cafe-counter-01', name: 'Espresso Bar High Stool', type: 'desk', x: 72, y: 46, description: 'Wooden stool overlooking the barista and daily specials board.' },

      { id: 'cafe-veranda-01', name: 'Veranda Breeze Table 01', type: 'table', x: 86, y: 72, description: 'Open veranda table bathed in gentle cross breezes.' },
      { id: 'cafe-veranda-02', name: 'Veranda Breeze Table 02', type: 'table', x: 72, y: 82, description: 'Veranda table overlooking the central campus lawn.' },

      { id: 'cafe-armchair', name: 'Fireside Wicker Lounge Chair', type: 'chair', x: 50, y: 26, description: 'Plush cane wicker armchair surrounded by indoor monstera.' },
      { id: 'cafe-nook', name: 'Corner Book Nook Table', type: 'desk', x: 86, y: 28, description: 'Quiet corner table beside the community book exchange shelf.' },
    ],
  },

  park: {
    id: 'park',
    name: 'Sangam Gardens & Deer Trail',
    tagline: 'Lush Botanical Sanctuary',
    category: 'Outdoor',
    description: 'Serene botanical pathways, lotus ponds, bougainvillea trellises, and open lawns where campus chital deer and blackbucks graze calmly in the peaceful shade.',
    themeColor: '#2f6044', // Botanical emerald
    badgeBg: '#e7f2ec',
    icon: '🦌',
    mapX: 72,
    mapY: 72,
    ambientTrack: 'park',
    musicNotes: ['Lotus pond ripples', 'Chital deer gentle steps', 'Gentle bird songs'],
    seats: [
      { id: 'park-fountain-01', name: 'Lotus Fountain Bench (North)', type: 'bench', x: 40, y: 56, sharedGroupId: 'park-fountain', description: 'Curved stone bench within earshot of the bubbling lotus pond.' },
      { id: 'park-fountain-02', name: 'Lotus Fountain Bench (South)', type: 'bench', x: 60, y: 56, sharedGroupId: 'park-fountain', description: 'Stone bench warmed by afternoon sunlight opposite the fountain.' },

      { id: 'park-gulmohar', name: 'Gulmohar Blossom Wooden Bench', type: 'bench', x: 20, y: 42, description: 'Resting beneath a flame-of-the-forest gulmohar with scarlet petals.' },
      { id: 'park-rain-tree', name: 'Rain Tree Lawn Bench', type: 'bench', x: 80, y: 40, description: 'Secluded shade beneath a majestic spreading rain tree.' },

      { id: 'park-picnic-01', name: 'Meadow Study Table — Seat A', type: 'table', x: 26, y: 78, sharedGroupId: 'meadow-picnic', description: 'Rustic wooden picnic table surrounded by wild jasmine and ferns.' },
      { id: 'park-picnic-02', name: 'Meadow Study Table — Seat B', type: 'table', x: 42, y: 78, sharedGroupId: 'meadow-picnic', description: 'Rustic wooden picnic table surrounded by wild jasmine and ferns.' },

      { id: 'park-path-01', name: 'Deer Meadow Bench 01', type: 'bench', x: 72, y: 76, description: 'Classic iron park bench beside the spotted deer meadow.' },
      { id: 'park-path-02', name: 'Deer Meadow Bench 02', type: 'bench', x: 86, y: 76, description: 'Quiet bench along the floral gravel promenade.' },

      { id: 'park-trellis', name: 'Bougainvillea Pergola Swing', type: 'chair', x: 50, y: 24, description: 'Gently swaying wooden swing bench sheltered by vibrant magenta blooms.' },
      { id: 'park-pondside', name: 'Lily Pond Granite Seat', type: 'bench', x: 12, y: 64, description: 'Smooth granite boulder seat overlooking floating water lilies.' },
    ],
  },

  gc: {
    id: 'gc',
    name: 'Gajendra Circle (GC) Pavilion',
    tagline: 'The Legendary Heart of Campus',
    category: 'Iconic Landmark',
    description: 'The world-renowned roundabout and landmark of IIT Madras. Shaded ring of ancient trees, heritage stone benches, landscaped floral islands, and tranquil outdoor study nooks.',
    themeColor: '#1e40af', // Heritage naval blue
    badgeBg: '#eff6ff',
    icon: '🐘',
    mapX: 50,
    mapY: 48,
    ambientTrack: 'park',
    musicNotes: ['Roundabout gentle breeze', 'Distant bicycle chimes', 'Morning bird songs'],
    seats: [
      { id: 'gc-fountain-01', name: 'GC Ring Bench (North Gazebo)', type: 'bench', x: 32, y: 44, sharedGroupId: 'gc-circle', description: 'Classic stone bench along the green inner circle of GC.' },
      { id: 'gc-fountain-02', name: 'GC Ring Bench (South Gazebo)', type: 'bench', x: 68, y: 44, sharedGroupId: 'gc-circle', description: 'Shaded stone bench facing the iconic roundabout garden.' },

      { id: 'gc-tree-01', name: 'Heritage Neem Tree Bench', type: 'bench', x: 22, y: 72, description: 'Cool wooden bench shaded by dense fragrant neem branches.' },
      { id: 'gc-tree-02', name: 'Avenue Rain Tree Bench', type: 'bench', x: 78, y: 72, description: 'Bench under a spreading rain tree at the head of Delhi Avenue.' },

      { id: 'gc-pergola-01', name: 'Floral Gazebo Table — Seat 1', type: 'table', x: 42, y: 76, sharedGroupId: 'gc-gazebo', description: 'Stone circular table under the iron trellis.' },
      { id: 'gc-pergola-02', name: 'Floral Gazebo Table — Seat 2', type: 'table', x: 58, y: 76, sharedGroupId: 'gc-gazebo', description: 'Stone circular table under the iron trellis.' },

      { id: 'gc-alumni', name: 'Alumni Avenue Corner Seat', type: 'chair', x: 14, y: 30, description: 'Quiet garden chair by the historic campus entrance path.' },
      { id: 'gc-bonn', name: 'Bonn Avenue Shaded Nook', type: 'chair', x: 86, y: 30, description: 'Private reading seat along the canopy-lined avenue.' },
    ],
  },
};

export const VERIFIED_IITM_UPCOMING_DESTINATIONS = [
  {
    id: 'chemplast',
    name: 'Chemplast Cricket Ground Pavilion',
    tagline: 'Lush Turf & Pavilion Benches',
    description: 'Breezy grandstand seats overlooking the emerald green outfield, surrounded by ancient forest cover and quiet morning air.',
    badge: 'Under Green Care',
    icon: 'Trophy',
    category: 'Sports & Open Grounds',
    previewColor: '#15803d',
  },
  {
    id: 'sac',
    name: 'Students Activity Centre (SAC)',
    tagline: 'Creative Commons & Project Halls',
    description: 'Spacious high-ceiling creative lounge for group hackathons, project discussions, robotics reviews, and evening study sessions.',
    badge: 'Opening Next Semester',
    icon: 'Cpu',
    category: 'Student Hub',
    previewColor: '#4f46e5',
  },
  {
    id: 'aerospace',
    name: 'Department of Aerospace Engineering',
    tagline: 'Wind Tunnel Quad & Aircraft Courtyard',
    description: 'Historic aeronautics quad featuring outdoor study alcoves beside vintage supersonic test models and shaded palm courtyards.',
    badge: 'Under Setup',
    icon: 'Plane',
    category: 'Academic Core',
    previewColor: '#0284c7',
  },
  {
    id: 'mandakini',
    name: 'Mandakini & Krishna Hostel Common Lounges',
    tagline: 'Night Owl Quads & Late Revision Hubs',
    description: 'Quiet residential quad study tables with night lamps, warm breezes, and fellow hostel mates burning the midnight oil.',
    badge: 'Refurbishing',
    icon: 'Home',
    category: 'Residential Nooks',
    previewColor: '#b45309',
  },
];

export const COMING_SOON_DESTINATIONS = VERIFIED_IITM_UPCOMING_DESTINATIONS;

