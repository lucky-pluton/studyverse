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
      { id: 'lib-cubicle-01', name: 'Front Oak Desk West — Left Chair', type: 'chair', x: 14.5, y: 84.5, size: 'md', scale: 1.05, description: 'Front row oak reading desk with blue upholstered chair and emerald lamp.' },
      { id: 'lib-cubicle-02', name: 'Front Oak Desk West — Right Chair', type: 'chair', x: 28.5, y: 84.5, size: 'md', scale: 1.05, description: 'Front row oak reading desk with blue upholstered chair and emerald lamp.' },
      { id: 'lib-cubicle-03', name: 'Front Oak Desk East — Left Chair', type: 'chair', x: 73.5, y: 84.5, size: 'md', scale: 1.05, description: 'Front row sunlit study desk by the east bookshelves.' },
      { id: 'lib-cubicle-04', name: 'Front Oak Desk East — Right Chair', type: 'chair', x: 87.5, y: 84.5, size: 'md', scale: 1.05, description: 'Front row sunlit study desk by the east bookshelves.' },
      { id: 'lib-table-01', name: 'Mid Oak Desk West — Outer Chair', type: 'chair', x: 28.0, y: 69.0, size: 'md', scale: 0.88, description: 'Comfortable blue study chair overlooking the window trees.' },
      { id: 'lib-table-02', name: 'Mid Oak Desk West — Inner Chair', type: 'chair', x: 37.0, y: 69.0, size: 'md', scale: 0.88, description: 'Second tier wooden desk beside green desk plant.' },
      { id: 'lib-table-03', name: 'Mid Oak Desk East — Inner Chair', type: 'chair', x: 65.5, y: 69.0, size: 'md', scale: 0.88, description: 'Quiet research desk chair facing the central reading hall.' },
      { id: 'lib-armchair', name: 'Mid Oak Desk East — Outer Chair', type: 'chair', x: 74.0, y: 69.0, size: 'md', scale: 0.88, description: 'Quiet research desk chair beside the reference stacks.' },
      { id: 'lib-window-01', name: 'Rear Window Desk West — Aisle Chair', type: 'chair', x: 34.5, y: 64.0, size: 'sm', scale: 0.78, description: 'Sunlit desk with panoramic view of the IIT Madras green canopy.' },
      { id: 'lib-window-02', name: 'Rear Window Desk East — Aisle Chair', type: 'chair', x: 68.0, y: 64.0, size: 'sm', scale: 0.78, description: 'Sunlit desk with panoramic view of the IIT Madras green canopy.' },
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
      { id: 'lhc-hall1-05', name: 'Front Tier Desk — West A', type: 'chair', x: 5.5, y: 89.0, size: 'md', scale: 1.05, description: 'Prime front row lecture hall seat.' },
      { id: 'lhc-hall1-06', name: 'Front Tier Desk — West B', type: 'chair', x: 20.0, y: 89.0, size: 'md', scale: 1.05, description: 'Prime front row lecture hall seat.' },
      { id: 'lhc-crc-01', name: 'Front Tier Desk — East A', type: 'chair', x: 80.0, y: 89.0, size: 'md', scale: 1.05, description: 'Front row tiered desk with clear board view.' },
      { id: 'lhc-crc-02', name: 'Front Tier Desk — East B', type: 'chair', x: 94.5, y: 89.0, size: 'md', scale: 1.05, description: 'Front row tiered desk with clear board view.' },
      { id: 'lhc-hall1-01', name: 'Tier 2 Desk — West Center', type: 'chair', x: 14.5, y: 77.5, size: 'md', scale: 0.92, description: 'Second tier wooden desk with upholstered chair.' },
      { id: 'lhc-hall1-02', name: 'Tier 2 Desk — West Aisle', type: 'chair', x: 26.5, y: 77.5, size: 'md', scale: 0.92, description: 'Second tier wooden desk with upholstered chair.' },
      { id: 'lhc-hall1-03', name: 'Tier 2 Desk — East Aisle', type: 'chair', x: 73.5, y: 77.5, size: 'md', scale: 0.92, description: 'Second tier wooden desk with upholstered chair.' },
      { id: 'lhc-hall1-04', name: 'Tier 2 Desk — East Center', type: 'chair', x: 85.5, y: 77.5, size: 'md', scale: 0.92, description: 'Second tier wooden desk with upholstered chair.' },
      { id: 'lhc-balcony', name: 'Tier 3 Desk — West Wing', type: 'chair', x: 21.5, y: 69.5, size: 'sm', scale: 0.82, description: 'Upper tier study desk with expansive theatre perspective.' },
      { id: 'lhc-podium', name: 'Faculty Presentation Podium', type: 'chair', x: 45.5, y: 48.5, size: 'sm', scale: 0.8, description: 'Distinguished lecture hall podium desk.' },
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
      { id: 'banyan-lawn-01', name: 'Front Pergola Table West — Stool', type: 'chair', x: 12.5, y: 86.5, size: 'md', scale: 1.0, description: 'Round timber stool at the front study table.' },
      { id: 'banyan-lawn-02', name: 'Front Pergola Table West — Side Stool', type: 'chair', x: 29.0, y: 81.5, size: 'md', scale: 0.95, description: 'Round timber stool at the front study table.' },
      { id: 'banyan-picnic-01', name: 'Front Pergola Table East — Side Stool', type: 'chair', x: 71.0, y: 81.5, size: 'md', scale: 0.95, description: 'Round timber stool at the front study table.' },
      { id: 'banyan-picnic-02', name: 'Front Pergola Table East — Stool', type: 'chair', x: 88.0, y: 86.5, size: 'md', scale: 1.0, description: 'Round timber stool at the front study table.' },
      { id: 'banyan-stone-01', name: 'Mid Patio Table — West Stool', type: 'chair', x: 25.5, y: 65.5, size: 'md', scale: 0.88, description: 'Mid-patio timber stool nestled in cool canopy shade.' },
      { id: 'banyan-stone-02', name: 'Mid Patio Table — East Stool', type: 'chair', x: 75.0, y: 65.5, size: 'md', scale: 0.88, description: 'Mid-patio timber stool nestled in cool canopy shade.' },
      { id: 'banyan-canopy-01', name: 'Central Shaded Banyan Bench — Left', type: 'bench', x: 46.0, y: 54.5, size: 'sm', scale: 0.85, description: 'Wooden park bench nestled directly in front of the ancient banyan tree.' },
      { id: 'banyan-hammock', name: 'Central Shaded Banyan Bench — Right', type: 'bench', x: 54.0, y: 54.5, size: 'sm', scale: 0.85, description: 'Wooden park bench nestled directly in front of the ancient banyan tree.' },
      { id: 'banyan-quiet', name: 'West Garden Canopy Bench', type: 'bench', x: 6.0, y: 59.0, size: 'sm', scale: 0.85, description: 'Perimeter garden bench under the lush rain trees.' },
      { id: 'banyan-sunbeam', name: 'East Garden Canopy Bench', type: 'bench', x: 93.5, y: 59.0, size: 'sm', scale: 0.85, description: 'Perimeter garden bench under the lush rain trees.' },
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
      { id: 'oat-tier-lower-01', name: 'Lower Stone Terrace — West Arc', type: 'tier', x: 18.0, y: 66.0, size: 'md', scale: 0.95, description: 'Curved granite terrace step in the lower amphitheatre arc.' },
      { id: 'oat-tier-lower-02', name: 'Lower Stone Terrace — Center West', type: 'tier', x: 35.0, y: 61.5, size: 'md', scale: 0.92, description: 'Smooth granite seating terrace step.' },
      { id: 'oat-tier-lower-03', name: 'Lower Stone Terrace — Center East', type: 'tier', x: 65.0, y: 61.5, size: 'md', scale: 0.92, description: 'Smooth granite seating terrace step.' },
      { id: 'oat-stage-02', name: 'Lower Stone Terrace — East Arc', type: 'tier', x: 82.0, y: 66.0, size: 'md', scale: 0.95, description: 'Curved granite terrace step in the lower amphitheatre arc.' },
      { id: 'oat-tier-mid-01', name: 'Mid Terrace — West Arc', type: 'tier', x: 15.0, y: 57.0, size: 'md', scale: 0.88, description: 'Mid-elevation stone terrace step surrounded by gentle shade.' },
      { id: 'oat-tier-mid-02', name: 'Mid Terrace — Center West', type: 'tier', x: 42.0, y: 54.0, size: 'md', scale: 0.88, description: 'Mid-elevation stone terrace step.' },
      { id: 'oat-tier-mid-03', name: 'Mid Terrace — Center East', type: 'tier', x: 58.0, y: 54.0, size: 'md', scale: 0.88, description: 'Mid-elevation stone terrace step.' },
      { id: 'oat-tier-top-01', name: 'Mid Terrace — East Arc', type: 'tier', x: 85.0, y: 57.0, size: 'md', scale: 0.88, description: 'Mid-elevation stone terrace step surrounded by gentle shade.' },
      { id: 'oat-stage-01', name: 'Upper Stage Steps', type: 'tier', x: 50.0, y: 47.0, size: 'sm', scale: 0.8, description: 'Center terrace step facing the memorial pavilion.' },
      { id: 'oat-tier-top-02', name: 'IIT Madras Pavilion Dais', type: 'tier', x: 50.0, y: 39.5, size: 'sm', scale: 0.78, description: 'Distinguished stone pavilion step with open campus vista.' },
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
      { id: 'cafe-patio-01', name: 'Front Table West — Left Chair', type: 'chair', x: 8.5, y: 81.5, size: 'md', scale: 1.05, description: 'Round wooden cafe table with blue upholstered chair.' },
      { id: 'cafe-patio-02', name: 'Front Table West — Right Chair', type: 'chair', x: 27.5, y: 81.5, size: 'md', scale: 1.05, description: 'Round wooden cafe table with blue upholstered chair.' },
      { id: 'cafe-booth-01', name: 'Front Table East — Left Chair', type: 'chair', x: 72.5, y: 81.5, size: 'md', scale: 1.05, description: 'Round wooden cafe table with blue upholstered chair.' },
      { id: 'cafe-booth-02', name: 'Front Table East — Right Chair', type: 'chair', x: 91.5, y: 81.5, size: 'md', scale: 1.05, description: 'Round wooden cafe table with blue upholstered chair.' },
      { id: 'cafe-bistro-01', name: 'Mid Table West — Outer Chair', type: 'chair', x: 16.5, y: 68.0, size: 'md', scale: 0.9, description: 'Sunny indoor cafe table chair with green plant.' },
      { id: 'cafe-counter-01', name: 'Mid Table West — Aisle Chair', type: 'chair', x: 32.5, y: 69.5, size: 'md', scale: 0.9, description: 'Sunny indoor cafe table chair with green plant.' },
      { id: 'cafe-veranda-01', name: 'Mid Table East — Aisle Chair', type: 'chair', x: 67.5, y: 69.5, size: 'md', scale: 0.9, description: 'Sunny indoor cafe table chair with green plant.' },
      { id: 'cafe-veranda-02', name: 'Mid Table East — Outer Chair', type: 'chair', x: 83.5, y: 68.0, size: 'md', scale: 0.9, description: 'Sunny indoor cafe table chair with green plant.' },
      { id: 'cafe-armchair', name: 'Sunlit Window Armchair — West', type: 'chair', x: 4.0, y: 62.0, size: 'sm', scale: 0.85, description: 'Comfortable blue armchair by the sunlit west glass window.' },
      { id: 'cafe-nook', name: 'Sunlit Window Armchair — East', type: 'chair', x: 96.0, y: 62.0, size: 'sm', scale: 0.85, description: 'Comfortable blue armchair by the sunlit east glass window.' },
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
      { id: 'park-fountain-01', name: 'Gazebo Center North Bench', type: 'bench', x: 50.0, y: 56.5, size: 'sm', scale: 0.85, description: 'Rear wooden bench sheltered inside the Sangam gazebo pavilion.' },
      { id: 'park-fountain-02', name: 'Gazebo West Entrance Bench', type: 'bench', x: 32.5, y: 64.0, size: 'md', scale: 0.95, description: 'Curved wooden bench welcoming visitors to the Sangam pavilion.' },
      { id: 'park-picnic-01', name: 'Gazebo East Entrance Bench', type: 'bench', x: 68.0, y: 64.0, size: 'md', scale: 0.95, description: 'Curved wooden bench welcoming visitors to the Sangam pavilion.' },
      { id: 'park-trellis', name: 'Gazebo West Alcove Bench', type: 'bench', x: 32.5, y: 56.5, size: 'sm', scale: 0.85, description: 'Quiet alcove bench inside the gazebo overlooking the flowers.' },
      { id: 'park-pondside', name: 'Gazebo East Alcove Bench', type: 'bench', x: 67.5, y: 56.5, size: 'sm', scale: 0.85, description: 'Quiet alcove bench inside the gazebo overlooking the flowers.' },
      { id: 'park-path-01', name: 'West Garden Pathway Bench', type: 'bench', x: 18.0, y: 61.5, size: 'md', scale: 0.95, description: 'Garden bench shaded by ornamental rain trees.' },
      { id: 'park-rain-tree', name: 'East Garden Pathway Bench', type: 'bench', x: 81.5, y: 61.5, size: 'md', scale: 0.95, description: 'Garden bench shaded by ornamental rain trees.' },
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
      { id: 'gc-fountain-01', name: 'Promenade Curved Bench — West', type: 'bench', x: 16.5, y: 73.0, size: 'md', scale: 1.05, description: 'Foreground curved wooden bench along the circular promenade.' },
      { id: 'gc-fountain-02', name: 'Promenade Curved Bench — East', type: 'bench', x: 89.5, y: 73.0, size: 'md', scale: 1.05, description: 'Foreground curved wooden bench along the circular promenade.' },
      { id: 'gc-pergola-01', name: 'West Lawn Perimeter Bench', type: 'bench', x: 8.5, y: 57.5, size: 'md', scale: 0.9, description: 'Wooden park bench on the perimeter lawn facing Gajendra Circle.' },
      { id: 'gc-pergola-02', name: 'Inner West Circular Bench', type: 'bench', x: 25.0, y: 53.5, size: 'sm', scale: 0.85, description: 'Wooden park bench nestled under campus shade trees.' },
      { id: 'gc-tree-01', name: 'Inner East Circular Bench', type: 'bench', x: 80.5, y: 53.5, size: 'sm', scale: 0.85, description: 'Wooden park bench nestled under campus shade trees.' },
      { id: 'gc-tree-02', name: 'East Lawn Perimeter Bench', type: 'bench', x: 95.0, y: 57.5, size: 'md', scale: 0.9, description: 'Wooden park bench on the perimeter lawn facing Gajendra Circle.' },
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


