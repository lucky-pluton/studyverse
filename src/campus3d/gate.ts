/**
 * Layout of the IIT Madras Main Gate on Sardar Patel Road (the gate rebuilt in 2021 where the IIT
 * flyover begins), measured on Esri World Imagery at about 0.3 m per pixel and checked against
 * photographs of the sign. Offsets are metres from the OpenStreetMap gate node, x east, z south.
 *
 * - The name sign stands on the planted median between the two one-way lanes, on the wall line,
 *   facing north to Sardar Patel Road. Brick piers with lamps frame each lane.
 * - Two white canopies roof the security checkpoints over the lanes, 50–70 m inside the gate.
 */
import type { CampusData } from './data';

/**
 * Whether the Main Gate sign shows the IIT Madras seal (public/brand/iitm-logo.svg). It stays off
 * until the institute gives written permission to use its seal; until then the sign shows a plain
 * gold ring. Set to true once permission is granted.
 */
export const SHOW_IITM_SEAL = false;

export const MAIN_GATE = {
  /** centre of the median on the wall line, where the sign stands */
  sign: { dx: -9.0, dz: -4.4 },
  /** the sign and piers face this way (out of campus, to the road) */
  facing: { x: 0, z: -1 },
  /** width of each lane opening between piers */
  laneWidth: 7.5,
  /** checkpoint canopies: centre offset, size, and the lane direction (into campus) */
  canopies: [
    { dx: -35.2, dz: 48.0, w: 11, d: 8.5, dir: { x: -0.307, z: 0.952 } },
    { dx: -26.8, dz: 65.5, w: 11, d: 8.5, dir: { x: -0.383, z: 0.924 } },
  ],
  /** keep the boundary wall and generated trees clear of the gate plaza */
  clearRadius: 15,
};

export function mainGateNode(data: CampusData): { x: number; z: number } | null {
  const p = data.pois.find((q) => q.n === 'IIT Madras gate');
  return p ? { x: p.x, z: p.z } : null;
}

export function mainGateSign(data: CampusData): { x: number; z: number } | null {
  const n = mainGateNode(data);
  return n ? { x: n.x + MAIN_GATE.sign.dx, z: n.z + MAIN_GATE.sign.dz } : null;
}
