// 3D Virtual Campus Types and Coordinate Definitions for Studyverse

import type { LocationId } from './studyverse';

export interface BuildingHotspot3D {
  id: LocationId;
  name: string;
  category: string;
  position: [number, number, number]; // [x, y, z] in 3D world
  rotationY: number;
  scale: [number, number, number];
  color: string;
  accentColor: string;
}

export interface Seat3DDefinition {
  id: string;
  name: string;
  position: [number, number, number]; // [x, y, z] in room space
  rotationY: number; // in radians
  type: 'desk' | 'chair' | 'bench' | 'tier';
}

export interface RoomEnvironment3DConfig {
  id: LocationId;
  name: string;
  tagline: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  floorDimensions: [number, number]; // [width, depth]
  ambientColor: string;
  sunColor: string;
  seats: Seat3DDefinition[];
}

