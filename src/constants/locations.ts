import type { LocationDefinition, LocationId } from '../types/studyverse';

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
      { id: 'lib-cubicle-01', name: 'Front Oak Desk — Left Blue Chair', type: 'chair', x: 14.5, y: 82.5, size: 'md', scale: 1.0, description: 'Polished teak study desk with emerald lamp.' },
      { id: 'lib-cubicle-02', name: 'Front Oak Desk — Right Blue Chair', type: 'chair', x: 28.5, y: 82.5, size: 'md', scale: 1.0, description: 'Polished teak study desk with emerald lamp.' },
      { id: 'lib-cubicle-03', name: 'Front Oak Desk East — Left Blue Chair', type: 'chair', x: 75.5, y: 82.5, size: 'md', scale: 1.0, description: 'Spacious desk by the reference stacks.' },
      { id: 'lib-cubicle-04', name: 'Front Oak Desk East — Right Blue Chair', type: 'chair', x: 89.0, y: 82.5, size: 'md', scale: 1.0, description: 'Spacious desk by the reference stacks.' },
      { id: 'lib-table-01', name: 'Oak Desk West — Rear Chair A', type: 'chair', x: 28.5, y: 73.0, size: 'md', scale: 0.88, description: 'Comfortable blue chair facing the study desk.' },
      { id: 'lib-table-02', name: 'Oak Desk West — Rear Chair B', type: 'chair', x: 39.0, y: 73.0, size: 'md', scale: 0.88, description: 'Comfortable blue chair facing the study desk.' },
      { id: 'lib-table-03', name: 'Oak Desk East — Rear Chair A', type: 'chair', x: 65.0, y: 73.0, size: 'md', scale: 0.88, description: 'Quiet research desk chair.' },
      { id: 'lib-armchair', name: 'Oak Desk East — Rear Chair B', type: 'chair', x: 75.0, y: 73.0, size: 'md', scale: 0.88, description: 'Quiet research desk chair.' },
      { id: 'lib-window-01', name: 'Mid Reading Desk — West Chair', type: 'chair', x: 36.5, y: 67.5, size: 'sm', scale: 0.8, description: 'Sunlit desk with garden window view.' },
      { id: 'lib-window-02', name: 'Mid Reading Desk — East Chair', type: 'chair', x: 68.5, y: 67.5, size: 'sm', scale: 0.8, description: 'Sunlit desk with garden window view.' },
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
      { id: 'lhc-hall1-05', name: 'Front Tier Desk — West A', type: 'chair', x: 6.5, y: 83.5, size: 'md', scale: 1.0, description: 'Prime front row lecture hall seat.' },
      { id: 'lhc-hall1-06', name: 'Front Tier Desk — West B', type: 'chair', x: 20.0, y: 83.5, size: 'md', scale: 1.0, description: 'Prime front row lecture hall seat.' },
      { id: 'lhc-crc-01', name: 'Front Tier Desk — East A', type: 'chair', x: 80.0, y: 83.5, size: 'md', scale: 1.0, description: 'Front row tiered desk with clear board view.' },
      { id: 'lhc-crc-02', name: 'Front Tier Desk — East B', type: 'chair', x: 93.5, y: 83.5, size: 'md', scale: 1.0, description: 'Front row tiered desk with clear board view.' },
      { id: 'lhc-hall1-01', name: 'Tier 2 Desk — West Wing', type: 'chair', x: 13.5, y: 73.5, size: 'md', scale: 0.9, description: 'Second tier wooden desk with upholstered chair.' },
      { id: 'lhc-hall1-02', name: 'Tier 2 Desk — West Center', type: 'chair', x: 26.5, y: 73.5, size: 'md', scale: 0.9, description: 'Second tier wooden desk with upholstered chair.' },
      { id: 'lhc-hall1-03', name: 'Tier 2 Desk — East Center', type: 'chair', x: 73.5, y: 73.5, size: 'md', scale: 0.9, description: 'Second tier wooden desk with upholstered chair.' },
      { id: 'lhc-hall1-04', name: 'Tier 2 Desk — East Wing', type: 'chair', x: 86.5, y: 73.5, size: 'md', scale: 0.9, description: 'Second tier wooden desk with upholstered chair.' },
      { id: 'lhc-balcony', name: 'Tier 3 Desk — West Overlook', type: 'chair', x: 18.5, y: 63.5, size: 'sm', scale: 0.78, description: 'Upper tier study desk with expansive theatre perspective.' },
      { id: 'lhc-podium', name: 'Tier 3 Desk — East Overlook', type: 'chair', x: 81.5, y: 63.5, size: 'sm', scale: 0.78, description: 'Upper tier study desk with expansive theatre perspective.' },
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
      { id: 'banyan-lawn-01', name: 'Front Pergola Table — West Blue Chair', type: 'chair', x: 6.5, y: 83.5, size: 'md', scale: 1.0, description: 'Comfortable blue chair under the wooden pergola roof.' },
      { id: 'banyan-lawn-02', name: 'Front Pergola Table — West Stool', type: 'chair', x: 29.5, y: 81.0, size: 'md', scale: 0.95, description: 'Round timber stool at the front study table.' },
      { id: 'banyan-picnic-01', name: 'Front Pergola Table — East Stool', type: 'chair', x: 70.0, y: 81.0, size: 'md', scale: 0.95, description: 'Round timber stool at the front study table.' },
      { id: 'banyan-picnic-02', name: 'Front Pergola Table — East Blue Chair', type: 'chair', x: 92.5, y: 83.5, size: 'md', scale: 1.0, description: 'Comfortable blue chair under the wooden pergola roof.' },
      { id: 'banyan-stone-01', name: 'Mid Pergola Table — West Stool A', type: 'chair', x: 21.5, y: 69.5, size: 'md', scale: 0.88, description: 'Mid-patio timber stool nestled in cool canopy shade.' },
      { id: 'banyan-stone-02', name: 'Mid Pergola Table — West Stool B', type: 'chair', x: 40.5, y: 69.5, size: 'md', scale: 0.88, description: 'Mid-patio timber stool nestled in cool canopy shade.' },
      { id: 'banyan-quiet', name: 'Mid Pergola Table — East Stool A', type: 'chair', x: 59.5, y: 69.5, size: 'md', scale: 0.88, description: 'Shaded timber stool overlooking the banyan roots.' },
      { id: 'banyan-sunbeam', name: 'Mid Pergola Table — East Stool B', type: 'chair', x: 78.5, y: 69.5, size: 'md', scale: 0.88, description: 'Shaded timber stool overlooking the banyan roots.' },
      { id: 'banyan-canopy-01', name: 'Ancient Banyan Trunk Plinth — Left', type: 'bench', x: 45.0, y: 59.5, size: 'sm', scale: 0.8, description: 'Wooden park bench nestled directly in front of the ancient banyan tree.' },
      { id: 'banyan-hammock', name: 'Ancient Banyan Trunk Plinth — Right', type: 'bench', x: 55.0, y: 59.5, size: 'sm', scale: 0.8, description: 'Wooden park bench nestled directly in front of the ancient banyan tree.' },
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
      { id: 'oat-tier-lower-01', name: 'Stone Terrace Tier 1 — West Wing', type: 'tier', x: 23.0, y: 65.0, size: 'md', scale: 0.95, description: 'Curved granite terrace step in the lower amphitheatre arc.' },
      { id: 'oat-tier-lower-02', name: 'Stone Terrace Tier 1 — Center-West', type: 'tier', x: 37.0, y: 61.5, size: 'md', scale: 0.92, description: 'Smooth granite seating terrace step.' },
      { id: 'oat-tier-lower-03', name: 'Stone Terrace Tier 1 — Center', type: 'tier', x: 50.0, y: 60.5, size: 'md', scale: 0.92, description: 'Center terrace step with panoramic amphitheatre view.' },
      { id: 'oat-stage-01', name: 'Stone Terrace Tier 1 — Center-East', type: 'tier', x: 63.0, y: 61.5, size: 'md', scale: 0.92, description: 'Smooth granite seating terrace step.' },
      { id: 'oat-stage-02', name: 'Stone Terrace Tier 1 — East Wing', type: 'tier', x: 77.0, y: 65.0, size: 'md', scale: 0.95, description: 'Curved granite terrace step in the lower amphitheatre arc.' },
      { id: 'oat-tier-mid-01', name: 'Stone Terrace Tier 2 — West Arc', type: 'tier', x: 17.0, y: 60.5, size: 'md', scale: 0.88, description: 'Mid-elevation stone terrace step surrounded by gentle shade.' },
      { id: 'oat-tier-mid-02', name: 'Stone Terrace Tier 2 — Center-West', type: 'tier', x: 33.0, y: 56.5, size: 'md', scale: 0.88, description: 'Mid-elevation stone terrace step.' },
      { id: 'oat-tier-mid-03', name: 'Stone Terrace Tier 2 — Center-East', type: 'tier', x: 67.0, y: 56.5, size: 'md', scale: 0.88, description: 'Mid-elevation stone terrace step.' },
      { id: 'oat-tier-top-01', name: 'Stone Terrace Tier 2 — East Arc', type: 'tier', x: 83.0, y: 60.5, size: 'md', scale: 0.88, description: 'Mid-elevation stone terrace step surrounded by gentle shade.' },
      { id: 'oat-tier-top-02', name: 'Upper Crest Terrace — West Overlook', type: 'tier', x: 13.0, y: 53.5, size: 'sm', scale: 0.78, description: 'Top crest tier step under the tall rain trees.' },
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
      { id: 'cafe-patio-01', name: 'Front Table 01 — Left Blue Chair', type: 'chair', x: 9.5, y: 73.5, size: 'md', scale: 1.0, description: 'Round wooden cafe table with blue upholstered chair.' },
      { id: 'cafe-patio-02', name: 'Front Table 01 — Right Blue Chair', type: 'chair', x: 26.5, y: 73.5, size: 'md', scale: 1.0, description: 'Round wooden cafe table with blue upholstered chair.' },
      { id: 'cafe-booth-01', name: 'Front Table 02 — Left Blue Chair', type: 'chair', x: 68.5, y: 73.5, size: 'md', scale: 1.0, description: 'Round wooden cafe table with blue upholstered chair.' },
      { id: 'cafe-booth-02', name: 'Front Table 02 — Right Blue Chair', type: 'chair', x: 86.5, y: 73.5, size: 'md', scale: 1.0, description: 'Round wooden cafe table with blue upholstered chair.' },
      { id: 'cafe-bistro-01', name: 'Mid Table 01 — Left Blue Chair', type: 'chair', x: 15.5, y: 64.0, size: 'md', scale: 0.88, description: 'Sunny indoor cafe table chair with green lamp.' },
      { id: 'cafe-counter-01', name: 'Mid Table 01 — Right Blue Chair', type: 'chair', x: 32.5, y: 64.5, size: 'md', scale: 0.88, description: 'Sunny indoor cafe table chair with green lamp.' },
      { id: 'cafe-veranda-01', name: 'Mid Table 02 — Left Blue Chair', type: 'chair', x: 62.0, y: 64.0, size: 'md', scale: 0.88, description: 'Sunny indoor cafe table chair with green lamp.' },
      { id: 'cafe-veranda-02', name: 'Mid Table 02 — Right Blue Chair', type: 'chair', x: 81.5, y: 64.0, size: 'md', scale: 0.88, description: 'Sunny indoor cafe table chair with green lamp.' },
      { id: 'cafe-armchair', name: 'Sunlit Window Bench — West', type: 'bench', x: 5.5, y: 59.0, size: 'sm', scale: 0.82, description: 'Wooden bench by the large glass window overlooking the trees.' },
      { id: 'cafe-nook', name: 'Garden Window Bench — East', type: 'bench', x: 92.5, y: 59.0, size: 'sm', scale: 0.82, description: 'Wooden bench by the large glass window overlooking the trees.' },
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
      { id: 'park-path-01', name: 'West Garden Bench — Lawn', type: 'bench', x: 15.0, y: 62.5, size: 'md', scale: 0.9, description: 'Garden bench shaded by ornamental rain trees.' },
      { id: 'park-fountain-02', name: 'Gazebo Front Bench — West', type: 'bench', x: 29.0, y: 63.5, size: 'md', scale: 0.9, description: 'Blue bench facing the Sangam gazebo pavilion.' },
      { id: 'park-trellis', name: 'Gazebo Inner Bench — West', type: 'bench', x: 32.0, y: 59.5, size: 'sm', scale: 0.82, description: 'Sheltered bench inside the octagonal gazebo.' },
      { id: 'park-fountain-01', name: 'Gazebo Center Bench — Left', type: 'bench', x: 47.0, y: 57.5, size: 'sm', scale: 0.82, description: 'Rear wooden bench inside the Sangam gazebo.' },
      { id: 'park-gulmohar', name: 'Gazebo Center Bench — Right', type: 'bench', x: 53.0, y: 57.5, size: 'sm', scale: 0.82, description: 'Rear wooden bench inside the Sangam gazebo.' },
      { id: 'park-pondside', name: 'Gazebo Inner Bench — East', type: 'bench', x: 71.0, y: 59.5, size: 'sm', scale: 0.82, description: 'Sheltered bench inside the octagonal gazebo.' },
      { id: 'park-picnic-01', name: 'Gazebo Front Bench — East', type: 'bench', x: 74.0, y: 63.5, size: 'md', scale: 0.9, description: 'Wooden bench facing the Sangam gazebo pavilion.' },
      { id: 'park-rain-tree', name: 'East Garden Bench — Lawn', type: 'bench', x: 87.0, y: 62.5, size: 'md', scale: 0.9, description: 'Garden bench shaded by ornamental rain trees.' },
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
      { id: 'gc-fountain-01', name: 'Promenade Curved Bench — West', type: 'bench', x: 16.5, y: 73.0, size: 'md', scale: 1.0, description: 'Foreground curved wooden bench along the circular promenade.' },
      { id: 'gc-fountain-02', name: 'Promenade Curved Bench — East', type: 'bench', x: 92.5, y: 74.0, size: 'md', scale: 1.0, description: 'Foreground curved wooden bench along the circular promenade.' },
      { id: 'gc-pergola-01', name: 'West Lawn Bench — Outer Ring', type: 'bench', x: 9.5, y: 60.5, size: 'md', scale: 0.88, description: 'Wooden park bench on the perimeter lawn facing Gajendra Circle.' },
      { id: 'gc-pergola-02', name: 'West Lawn Bench — Mid Ring', type: 'bench', x: 26.5, y: 57.0, size: 'sm', scale: 0.82, description: 'Wooden park bench nestled under campus shade trees.' },
      { id: 'gc-tree-01', name: 'East Lawn Bench — Mid Ring', type: 'bench', x: 83.0, y: 57.0, size: 'sm', scale: 0.82, description: 'Wooden park bench nestled under campus shade trees.' },
      { id: 'gc-tree-02', name: 'East Lawn Bench — Outer Ring', type: 'bench', x: 97.5, y: 60.5, size: 'md', scale: 0.88, description: 'Wooden park bench on the perimeter lawn facing Gajendra Circle.' },
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

