/**
 * Satellite imagery for the 3D campus. Web Mercator tiles are fetched in the browser at view time
 * (nothing is stored in the repository), stitched into one canvas texture, and mapped onto a ground
 * sheet and the building roofs using each vertex's real latitude and longitude.
 */
import * as THREE from 'three';
import type { CampusData } from './data';
import { fromLatLon, toLatLon } from './data';

export const SATELLITE = {
  name: 'Esri World Imagery',
  attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
  hosts: ['https://server.arcgisonline.com', 'https://services.arcgisonline.com'],
  url: (host: string, z: number, x: number, y: number): string => `${host}/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
};

const tileX = (lon: number, n: number): number => ((lon + 180) / 360) * n;
const tileY = (lat: number, n: number): number => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
};
const tileLat = (y: number, n: number): number => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
const tileLon = (x: number, n: number): number => (x / n) * 360 - 180;

export interface Satellite {
  texture: THREE.CanvasTexture;
  /** ground sheet covering the imagery */
  ground: THREE.Mesh;
  /** texture coordinates for a world position */
  uvAt(x: number, z: number): [number, number];
  /** resolves when every tile has been tried; the value is the share that loaded (0..1) */
  done: Promise<number>;
  cancel(): void;
}

/** Picks the most detailed zoom whose stitched image fits the GPU and a pixel budget. */
export function pickZoom(data: CampusData, maxTexture: number, maxPixels: number, maxZoom = 17): number {
  const [x0, z0, x1, z1] = data.meta.bounds;
  const nw = toLatLon(data, x0, z0), se = toLatLon(data, x1, z1);
  for (let z = maxZoom; z >= 13; z--) {
    const n = 2 ** z;
    const w = (Math.floor(tileX(se.lon, n)) - Math.floor(tileX(nw.lon, n)) + 1) * 256;
    const h = (Math.floor(tileY(se.lat, n)) - Math.floor(tileY(nw.lat, n)) + 1) * 256;
    if (w <= maxTexture && h <= maxTexture && w * h <= maxPixels) return z;
  }
  return 13;
}

export function loadSatellite(data: CampusData, zoom: number, onProgress: (f: number) => void, maxAnisotropy = 8): Satellite {
  const n = 2 ** zoom;
  const [bx0, bz0, bx1, bz1] = data.meta.bounds;
  const nw = toLatLon(data, bx0, bz0), se = toLatLon(data, bx1, bz1);
  const tx0 = Math.floor(tileX(nw.lon, n)), tx1 = Math.floor(tileX(se.lon, n));
  const ty0 = Math.floor(tileY(nw.lat, n)), ty1 = Math.floor(tileY(se.lat, n));
  const cols = tx1 - tx0 + 1, rows = ty1 - ty0 + 1;

  const canvas = document.createElement('canvas');
  canvas.width = cols * 256;
  canvas.height = rows * 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#7f8f6a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;

  const uvAt = (x: number, z: number): [number, number] => {
    const ll = toLatLon(data, x, z);
    return [(tileX(ll.lon, n) - tx0) / cols, 1 - (tileY(ll.lat, n) - ty0) / rows];
  };

  // ground sheet: a subdivided plane whose vertices sit on the imagery's real positions
  const a = fromLatLon(data, tileLat(ty0, n), tileLon(tx0, n));
  const b = fromLatLon(data, tileLat(ty1 + 1, n), tileLon(tx1 + 1, n));
  const seg = 48;
  const geo = new THREE.PlaneGeometry(b.x - a.x, b.z - a.z, seg, seg);
  geo.rotateX(-Math.PI / 2);
  geo.translate((a.x + b.x) / 2, 0, (a.z + b.z) / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const [u, v] = uvAt(pos.getX(i), pos.getZ(i));
    uv.setXY(i, u, v);
  }
  // PlaneGeometry rotated by −90° about x faces up already
  const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: texture, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
  ground.position.y = 0.04;
  ground.receiveShadow = true;
  ground.name = 'satellite-ground';

  // fetch tiles, centre first, a few at a time, spread over both hosts
  const queue: [number, number][] = [];
  for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) queue.push([x, y]);
  const cx = (tx0 + tx1) / 2, cy = (ty0 + ty1) / 2;
  queue.sort((p, q) => Math.hypot(p[0] - cx, p[1] - cy) - Math.hypot(q[0] - cx, q[1] - cy));
  const total = queue.length;
  let finished = 0, loaded = 0, cancelled = false, dirty = false;
  const controller = new AbortController();
  const flush = window.setInterval(() => { if (dirty) { texture.needsUpdate = true; dirty = false; } }, 700);

  const worker = async (slot: number): Promise<void> => {
    while (queue.length && !cancelled) {
      const [x, y] = queue.shift()!;
      try {
        const res = await fetch(SATELLITE.url(SATELLITE.hosts[slot % SATELLITE.hosts.length], zoom, x, y), { signal: controller.signal, mode: 'cors' });
        if (res.ok) {
          const bmp = await createImageBitmap(await res.blob());
          ctx.drawImage(bmp, (x - tx0) * 256, (y - ty0) * 256);
          bmp.close();
          loaded++;
          dirty = true;
        }
      } catch {
        if (cancelled) return;
      }
      finished++;
      onProgress(finished / total);
    }
  };
  const done = Promise.all(Array.from({ length: 8 }, (_, i) => worker(i))).then(() => {
    window.clearInterval(flush);
    if (!cancelled) texture.needsUpdate = true;
    return total ? loaded / total : 0;
  });

  return {
    texture, ground, uvAt, done,
    cancel() { cancelled = true; controller.abort(); window.clearInterval(flush); },
  };
}

/** Writes satellite texture coordinates into a geometry's uv attribute (for the roofs). */
export function applySatelliteUVs(geo: THREE.BufferGeometry, sat: Satellite): void {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const [u, v] = sat.uvAt(pos.getX(i), pos.getZ(i));
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
