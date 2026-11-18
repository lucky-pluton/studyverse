import type { AvatarConfig, StudyStatus } from '../types/studyverse';

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  accentHex?: string;
}

export interface OptionItem<T extends string = string> {
  id: T;
  name: string;
  description?: string;
  icon?: string;
}

// 1. Soft Warm Pastel Clothing Palette
export const CLOTHING_PALETTES: ColorOption[] = [
  { id: 'lavender', name: 'Lavender', hex: '#b8a7d9', accentHex: '#efe6fb' },
  { id: 'sage', name: 'Sage Green', hex: '#8fa89b', accentHex: '#e8f0eb' },
  { id: 'navy', name: 'Navy Slate', hex: '#3d5a80', accentHex: '#e0f2fe' },
  { id: 'beige', name: 'Warm Beige', hex: '#d7c9b8', accentHex: '#fcf8f2' },
  { id: 'muted-blue', name: 'Muted Blue', hex: '#6a8caf', accentHex: '#dce8f5' },
  { id: 'peach', name: 'Soft Peach', hex: '#f3b092', accentHex: '#ffeade' },
  { id: 'dusty-pink', name: 'Dusty Pink', hex: '#d89d9e', accentHex: '#fae8ea' },
  { id: 'forest', name: 'Forest Spruce', hex: '#52796f', accentHex: '#e0eee7' },
  { id: 'terracotta', name: 'Terracotta', hex: '#c27d60', accentHex: '#fae3d9' },
  { id: 'charcoal', name: 'Soft Charcoal', hex: '#40464d', accentHex: '#e5e7eb' },
];

// 2. Diverse Natural Skin Tones with 2.5D Shading Pairs
export const SKIN_TONES = [
  { id: 'fair-ivory', name: 'Fair Ivory', hex: '#fae7d9', shadowHex: '#e8caa8' },
  { id: 'warm-beige', name: 'Warm Beige', hex: '#f3c9aa', shadowHex: '#dfad87' },
  { id: 'honey-peach', name: 'Honey Peach', hex: '#fed9b7', shadowHex: '#e2b388' },
  { id: 'golden-tan', name: 'Golden Tan', hex: '#d9a066', shadowHex: '#bc8044' },
  { id: 'caramel', name: 'Caramel Mocha', hex: '#b58156', shadowHex: '#945f34' },
  { id: 'rich-amber', name: 'Rich Amber', hex: '#8d5524', shadowHex: '#6a3b11' },
  { id: 'deep-espresso', name: 'Deep Espresso', hex: '#57361e', shadowHex: '#3b2110' },
];

// 3. Hair Colors
export const HAIR_COLORS = [
  { id: 'black', name: 'Licorice Black', hex: '#1c1a19', highlightHex: '#3a3634' },
  { id: 'dark-espresso', name: 'Dark Espresso', hex: '#2b2426', highlightHex: '#4a3e42' },
  { id: 'chestnut', name: 'Chestnut Brown', hex: '#4a2e1b', highlightHex: '#6f472d' },
  { id: 'mocha', name: 'Mocha Chocolate', hex: '#69442e', highlightHex: '#8e5f43' },
  { id: 'auburn', name: 'Auburn Copper', hex: '#a0522d', highlightHex: '#c76e42' },
  { id: 'honey-blonde', name: 'Honey Blonde', hex: '#d4a373', highlightHex: '#f1c89a' },
  { id: 'ash-brown', name: 'Ash Caramel', hex: '#b08968', highlightHex: '#d4ad8c' },
  { id: 'silver-grey', name: 'Silver Slate', hex: '#8e9aaf', highlightHex: '#b8c0cf' },
];

