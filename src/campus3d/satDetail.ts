/**
 * Sharper satellite imagery close to where you look.
 *
 * The base imagery covers the whole map at one zoom level, which looks soft once you zoom in. Like
 * online maps, this loads closer tiles around the view as you move: zoom 18 (about 0.6 m per pixel)
 * nearby and zoom 19 (about 0.3 m) right around the spot you look at. Each tile is its own small
 * textured square laid just above the base imagery; tiles you move away from are kept for a while
 * and then freed.
 */
import * as THREE from 'three';
import type { CampusData } from './data';
import { fromLatLon, toLatLon } from './data';
import { SATELLITE, tileLat, tileLon, tileX, tileY } from './satellite';

export type DetailLevel = 'low' | 'med' | 'high';

interface Ring {
  zoom: number;
  /** half the side of the square around the view that gets this zoom, in metres */
  half: number;
  /** only while the camera is closer than this */
  within: number;
}

const LEVELS: Record<DetailLevel, { rings: Ring[]; keep: number }> = {
  // even the lightest setting gets a small ring: the tiles cost memory, hardly any frame time
  low: { rings: [{ zoom: 18, half: 320, within: 1000 }], keep: 50 },
  med: { rings: [{ zoom: 18, half: 420, within: 1300 }, { zoom: 19, half: 150, within: 480 }], keep: 110 },
  high: { rings: [{ zoom: 18, half: 520, within: 1700 }, { zoom: 19, half: 190, within: 600 }], keep: 170 },
};
/** tiles downloading at once */
const PARALLEL = 6;

interface Tile {
  key: string;
  zoom: number;
  x: number;
  y: number;
  mesh: THREE.Mesh;
  material: THREE.MeshLambertMaterial;
  state: 'idle' | 'loading' | 'ready' | 'failed';
  wanted: boolean;
  /** update count when it was last wanted, for freeing the oldest first */
  seen: number;
  priority: number;
}

export interface SatDetail {
  group: THREE.Group;
  /** cheap to call every frame; works out the wanted tiles again only when the view has moved */
  update(target: THREE.Vector3, camera: THREE.Vector3, viewDist: number): void;
  setLevel(level: DetailLevel): void;
  setEnabled(on: boolean): void;
}

