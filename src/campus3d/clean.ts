/**
 * The "Clean" map view: flat bright grass, mid-grey roads with beige footpaths, brick-red and off-white buildings with plain
 * light roofs, and brighter low-poly trees with a few autumn crowns.
 *
 * It repaints the meshes the campus already has and keeps their original colours, so switching back
 * to the Satellite or Map style restores them without rebuilding anything.
 */
import * as THREE from 'three';

const GROUND: Record<string, string> = {
  'campus-lawn': '#a6d276',
  'area-grass': '#a2d06f',
  'area-golf': '#9fcd6b',
  'area-pitch': '#93c862',
  'area-wood': '#86bb5a',
  'area-orchard': '#97c665',
  'area-wetland': '#98c77a',
  'area-urban': '#dcd9cf',
  'area-paved': '#d6d1c6',
  'area-track': '#c9583f',
};
/** the land beyond the mapped areas */
const BASE_GROUND = '#b5d68a';
const WATER = '#6fb8d8';
const ROADS: Record<string, string> = { asphalt: '#8d9194', paths: '#e6dcc4', curbs: '#f0efea' };
/** wall colours, picked per building: mostly off-white, some brick */
const WALLS = ['#f1ede4', '#ebe5d8', '#a5493a', '#f5f3ee', '#93402f', '#e2dccd', '#b5543f'].map((h) => new THREE.Color(h));
const AUTUMN = ['#e08a3c', '#e3b13f', '#d9733a'].map((h) => new THREE.Color(h));

export interface CleanStyle {
  readonly on: boolean;
  set(on: boolean): void;
  /** plain light-grey roof material for this style */
  readonly roofMaterial: THREE.Material;
  /** share of trees kept, so the buildings and paths read clearly */
  readonly treeShare: number;
}

interface Swap {
  apply(): void;
  restore(): void;
}

export function createCleanStyle(parts: { ground: THREE.Group; roads: THREE.Group; buildings: THREE.Group; trees: THREE.Group }): CleanStyle {
  const named = (group: THREE.Group, name: string): THREE.Mesh | undefined =>
    group.children.find((o) => o.name === name) as THREE.Mesh | undefined;
  let swaps: Swap[] | null = null;
  let on = false;

  /** a flat colour in place of a mesh's texture and colour */
  const flat = (mesh: THREE.Mesh | undefined, hex: string, keepMap = false): Swap | null => {
    if (!mesh) return null;
    const m = mesh.material as THREE.MeshLambertMaterial;
    const map = m.map, color = m.color.clone();
    return {
      apply() { if (!keepMap) m.map = null; m.color.set(hex); m.needsUpdate = true; },
      restore() { m.map = map; m.color.copy(color); m.needsUpdate = true; },
    };
  };

  /** new vertex colours, worked out once from the originals */
  const vertexColours = (mesh: THREE.Mesh | undefined, fn: (c: THREE.Color) => THREE.Color): Swap | null => {
    const attr = mesh?.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
    if (!attr) return null;
    const original = (attr.array as Float32Array).slice();
    const repainted = new Float32Array(original.length);
    const c = new THREE.Color();
    for (let i = 0; i < original.length; i += attr.itemSize) {
      const out = fn(c.setRGB(original[i], original[i + 1], original[i + 2]));
      repainted[i] = out.r;
      repainted[i + 1] = out.g;
      repainted[i + 2] = out.b;
    }
    return {
      apply() { (attr.array as Float32Array).set(repainted); attr.needsUpdate = true; },
      restore() { (attr.array as Float32Array).set(original); attr.needsUpdate = true; },
    };
  };

  /** brighter, varied greens for the tree crowns, with a few autumn ones */
  const crowns = (mesh: THREE.InstancedMesh, salt: number): Swap | null => {
    const attr = mesh.instanceColor;
    if (!attr) return null;
    const original = (attr.array as Float32Array).slice();
    const repainted = new Float32Array(original.length);
    const c = new THREE.Color();
    for (let i = 0; i < attr.count; i++) {
      const h = Math.abs(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453) % 1;
      if (h < 0.03) c.copy(AUTUMN[Math.floor(h * 100) % AUTUMN.length]);
      else {
        const l = 1.07 + (h % 0.1) * 1.2;
        c.setRGB(Math.min(1, 0.36 * l), Math.min(1, 0.6 * l), Math.min(1, 0.22 * l), THREE.SRGBColorSpace);
      }
      repainted[i * 3] = c.r;
      repainted[i * 3 + 1] = c.g;
      repainted[i * 3 + 2] = c.b;
    }
    return {
      apply() { (attr.array as Float32Array).set(repainted); attr.needsUpdate = true; },
      restore() { (attr.array as Float32Array).set(original); attr.needsUpdate = true; },
    };
  };

  const build = (): Swap[] => {
    const out: (Swap | null)[] = [];
    // the base ground is the group's first, unnamed mesh
    const base = parts.ground.children.find((o) => (o as THREE.Mesh).isMesh && !o.name) as THREE.Mesh | undefined;
    out.push(flat(base, BASE_GROUND));
    for (const [name, hex] of Object.entries(GROUND)) out.push(flat(named(parts.ground, name), hex));
    out.push(flat(named(parts.ground, 'water'), WATER, true));
    for (const [name, hex] of Object.entries(ROADS)) {
      const col = new THREE.Color(hex);
      out.push(vertexColours(named(parts.roads, name), () => col));
    }
    // one wall colour per building: buildings keep their own original colour, so hashing it keeps each building one colour
    const wall = (c: THREE.Color): THREE.Color => {
      const k = Math.round(c.r * 997) * 31 + Math.round(c.g * 991) * 17 + Math.round(c.b * 983) * 7;
      return WALLS[Math.abs(k) % WALLS.length];
    };
    out.push(vertexColours(named(parts.buildings, 'b-walls'), wall));
    out.push(vertexColours(named(parts.buildings, 'b-plain'), wall));
    // the window texture darkens the walls, so they are lifted to read as white
    const walls = named(parts.buildings, 'b-walls');
    if (walls) {
      const m = walls.material as THREE.MeshStandardMaterial, color = m.color.clone();
      out.push({ apply() { m.color.setScalar(1.18); }, restore() { m.color.copy(color); } });
    }
    for (const name of ['tanks', 'stair-rooms']) out.push(flat(named(parts.buildings, name), '#d9d7d1'));
    parts.trees.children.forEach((o, i) => {
      const m = o as THREE.InstancedMesh;
      if (m.isInstancedMesh && m.name.startsWith('trees-')) out.push(crowns(m, i));
    });
    return out.filter((s): s is Swap => s !== null);
  };

  const roofMaterial = new THREE.MeshStandardMaterial({ color: '#cfccc5', roughness: 0.9 });

  return {
    get on() { return on; },
    roofMaterial,
    treeShare: 0.65,
    set(next: boolean) {
      if (next === on) return;
      if (next && !swaps) swaps = build();
      on = next;
      for (const s of swaps || []) if (on) s.apply(); else s.restore();
    },
  };
}