// 4. Hairstyles
export const HAIR_STYLES: OptionItem<AvatarConfig['hairStyle']>[] = [
  { id: 'messy-bun', name: 'Messy Bun', description: 'Cozy topknot with soft wisps' },
  { id: 'short-fade', name: 'Textured Fade', description: 'Clean, cropped modern fade' },
  { id: 'wavy-curls', name: 'Wavy Curls', description: 'Voluminous bouncy waves' },
  { id: 'straight-bob', name: 'Rounded Bob', description: 'Sleek chin-length rounded bob' },
  { id: 'textured-afro', name: 'Textured Afro', description: 'Rounded cloud afro with soft coils' },
  { id: 'ponytail', name: 'High Ponytail', description: 'Perky ponytail with hair tie' },
  { id: 'side-part', name: 'Classic Side Part', description: 'Gently parted academic fringe' },
  { id: 'beanie-hair', name: 'Knitted Beanie', description: 'Warm ribbed student beanie' },
  { id: 'locs-braids', name: 'Braided Locs', description: 'Neat braided locs with bead highlights' },
  { id: 'curly-shag', name: 'Curly Shag', description: 'Casual layered curls and soft bangs' },
];

// 5. Outfits & Clothing Styles
export const CLOTHING_STYLES: OptionItem<AvatarConfig['clothingStyle']>[] = [
  { id: 'sweater', name: 'Knit Sweater', description: 'Cozy ribbed knit sweater' },
  { id: 'hoodie-denim', name: 'Cozy Hoodie', description: 'Oversized fleece hoodie with drawstrings' },
  { id: 'cardigan', name: 'Buttoned Cardigan', description: 'V-neck cardigan layered over collared shirt' },
  { id: 'varsity', name: 'Varsity Jacket', description: 'Two-tone campus bomber jacket' },
  { id: 'flannel', name: 'Plaid Flannel', description: 'Relaxed checkered overshirt over tee' },
  { id: 'turtleneck', name: 'Ribbed Turtleneck', description: 'Fitted winter rollneck collar' },
  { id: 'casual-tee', name: 'Layered Tee', description: 'Clean crewneck casual campus tee' },
];

// 6. Accessories
export const ACCESSORIES: OptionItem<NonNullable<AvatarConfig['accessory']>>[] = [
  { id: 'glasses', name: 'Wireframe Glasses', description: 'Tortoiseshell rounded study spectacles' },
  { id: 'headphones', name: 'Studio Headphones', description: 'Over-ear cushioned noise-canceling cans' },
  { id: 'earbuds', name: 'Wireless Earbuds', description: 'Minimalist sleek earbuds' },
  { id: 'backpack', name: 'Campus Backpack', description: 'Canvas backpack with shoulder straps' },
  { id: 'scarf', name: 'Knitted Scarf', description: 'Soft woolen wrap scarf with fringed edges' },
  { id: 'none', name: 'No Accessories', description: 'Clean minimalist appearance' },
];

// 7. Study Status Indicators
export interface StudyStatusDefinition {
  id: StudyStatus;
  label: string;
  emoji: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  dotColor: string;
}

export const STUDY_STATUSES: StudyStatusDefinition[] = [
  {
    id: 'deep-focus',
    label: 'Deep Focus',
    emoji: '🎯',
    badgeBg: 'bg-[#2d5a43]/15',
    badgeBorder: 'border-[#2d5a43]/40',
    textColor: 'text-[#1c4330]',
    dotColor: 'bg-[#2d5a43]',
  },
  {
    id: 'studying',
    label: 'Studying',
    emoji: '📖',
    badgeBg: 'bg-[#3d5a80]/15',
    badgeBorder: 'border-[#3d5a80]/40',
    textColor: 'text-[#2b4463]',
    dotColor: 'bg-[#3d5a80]',
  },
  {
    id: 'break',
    label: 'Taking a Break',
    emoji: '☕',
    badgeBg: 'bg-[#c27d60]/15',
    badgeBorder: 'border-[#c27d60]/40',
    textColor: 'text-[#87492f]',
    dotColor: 'bg-[#c27d60]',
  },
  {
    id: 'away',
    label: 'Away',
    emoji: '🌙',
    badgeBg: 'bg-[#7d6b7d]/15',
    badgeBorder: 'border-[#7d6b7d]/40',
    textColor: 'text-[#584858]',
    dotColor: 'bg-[#7d6b7d]',
  },
];

// 8. Study Topics
export const STUDY_TOPICS = [
  'Deep Focus',
  'Reading & Research',
  'Writing Essay',
  'Coding & Systems',
  'Math & Physics',
  'Language Practice',
  'Exam Prep',
  'Creative Writing',
  'Thesis Drafting',
  'Quiet Review',
];