export function createSatDetail(data: CampusData, maxAnisotropy: number): SatDetail {
  const group = new THREE.Group();
  group.name = 'satellite-detail';
  const unit = new THREE.PlaneGeometry(1, 1);
  unit.rotateX(-Math.PI / 2); // lies flat, facing up, with the texture's top to the north
  const loader = new THREE.TextureLoader().setCrossOrigin('anonymous');
  const tiles = new Map<string, Tile>();
  const queue: Tile[] = [];
  let active = 0, updates = 0;
  let level: DetailLevel = 'high', enabled = false;
  let lastX = Infinity, lastZ = Infinity, lastDist = 0;

  const show = (t: Tile) => { t.mesh.visible = enabled && t.wanted && t.state === 'ready'; };

  const make = (zoom: number, x: number, y: number): Tile => {
    const n = 2 ** zoom;
    const nw = fromLatLon(data, tileLat(y, n), tileLon(x, n));
    const se = fromLatLon(data, tileLat(y + 1, n), tileLon(x + 1, n));
    // closer zoom levels sit a little higher and win the depth test over coarser ones
    const lift = zoom - 17;
    const material = new THREE.MeshLambertMaterial({ polygonOffset: true, polygonOffsetFactor: -1 - lift, polygonOffsetUnits: -2 - 2 * lift });
    const mesh = new THREE.Mesh(unit, material);
    mesh.position.set((nw.x + se.x) / 2, 0.04 + lift * 0.02, (nw.z + se.z) / 2);
    mesh.scale.set(se.x - nw.x, 1, se.z - nw.z);
    mesh.receiveShadow = true;
    mesh.visible = false;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.renderOrder = -1;
    group.add(mesh);
    const t: Tile = { key: `${zoom}/${x}/${y}`, zoom, x, y, mesh, material, state: 'idle', wanted: false, seen: 0, priority: 0 };
    tiles.set(t.key, t);
    return t;
  };

  const free = (t: Tile) => {
    group.remove(t.mesh);
    t.material.map?.dispose();
    t.material.dispose();
    tiles.delete(t.key);
  };

  const pump = () => {
    queue.sort((a, b) => a.priority - b.priority);
    while (active < PARALLEL && queue.length) {
      const t = queue.shift()!;
      if (!t.wanted || t.state !== 'idle' || !tiles.has(t.key)) continue;
      t.state = 'loading';
      active++;
      const host = SATELLITE.hosts[(t.x + t.y) % SATELLITE.hosts.length];
      loader.load(
        SATELLITE.url(host, t.zoom, t.x, t.y),
        (tex) => {
          active--;
          if (!tiles.has(t.key)) { tex.dispose(); pump(); return; }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = maxAnisotropy;
          t.material.map = tex;
          t.material.needsUpdate = true;
          t.state = 'ready';
          show(t);
          pump();
        },
        undefined,
        () => { active--; t.state = 'failed'; pump(); },
      );
    }
  };

  const refresh = (cx: number, cz: number, viewDist: number) => {
    updates++;
    for (const t of tiles.values()) t.wanted = false;
    for (const ring of LEVELS[level].rings) {
      if (viewDist > ring.within) continue;
      const n = 2 ** ring.zoom;
      const a = toLatLon(data, cx - ring.half, cz - ring.half), b = toLatLon(data, cx + ring.half, cz + ring.half);
      const x0 = Math.floor(tileX(a.lon, n)), x1 = Math.floor(tileX(b.lon, n));
      const y0 = Math.floor(tileY(a.lat, n)), y1 = Math.floor(tileY(b.lat, n));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const t = tiles.get(`${ring.zoom}/${x}/${y}`) || make(ring.zoom, x, y);
          t.wanted = true;
          t.seen = updates;
          // nearest first; the closest zoom level after the one below it
          t.priority = Math.hypot(t.mesh.position.x - cx, t.mesh.position.z - cz) + (ring.zoom - 18) * 160;
          if (t.state === 'idle' && !queue.includes(t)) queue.push(t);
        }
      }
    }
    for (const t of tiles.values()) show(t);
    // free the tiles left behind longest ago once there are too many
    const spare = [...tiles.values()].filter((t) => !t.wanted).sort((p, q) => p.seen - q.seen);
    let excess = tiles.size - LEVELS[level].keep;
    for (const t of spare) {
      if (excess <= 0) break;
      if (t.state === 'loading') continue;
      free(t);
      excess--;
    }
    pump();
  };

  return {
    group,
    update(target, camera, viewDist) {
      if (!enabled || !LEVELS[level].rings.length) return;
      // centre a little towards the camera, where the ground is closest and shows the most detail
      const ox = THREE.MathUtils.clamp((camera.x - target.x) * 0.35, -500, 500);
      const oz = THREE.MathUtils.clamp((camera.z - target.z) * 0.35, -500, 500);
      const cx = target.x + ox, cz = target.z + oz;
      const moved = Math.hypot(cx - lastX, cz - lastZ) > 40;
      const zoomed = Math.abs(viewDist - lastDist) / Math.max(1, lastDist) > 0.2;
      if (!moved && !zoomed) return;
      lastX = cx; lastZ = cz; lastDist = viewDist;
      refresh(cx, cz, viewDist);
    },
    setLevel(next) {
      if (next === level) return;
      level = next;
      lastX = Infinity;
      if (!LEVELS[level].rings.length) for (const t of [...tiles.values()]) if (t.state !== 'loading') free(t);
      for (const t of tiles.values()) show(t);
    },
    setEnabled(on) {
      enabled = on;
      group.visible = on;
      if (on) lastX = Infinity;
      for (const t of tiles.values()) show(t);
    },
  };
}
