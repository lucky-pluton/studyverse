export type GenderOption = 'male' | 'female' | 'neutral';

export type LocationId =
  | 'campus'
  | 'city' // backwards-compatibility alias for campus
  | 'library'
  | 'lhc'
  | 'banyan'
  | 'oat'
  | 'cafe'
  | 'park'
  | 'gc';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export type StudyStatus = 'deep-focus' | 'studying' | 'break' | 'away';

export interface AvatarConfig {
  id: string;
  name: string;
  gender: GenderOption;
  hairStyle:
    | 'messy-bun'
    | 'short-fade'
    | 'wavy-curls'
    | 'straight-bob'
    | 'textured-afro'
    | 'ponytail'
    | 'side-part'
    | 'beanie-hair'
    | 'locs-braids'
    | 'curly-shag';
  hairColor: string;
  skinTone: string;
  clothingStyle:
    | 'sweater'
    | 'hoodie-denim'
    | 'cardigan'
    | 'varsity'
    | 'flannel'
    | 'turtleneck'
    | 'casual-tee';
  clothingColor: string;
  accentColor: string;
  accessory?: 'glasses' | 'headphones' | 'earbuds' | 'backpack' | 'scarf' | 'none';
  hasBackpack?: boolean;
  activity: 'reading' | 'writing' | 'typing' | 'coffee' | 'thinking';
  status?: StudyStatus;
  summary: string;
}

export interface StudentPresence {
  sessionId: string;
  name: string;
  gender: GenderOption;
  avatarId: string;
  avatarConfig: AvatarConfig;
  location: LocationId;
  seatId: string | null;
  seatEnteredAt: number | null; // UTC timestamp ms
  sessionEnteredAt: number;     // UTC timestamp ms
  studyTopic?: string;
  status?: StudyStatus;
  isDnd?: boolean;              // Do Not Disturb (Quiet Study) mode
  lastHeartbeat: number;
}

export interface SeatDefinition {
  id: string;
  name: string;
  type: 'desk' | 'table' | 'window' | 'bench' | 'booth' | 'chair' | 'tier';
  x: number; // percentage coordinate 0-100 on the location canvas
  y: number; // percentage coordinate 0-100 on the location canvas
  labelPosition?: 'top' | 'bottom';
  sharedGroupId?: string; // e.g. group table seat A, B, C, D
  description?: string;
  scale?: number; // perspective scaling factor (e.g. 0.75 for background, 1.0 for foreground)
  size?: 'xs' | 'sm' | 'md' | 'lg'; // avatar renderer size based on perspective depth
  /** for a seat with no chair in the room picture: draw one, seen from the side, under the seat */
  chair?: DrawnChair;
}

/** A chair drawn over the room picture, seen side-on. The cushion's top sits at the seat's x/y. */
export interface DrawnChair {
  /** which way the sitter faces: toward the table beside the chair */
  facing: 'left' | 'right';
  /** size as a percentage of the room picture's width and height */
  width: number;
  height: number;
}

export interface LocationDefinition {
  id: LocationId;
  name: string;
  tagline: string;
  category: 'Academic' | 'Outdoor' | 'Cafeteria' | 'Iconic Landmark';
  description: string;
  themeColor: string;
  badgeBg: string;
  icon: string;
  mapX: number; // percentage coordinate on the campus map
  mapY: number; // percentage coordinate on the campus map
  seats: SeatDefinition[];
  ambientTrack: 'library' | 'lhc' | 'banyan' | 'oat' | 'cafe' | 'park';
  musicNotes: string[];
}

export interface CampusStats {
  totalOnline: number;
  activeLocationsCount: number;
  libraryCount: number;
  lhcCount: number;
  banyanCount: number;
  oatCount: number;
  cafeCount: number;
  parkCount: number;
  gcCount: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderName: string;
  avatarId: string;
  avatarConfig?: AvatarConfig;
  text: string;
  timestamp: number;
  locationId: LocationId;
  /** 'report' is a moderation signal: it is never shown, it counts towards hiding `targetId` for everyone */
  type?: 'chat' | 'reaction' | 'report';
  /** for reports: the id of the message being reported */
  targetId?: string;
}

export interface QuickStudyReaction {
  id: string;
  emoji: string;
  label: string;
  text: string;
}