// 9. Full Diverse 2.5D Avatar Catalog (14 Handcrafted Characters)
export const AVATAR_CATALOG: AvatarConfig[] = [
  // Female-presenting
  {
    id: 'f-maya',
    name: 'Maya',
    gender: 'female',
    hairStyle: 'messy-bun',
    hairColor: '#4a2e1b', // Chestnut
    skinTone: '#f3c9aa', // Warm Beige
    clothingStyle: 'sweater',
    clothingColor: '#8fa89b', // Sage Green
    accentColor: '#f3b092', // Peach accent
    accessory: 'glasses',
    hasBackpack: true,
    activity: 'reading',
    status: 'deep-focus',
    summary: 'Sage green knit sweater, messy topknot bun, wireframe reading glasses & canvas backpack',
  },
  {
    id: 'f-clara',
    name: 'Clara',
    gender: 'female',
    hairStyle: 'wavy-curls',
    hairColor: '#1c1a19', // Licorice black
    skinTone: '#8d5524', // Rich amber
    clothingStyle: 'cardigan',
    clothingColor: '#c27d60', // Terracotta
    accentColor: '#f4a261',
    accessory: 'headphones',
    hasBackpack: false,
    activity: 'typing',
    status: 'studying',
    summary: 'Terracotta cardigan, loose curls, studio noise-canceling headphones',
  },
  {
    id: 'f-linnea',
    name: 'Linnea',
    gender: 'female',
    hairStyle: 'straight-bob',
    hairColor: '#d4a373', // Honey blonde
    skinTone: '#fae7d9', // Fair Ivory
    clothingStyle: 'turtleneck',
    clothingColor: '#52796f', // Forest spruce
    accentColor: '#b8a7d9', // Lavender
    accessory: 'earbuds',
    hasBackpack: true,
    activity: 'writing',
    status: 'studying',
    summary: 'Forest spruce turtleneck, honey bob cut, focused on notebook notes',
  },
  {
    id: 'f-zoe',
    name: 'Zoe',
    gender: 'female',
    hairStyle: 'ponytail',
    hairColor: '#a0522d', // Auburn
    skinTone: '#fed9b7', // Honey Peach
    clothingStyle: 'hoodie-denim',
    clothingColor: '#6a8caf', // Muted Blue
    accentColor: '#d89d9e', // Dusty pink
    accessory: 'scarf',
    hasBackpack: true,
    activity: 'coffee',
    status: 'break',
    summary: 'Muted blue fleece hoodie, soft knitted scarf, warm ceramic mug in hands',
  },
  {
    id: 'f-amara',
    name: 'Amara',
    gender: 'female',
    hairStyle: 'locs-braids',
    hairColor: '#1c1a19',
    skinTone: '#57361e', // Deep Espresso
    clothingStyle: 'varsity',
    clothingColor: '#b8a7d9', // Lavender
    accentColor: '#d7c9b8',
    accessory: 'glasses',
    hasBackpack: true,
    activity: 'thinking',
    status: 'deep-focus',
    summary: 'Lavender varsity bomber, braided locs with bead accents, wireframe glasses',
  },
  {
    id: 'f-hana',
    name: 'Hana',
    gender: 'female',
    hairStyle: 'curly-shag',
    hairColor: '#2b2426',
    skinTone: '#f3c9aa',
    clothingStyle: 'casual-tee',
    clothingColor: '#d89d9e', // Dusty Pink
    accentColor: '#8fa89b',
    accessory: 'headphones',
    hasBackpack: false,
    activity: 'reading',
    status: 'studying',
    summary: 'Dusty pink layered tee, bouncy layered curls, soft studio headphones',
  },

  // Male-presenting
  {
    id: 'm-elias',
    name: 'Elias',
    gender: 'male',
    hairStyle: 'short-fade',
    hairColor: '#2b2426', // Dark espresso
    skinTone: '#d9a066', // Golden Tan
    clothingStyle: 'varsity',
    clothingColor: '#3d5a80', // Navy Slate
    accentColor: '#f3b092',
    accessory: 'glasses',
    hasBackpack: true,
    activity: 'reading',
    status: 'deep-focus',
    summary: 'Navy varsity jacket, crisp fade haircut, round tortoiseshell glasses',
  },
  {
    id: 'm-lucas',
    name: 'Lucas',
    gender: 'male',
    hairStyle: 'side-part',
    hairColor: '#69442e', // Mocha brown
    skinTone: '#fae7d9', // Fair Ivory
    clothingStyle: 'sweater',
    clothingColor: '#52796f', // Forest spruce
    accentColor: '#d7c9b8',
    accessory: 'headphones',
    hasBackpack: false,
    activity: 'typing',
    status: 'studying',
    summary: 'Forest spruce cable knit sweater, classic side part, coding on laptop',
  },
  {
    id: 'm-kenji',
    name: 'Kenji',
    gender: 'male',
    hairStyle: 'beanie-hair',
    hairColor: '#1c1a19', // Licorice black
    skinTone: '#fed9b7', // Honey Peach
    clothingStyle: 'flannel',
    clothingColor: '#c27d60', // Terracotta plaid
    accentColor: '#d7c9b8',
    accessory: 'earbuds',
    hasBackpack: true,
    activity: 'writing',
    status: 'studying',
    summary: 'Terracotta flannel over tee, ribbed sage beanie, handwritten fountain pen notes',
  },
  {
    id: 'm-samir',
    name: 'Samir',
    gender: 'male',
    hairStyle: 'textured-afro',
    hairColor: '#1c1a19',
    skinTone: '#8d5524', // Rich amber
    clothingStyle: 'cardigan',
    clothingColor: '#6a8caf', // Muted Blue
    accentColor: '#fed9b7',
    accessory: 'backpack',
    hasBackpack: true,
    activity: 'coffee',
    status: 'break',
    summary: 'Muted blue knit cardigan, amber tones, canvas campus backpack, warm tea break',
  },
  {
    id: 'm-kofi',
    name: 'Kofi',
    gender: 'male',
    hairStyle: 'locs-braids',
    hairColor: '#1c1a19',
    skinTone: '#57361e', // Deep Espresso
    clothingStyle: 'hoodie-denim',
    clothingColor: '#8fa89b', // Sage Green
    accentColor: '#f3b092',
    accessory: 'headphones',
    hasBackpack: true,
    activity: 'typing',
    status: 'deep-focus',
    summary: 'Sage green fleece hoodie, neat locs, noise-canceling headphones',
  },

  // Gender-neutral / Ambient
  {
    id: 'n-rowan',
    name: 'Rowan',
    gender: 'neutral',
    hairStyle: 'short-fade',
    hairColor: '#b08968', // Ash caramel
    skinTone: '#f3c9aa',
    clothingStyle: 'sweater',
    clothingColor: '#b8a7d9', // Lavender
    accentColor: '#d7c9b8',
    accessory: 'headphones',
    hasBackpack: false,
    activity: 'reading',
    status: 'deep-focus',
    summary: 'Pastel lavender sweater, oversized studio headphones, quiet deep reading',
  },
  {
    id: 'n-sasha',
    name: 'Sasha',
    gender: 'neutral',
    hairStyle: 'beanie-hair',
    hairColor: '#d4a373', // Honey sandy
    skinTone: '#fed9b7',
    clothingStyle: 'hoodie-denim',
    clothingColor: '#d89d9e', // Dusty pink
    accentColor: '#3d5a80',
    accessory: 'glasses',
    hasBackpack: true,
    activity: 'typing',
    status: 'studying',
    summary: 'Dusty pink hoodie, minimalist wireframes, quiet study rhythm',
  },
  {
    id: 'n-jordan',
    name: 'Jordan',
    gender: 'neutral',
    hairStyle: 'wavy-curls',
    hairColor: '#2b2426', // Deep chocolate
    skinTone: '#b58156', // Caramel mocha
    clothingStyle: 'turtleneck',
    clothingColor: '#3d5a80', // Navy Slate
    accentColor: '#d7c9b8',
    accessory: 'scarf',
    hasBackpack: true,
    activity: 'thinking',
    status: 'studying',
    summary: 'Navy slate turtleneck, warm beige scarf, deep thinking with journal',
  },
];