export interface CampusNavigationItem {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  category: string;
  themeColor: string;
  badgeBg: string;
  isAvailable: boolean;
  statusBadge?: string;
  statusDetail?: string;
  locationId?: LocationId;
  statKey?: 'libraryCount' | 'lhcCount' | 'banyanCount' | 'oatCount' | 'cafeCount' | 'parkCount' | 'gcCount';
}

/**
 * All 11 Campus Locations in Navigation:
 * - 7 Active study & gathering spaces with live occupancy
 * - 4 Additional campus locations with real statuses
 */
export const ALL_CAMPUS_NAV_ITEMS: CampusNavigationItem[] = [
  // 1. Central Library
  {
    id: 'library',
    name: 'Central Library',
    shortName: 'Library',
    icon: '🏛️',
    category: 'Academic',
    themeColor: '#2d5a43',
    badgeBg: '#e5eee8',
    isAvailable: true,
    locationId: 'library',
    statKey: 'libraryCount',
  },
  // 2. Lecture Hall Complex (LHC)
  {
    id: 'lhc',
    name: 'Lecture Hall Complex',
    shortName: 'LHC',
    icon: '🎓',
    category: 'Academic',
    themeColor: '#784824',
    badgeBg: '#f7ede4',
    isAvailable: true,
    locationId: 'lhc',
    statKey: 'lhcCount',
  },
  // 3. Banyan Tree
  {
    id: 'banyan',
    name: 'Banyan Tree Study Grove',
    shortName: 'Banyan',
    icon: '🌳',
    category: 'Outdoor',
    themeColor: '#365338',
    badgeBg: '#e6ede6',
    isAvailable: true,
    locationId: 'banyan',
    statKey: 'banyanCount',
  },
  // 4. Open Air Theatre (OAT)
  {
    id: 'oat',
    name: 'Open Air Theatre',
    shortName: 'OAT',
    icon: '🎭',
    category: 'Iconic Landmark',
    themeColor: '#475569',
    badgeBg: '#f1f5f9',
    isAvailable: true,
    locationId: 'oat',
    statKey: 'oatCount',
  },
  // 5. Campus Café
  {
    id: 'cafe',
    name: 'Campus Café',
    shortName: 'Café',
    icon: '☕',
    category: 'Cafeteria',
    themeColor: '#845328',
    badgeBg: '#faede4',
    isAvailable: true,
    locationId: 'cafe',
    statKey: 'cafeCount',
  },
  // 6. Sangam Gardens
  {
    id: 'park',
    name: 'Sangam Gardens',
    shortName: 'Sangam',
    icon: '🌿',
    category: 'Outdoor',
    themeColor: '#2f6044',
    badgeBg: '#e7f2ec',
    isAvailable: true,
    locationId: 'park',
    statKey: 'parkCount',
  },
  // 7. Gajendra Circle
  {
    id: 'gc',
    name: 'Gajendra Circle',
    shortName: 'GC',
    icon: '🐘',
    category: 'Iconic Landmark',
    themeColor: '#1e40af',
    badgeBg: '#eff6ff',
    isAvailable: true,
    locationId: 'gc',
    statKey: 'gcCount',
  },
  // 8. Students' Activity Centre (SAC)
  {
    id: 'sac',
    name: "Students' Activity Centre (SAC)",
    shortName: 'SAC',
    icon: '🎪',
    category: 'Student Hub',
    themeColor: '#4f46e5',
    badgeBg: '#eef2ff',
    isAvailable: false,
    statusBadge: 'Coming soon',
    statusDetail: 'Opening next semester for creative societies, project rooms, and club activities.',
  },
  // 9. Chemplast Cricket Ground Pavilion
  {
    id: 'chemplast',
    name: 'Chemplast Cricket Pavilion',
    shortName: 'Chemplast',
    icon: '🏏',
    category: 'Sports & Grounds',
    themeColor: '#15803d',
    badgeBg: '#f0fdf4',
    isAvailable: false,
    statusBadge: 'Under green care',
    statusDetail: 'Outfield maintenance and grandstand pavilion upgrades in progress.',
  },
  // 10. Department of Aerospace Engineering
  {
    id: 'aerospace',
    name: 'Department of Aerospace Engineering',
    shortName: 'Aerospace',
    icon: '✈️',
    category: 'Academic Core',
    themeColor: '#0284c7',
    badgeBg: '#f0f9ff',
    isAvailable: false,
    statusBadge: 'Under setup',
    statusDetail: 'Wind tunnel courtyard and propulsion laboratory workspaces preparing for term.',
  },
  // 11. Mandakini & Krishna Hostel Common Lounges
  {
    id: 'mandakini',
    name: 'Hostel Common Lounges',
    shortName: 'Hostels',
    icon: '🏠',
    category: 'Residential',
    themeColor: '#b45309',
    badgeBg: '#fef3c7',
    isAvailable: false,
    statusBadge: 'Refurbishing',
    statusDetail: 'Mandakini & Krishna residential quad study lounges undergoing quiet refresh.',
  },
];


