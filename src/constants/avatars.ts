import type { AvatarConfig } from '../types/studyverse';

export const AVATAR_CATALOG: AvatarConfig[] = [
  // Female-presenting
  {
    id: 'f-maya',
    name: 'Maya',
    gender: 'female',
    hairStyle: 'messy-bun',
    hairColor: '#4a2e1b', // Chestnut
    skinTone: '#f3c9aa',
    clothingStyle: 'sweater',
    clothingColor: '#7c9a84', // Sage green knit
    accentColor: '#e07a5f',
    accessory: 'glasses',
    activity: 'reading',
    summary: 'Warm sage knit sweater, cozy hair bun, wireframe reading glasses',
  },
  {
    id: 'f-clara',
    name: 'Clara',
    gender: 'female',
    hairStyle: 'wavy-curls',
    hairColor: '#1e1c1a', // Soft black
    skinTone: '#8d5524', // Deep warm
    clothingStyle: 'cardigan',
    clothingColor: '#c27d60', // Terracotta
    accentColor: '#f4a261',
    accessory: 'headphones',
    activity: 'typing',
    summary: 'Terracotta cardigan, loose curls, noise-canceling headphones',
  },
  {
    id: 'f-linnea',
    name: 'Linnea',
    gender: 'female',
    hairStyle: 'straight-bob',
    hairColor: '#d4a373', // Honey blonde
    skinTone: '#fceade',
    clothingStyle: 'turtleneck',
    clothingColor: '#496f5d', // Deep pine
    accentColor: '#e9c46a',
    accessory: 'earbuds',
    activity: 'writing',
    summary: 'Pine turtleneck, honey bob cut, focused on notebook sketches',
  },
  {
    id: 'f-zoe',
    name: 'Zoe',
    gender: 'female',
    hairStyle: 'ponytail',
    hairColor: '#a0522d', // Auburn
    skinTone: '#e0ac69',
    clothingStyle: 'hoodie-denim',
    clothingColor: '#5c768d', // Muted slate blue
    accentColor: '#f1faee',
    accessory: 'scarf',
    activity: 'coffee',
    summary: 'Slate denim hoodie, soft knitted scarf, warm mug in hands',
  },

  // Male-presenting
  {
    id: 'm-elias',
    name: 'Elias',
    gender: 'male',
    hairStyle: 'short-fade',
    hairColor: '#2b262d', // Dark espresso
    skinTone: '#d9a066',
    clothingStyle: 'varsity',
    clothingColor: '#3d5a80', // Deep naval blue
    accentColor: '#ee6c4d',
    accessory: 'glasses',
    activity: 'reading',
    summary: 'Navy varsity jacket, crisp fade haircut, round tortoiseshell glasses',
  },
  {
    id: 'm-lucas',
    name: 'Lucas',
    gender: 'male',
    hairStyle: 'side-part',
    hairColor: '#78593a', // Mocha brown
    skinTone: '#fbe4d8',
    clothingStyle: 'sweater',
    clothingColor: '#606c38', // Moss green
    accentColor: '#dda15e',
    accessory: 'headphones',
    activity: 'typing',
    summary: 'Moss green cable knit, classic side part, coding on laptop',
  },
  {
    id: 'm-kenji',
    name: 'Kenji',
    gender: 'male',
    hairStyle: 'beanie-hair',
    hairColor: '#1c1b22', // Jet black
    skinTone: '#ebd0b6',
    clothingStyle: 'flannel',
    clothingColor: '#9c6644', // Warm coffee plaid
    accentColor: '#e6ccb2',
    accessory: 'earbuds',
    activity: 'writing',
    summary: 'Coffee flannel over tee, ribbed beanie, handwritten fountain pen notes',
  },
  {
    id: 'm-samir',
    name: 'Samir',
    gender: 'male',
    hairStyle: 'textured-afro',
    hairColor: '#191716', // Dark
    skinTone: '#6b4423', // Rich amber
    clothingStyle: 'cardigan',
    clothingColor: '#4f6d7a', // Steel teal
    accentColor: '#f3c68f',
    accessory: 'glasses',
    activity: 'coffee',
    summary: 'Steel teal knit cardigan, amber tones, gentle morning study focus',
  },

  // Gender-neutral / Ambient
  {
    id: 'n-rowan',
    name: 'Rowan',
    gender: 'neutral',
    hairStyle: 'short-fade',
    hairColor: '#8c6d62', // Ash brown
    skinTone: '#e8c39e',
    clothingStyle: 'sweater',
    clothingColor: '#8a9a86', // Muted sage
    accentColor: '#fefae0',
    accessory: 'headphones',
    activity: 'reading',
    summary: 'Oversized sage sweater, oversized studio headphones, quiet reader',
  },
  {
    id: 'n-sasha',
    name: 'Sasha',
    gender: 'neutral',
    hairStyle: 'beanie-hair',
    hairColor: '#c89f78', // Warm sandy
    skinTone: '#f5d5b8',
    clothingStyle: 'hoodie-denim',
    clothingColor: '#7d6b7d', // Dusty plum
    accentColor: '#f7d1cd',
    accessory: 'glasses',
    activity: 'typing',
    summary: 'Dusty plum hoodie, minimalist wireframes, quiet study rhythm',
  },
  {
    id: 'n-jordan',
    name: 'Jordan',
    gender: 'neutral',
    hairStyle: 'wavy-curls',
    hairColor: '#3d312a', // Deep chocolate
    skinTone: '#b58156',
    clothingStyle: 'turtleneck',
    clothingColor: '#405059', // Midnight slate
    accentColor: '#e0a96d',
    accessory: 'scarf',
    activity: 'writing',
    summary: 'Midnight slate turtleneck, warm caramel scarf, journaling with tea',
  },
  {
    id: 'n-milo',
    name: 'Milo',
    gender: 'neutral',
    hairStyle: 'messy-bun',
    hairColor: '#b08968', // Caramel
    skinTone: '#fed9b7',
    clothingStyle: 'flannel',
    clothingColor: '#6d7973', // Olive spruce
    accentColor: '#ffe5b4',
    accessory: 'none',
    activity: 'coffee',
    summary: 'Olive spruce overshirt, relaxed messy topknot, peaceful companion',
  },
];

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
