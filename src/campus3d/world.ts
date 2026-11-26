import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { AreaRec, CampusData } from './data';
import { decodeTrees, hash01, makeRandom, pointInRing, ringArea, ringBox } from './data';

/* ------------------------------------------------------------------ */
/* textures                                                            */
/* ------------------------------------------------------------------ */

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** Soft mottled texture used to break up flat ground colours. Tiles seamlessly. */
function noiseTexture(seed: number, blobs: number, strength: number): THREE.CanvasTexture {
  const S = 256;
  const [c, x] = canvas(S, S);
  x.fillStyle = '#fff';
  x.fillRect(0, 0, S, S);
  const r = makeRandom(seed);
  for (let i = 0; i < blobs; i++) {
    const px = r() * S, py = r() * S, rad = 2 + r() * 16, a = r() * strength;
    const dark = r() < 0.7;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      if (px + ox + rad < 0 || px + ox - rad > S || py + oy + rad < 0 || py + oy - rad > S) continue;
      const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, rad);
      g.addColorStop(0, dark ? `rgba(40,50,30,${a})` : `rgba(255,255,240,${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(px + ox - rad, py + oy - rad, rad * 2, rad * 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 8×8 tile atlas of window bays (one tile = one bay × one floor) plus a matching night-lights map. */
function windowAtlas(kind: 'std' | 'glass', seed: number): { map: THREE.CanvasTexture; lit: THREE.CanvasTexture } {
  const T = 64, N = 8, S = T * N;
  const [c, x] = canvas(S, S);
  const [ce, xe] = canvas(S, S);
  const r = makeRandom(seed);
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, S, S);
  xe.fillStyle = '#000';
  xe.fillRect(0, 0, S, S);
  for (let ty = 0; ty < N; ty++) {
    for (let tx = 0; tx < N; tx++) {
      const ox = tx * T, oy = ty * T;
      const lit = r() < 0.34;
      const warm = r() < 0.8;
      const litCol = warm ? `hsl(${38 + r() * 8}, 95%, ${62 + r() * 12}%)` : `hsl(205, 70%, ${78 + r() * 8}%)`;
      if (kind === 'glass') {
        x.fillStyle = '#7e99aa';
        x.fillRect(ox, oy + 12, T, 44);
        x.fillStyle = 'rgba(255,255,255,0.18)';
        x.fillRect(ox, oy + 12, T, 10);
        x.fillStyle = '#d9dcda';
        x.fillRect(ox + 31, oy + 12, 2, 44);
        if (lit) { xe.fillStyle = litCol; xe.fillRect(ox + 2, oy + 14, T - 4, 40); }
      } else {
        // window rectangle sits between 30% and 72% of the floor height so parapets stay blank
        const wx = 9, ww = 46, wy = 18, wh = 27;
        x.fillStyle = '#d5cfc2';
        x.fillRect(ox + wx - 3, oy + wy + wh, ww + 6, 4); // sill
        x.fillStyle = '#6f8593';
        x.fillRect(ox + wx, oy + wy, ww, wh);
        x.fillStyle = 'rgba(255,255,255,0.22)';
        x.fillRect(ox + wx, oy + wy, ww, 7);
        x.fillStyle = '#e9e6de';
        x.fillRect(ox + wx + ww / 2 - 1, oy + wy, 2, wh);
        if (r() < 0.12) { x.fillStyle = '#58656d'; x.fillRect(ox + wx, oy + wy, ww, wh); } // shutters drawn
        if (lit) { xe.fillStyle = litCol; xe.fillRect(ox + wx + 1, oy + wy + 1, ww - 2, wh - 2); }
      }
    }
  }
  const map = new THREE.CanvasTexture(c);
  const lit = new THREE.CanvasTexture(ce);
  for (const t of [map, lit]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / N, 1 / N);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  }
  return { map, lit };
}

function radialTexture(inner: string, outer: string): THREE.CanvasTexture {
  const [c, x] = canvas(128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/* geometry helpers                                                    */
/* ------------------------------------------------------------------ */

export class GeoBuilder {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  idx: number[] = [];
  /** building index for each triangle, for picking */
  tri: number[] = [];
  get vcount(): number { return this.pos.length / 3; }
  v(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, w: number, c: THREE.Color, f = 1): number {
    this.pos.push(x, y, z);
    this.nor.push(nx, ny, nz);
    this.uv.push(u, w);
    this.col.push(c.r * f, c.g * f, c.b * f);
    return this.vcount - 1;
  }
  t(a: number, b: number, c: number, owner = -1): void {
    this.idx.push(a, b, c);
    this.tri.push(owner);
  }
  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.vcount > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

function toV2(r: number[]): THREE.Vector2[] {
  const out: THREE.Vector2[] = [];
  for (let i = 0; i < r.length; i += 2) out.push(new THREE.Vector2(r[i], r[i + 1]));
  return out;
}
function reversed(r: number[]): number[] {
  const out: number[] = [];
  for (let i = r.length - 2; i >= 0; i -= 2) out.push(r[i], r[i + 1]);
  return out;
}

/** Adds a flat, upward-facing polygon (with holes) to a builder. */
function addFlat(gb: GeoBuilder, outer: number[], holes: number[][] | undefined, y: number, uvScale: number, color: THREE.Color, owner = -1): void {
  const contour = toV2(outer);
  const hs = (holes || []).map(toV2);
  let tris: number[][];
  try {
    tris = THREE.ShapeUtils.triangulateShape(contour, hs);
  } catch {
    return;
  }
  const all = contour.concat(...hs);
  const base = gb.vcount;
  for (const p of all) gb.v(p.x, y, p.y, 0, 1, 0, p.x / uvScale, p.y / uvScale, color);
  for (const [a, b, c] of tris) {
    const A = all[a], B = all[b], C = all[c];
    const cy = (B.y - A.y) * (C.x - A.x) - (B.x - A.x) * (C.y - A.y);
    if (cy >= 0) gb.t(base + a, base + b, base + c, owner);
    else gb.t(base + a, base + c, base + b, owner);
  }
}

/** Adds a flat ribbon following a polyline (roads, paths, water channels). */
export function addRibbon(gb: GeoBuilder, pts: number[], width: number, y: number, color: THREE.Color): void {
  const n = pts.length / 2;
  if (n < 2) return;
  const half = width / 2;
  const L: number[] = [], R: number[] = [];
  for (let i = 0; i < n; i++) {
    const px = pts[i * 2], pz = pts[i * 2 + 1];
    let dx0 = 0, dz0 = 0, dx1 = 0, dz1 = 0;
    if (i > 0) { dx0 = px - pts[i * 2 - 2]; dz0 = pz - pts[i * 2 - 1]; const l = Math.hypot(dx0, dz0) || 1; dx0 /= l; dz0 /= l; }
    if (i < n - 1) { dx1 = pts[i * 2 + 2] - px; dz1 = pts[i * 2 + 3] - pz; const l = Math.hypot(dx1, dz1) || 1; dx1 /= l; dz1 /= l; }
    if (i === 0) { dx0 = dx1; dz0 = dz1; }
    if (i === n - 1) { dx1 = dx0; dz1 = dz0; }
    let tx = dx0 + dx1, tz = dz0 + dz1;
    const tl = Math.hypot(tx, tz);
    if (tl < 1e-6) { tx = dx1; tz = dz1; } else { tx /= tl; tz /= tl; }
    const nx = -tz, nz = tx;
    const dot = nx * -dz0 + nz * dx0;
    const m = half / Math.max(0.35, Math.abs(dot));
    L.push(px + nx * m, pz + nz * m);
    R.push(px - nx * m, pz - nz * m);
  }
  const base = gb.vcount;
  for (let i = 0; i < n; i++) {
    gb.v(L[i * 2], y, L[i * 2 + 1], 0, 1, 0, 0, 0, color);
    gb.v(R[i * 2], y, R[i * 2 + 1], 0, 1, 0, 0, 0, color);
  }
  for (let i = 0; i < n - 1; i++) {
    const a = base + i * 2, b = a + 1, c = a + 2, d = a + 3;
    const ax = gb.pos[a * 3], az = gb.pos[a * 3 + 2], bx = gb.pos[b * 3], bz = gb.pos[b * 3 + 2], cx = gb.pos[c * 3], cz = gb.pos[c * 3 + 2];
    const cy = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    if (cy >= 0) { gb.t(a, b, c); gb.t(b, d, c); } else { gb.t(a, c, b); gb.t(b, c, d); }
  }
}

function decalMaterial(color: number, layer: number, map?: THREE.Texture): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, map, polygonOffset: true, polygonOffsetFactor: -1 - layer, polygonOffsetUnits: -2 - layer * 2 });
}

/* ------------------------------------------------------------------ */
/* ground, areas, water                                                */
/* ------------------------------------------------------------------ */

export interface Ground {
  group: THREE.Group;
  waterMat: THREE.MeshPhongMaterial;
  wallMeshes: THREE.Object3D[];
}

const AREA_STYLE: Record<string, { color: number; layer: number; y: number; uv: number }> = {
  urban: { color: 0xc7c2b3, layer: 1, y: 0.02, uv: 60 },
  grass: { color: 0xa9c486, layer: 3, y: 0.05, uv: 30 },
  golf: { color: 0x9cc27b, layer: 3, y: 0.05, uv: 30 },
  wetland: { color: 0x87a37c, layer: 4, y: 0.06, uv: 25 },
  wood: { color: 0x6e8a4e, layer: 4, y: 0.06, uv: 25 },
  orchard: { color: 0x93ab68, layer: 4, y: 0.06, uv: 25 },
  stadium: { color: 0x9cbf74, layer: 5, y: 0.07, uv: 20 },
  paved: { color: 0xbdb8ac, layer: 5, y: 0.07, uv: 20 },
  track: { color: 0xb5603f, layer: 6, y: 0.08, uv: 12 },
  pitch: { color: 0x74a653, layer: 7, y: 0.09, uv: 12 },
};

export function buildGround(data: CampusData): Ground {
  const group = new THREE.Group();
  group.name = 'ground';
  const noise = noiseTexture(5, 1400, 0.14);
  const fine = noiseTexture(9, 2600, 0.09);

  const baseNoise = noise.clone();
  baseNoise.repeat.set(24000 / 90, 24000 / 90);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(24000, 24000), new THREE.MeshLambertMaterial({ color: 0xb4b49a, map: baseNoise }));
  base.rotation.x = -Math.PI / 2;
  base.receiveShadow = true;
  group.add(base);

  const white = new THREE.Color(1, 1, 1);
  const campusGb = new GeoBuilder();
  addFlat(campusGb, data.campus, undefined, 0.03, 30, white);
  const campus = new THREE.Mesh(campusGb.build(), decalMaterial(0x9db87b, 2, fine));
  campus.receiveShadow = true;
  group.add(campus);

  for (const cls of Object.keys(AREA_STYLE)) {
    const list: AreaRec[] = data.areas[cls] || [];
    if (!list.length) continue;
    const st = AREA_STYLE[cls];
    const gb = new GeoBuilder();
    for (const a of list) addFlat(gb, a.p, a.o, st.y, st.uv, white);
    if (!gb.idx.length) continue;
    const m = new THREE.Mesh(gb.build(), decalMaterial(st.color, st.layer, cls === 'urban' ? noise : fine));
    m.receiveShadow = true;
    m.name = 'area-' + cls;
    group.add(m);
  }

  // sports pitch markings
  const lines: number[] = [];
  for (const a of data.areas.pitch || []) {
    const n = a.p.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      lines.push(a.p[i * 2], 0.25, a.p[i * 2 + 1], a.p[j * 2], 0.25, a.p[j * 2 + 1]);
    }
  }
  if (lines.length) {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    group.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xf4f4ee, transparent: true, opacity: 0.85 })));
  }

  // water
  const waterMat = new THREE.MeshPhongMaterial({ color: 0x3f7d94, specular: 0x2c4650, shininess: 38, polygonOffset: true, polygonOffsetFactor: -9, polygonOffsetUnits: -18 });
  const wgb = new GeoBuilder();
  for (const a of data.areas.water || []) addFlat(wgb, a.p, a.o, 0.1, 40, white);
  for (const w of data.waterways) addRibbon(wgb, w.p, w.w, 0.1, white);
  if (wgb.idx.length) {
    const wm = new THREE.Mesh(wgb.build(), waterMat);
    wm.receiveShadow = true;
    wm.name = 'water';
    group.add(wm);
  }

  // a pale band just inside the wall so the campus outline reads from far away
  const edgeGb = new GeoBuilder();
  addRibbon(edgeGb, [...data.campus, data.campus[0], data.campus[1]], 7, 0.2, white);
  const edge = new THREE.Mesh(edgeGb.build(), new THREE.MeshBasicMaterial({ color: 0xf6f0de, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -12, polygonOffsetUnits: -24 }));
  edge.renderOrder = 1;
  edge.name = 'campus-edge';
  group.add(edge);

  // campus boundary wall and other walls
  const wallMeshes: THREE.Object3D[] = [];
  const wallGb = new GeoBuilder();
  const wallCol = new THREE.Color(0xd8cfbb);
  const capCol = new THREE.Color(0xa1442f);
  function wallLine(pts: number[], closed: boolean, h: number): void {
    const n = pts.length / 2;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const j = (i + 1) % n;
      const ax = pts[i * 2], az = pts[i * 2 + 1], bx = pts[j * 2], bz = pts[j * 2 + 1];
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 0.05) continue;
      const nx = -(bz - az) / len, nz = (bx - ax) / len;
      const t = 0.22;
      for (const s of [1, -1]) {
        const ox = nx * t * s, oz = nz * t * s;
        const a0 = wallGb.v(ax + ox, 0, az + oz, nx * s, 0, nz * s, 0, 0, wallCol, 0.78);
        const b0 = wallGb.v(bx + ox, 0, bz + oz, nx * s, 0, nz * s, 0, 0, wallCol, 0.78);
        const b1 = wallGb.v(bx + ox, h, bz + oz, nx * s, 0, nz * s, 0, 0, wallCol);
        const a1 = wallGb.v(ax + ox, h, az + oz, nx * s, 0, nz * s, 0, 0, wallCol);
        // (a0, b0, b1) faces +n, so the +n side uses it and the -n side the mirrored order
        if (s > 0) { wallGb.t(a0, b0, b1); wallGb.t(a0, b1, a1); } else { wallGb.t(a0, a1, b1); wallGb.t(a0, b1, b0); }
      }
      // coping on top; (c0, c1, c2) always faces up for this vertex order
      const c0 = wallGb.v(ax + nx * 0.3, h + 0.12, az + nz * 0.3, 0, 1, 0, 0, 0, capCol);
      const c1 = wallGb.v(bx + nx * 0.3, h + 0.12, bz + nz * 0.3, 0, 1, 0, 0, 0, capCol);
      const c2 = wallGb.v(bx - nx * 0.3, h + 0.12, bz - nz * 0.3, 0, 1, 0, 0, 0, capCol);
      const c3 = wallGb.v(ax - nx * 0.3, h + 0.12, az - nz * 0.3, 0, 1, 0, 0, 0, capCol);
      wallGb.t(c0, c1, c2);
      wallGb.t(c0, c2, c3);
    }
  }
  wallLine(data.campus, true, 2.4);
  for (const w of data.walls) wallLine(w, false, 2.0);
  const walls = new THREE.Mesh(wallGb.build(), new THREE.MeshLambertMaterial({ vertexColors: true }));
  walls.castShadow = true;
  walls.receiveShadow = true;
  walls.name = 'walls';
  group.add(walls);
  wallMeshes.push(walls);

  return { group, waterMat, wallMeshes };
}

/* ------------------------------------------------------------------ */
/* roads                                                               */
/* ------------------------------------------------------------------ */

const ROAD_COL = [0x4b4e51, 0x505356, 0x56595c, 0x5d6063, 0x66696b, 0xa58d68, 0xcbbd9c];

export function buildRoads(data: CampusData): THREE.Group {
  const group = new THREE.Group();
  group.name = 'roads';
  const curb = new GeoBuilder(), asphalt = new GeoBuilder(), paths = new GeoBuilder(), dashes = new GeoBuilder();
  const curbCol = new THREE.Color(0xc9c3b4), dashCol = new THREE.Color(0xf1eee4);
  const cols = ROAD_COL.map((c) => new THREE.Color(c));
  const order = data.roads.map((_, i) => i).sort((a, b) => data.roads[b].c - data.roads[a].c);
  for (const i of order) {
    const r = data.roads[i];
    const pts: number[] = [];
    for (const v of r.v) pts.push(data.rv[v * 2], data.rv[v * 2 + 1]);
    if (r.c >= 5) {
      addRibbon(paths, pts, r.w, 0.13, cols[r.c]);
      continue;
    }
    if (r.c <= 3) addRibbon(curb, pts, r.w + 2.6, 0.11, curbCol);
    addRibbon(asphalt, pts, r.w, 0.15 + (4 - r.c) * 0.004, cols[r.c]);
    if (r.c <= 1) {
      // dashed centre line
      for (let k = 0; k < pts.length / 2 - 1; k++) {
        const ax = pts[k * 2], az = pts[k * 2 + 1], bx = pts[k * 2 + 2], bz = pts[k * 2 + 3];
        const len = Math.hypot(bx - ax, bz - az);
        for (let d = 2; d + 3 < len; d += 9) {
          const s = d / len, e = (d + 3) / len;
          addRibbon(dashes, [ax + (bx - ax) * s, az + (bz - az) * s, ax + (bx - ax) * e, az + (bz - az) * e], 0.25, 0.19, dashCol);
        }
      }
    }
  }
  const mk = (gb: GeoBuilder, layer: number, name: string): void => {
    if (!gb.idx.length) return;
    const m = new THREE.Mesh(gb.build(), new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -10 - layer, polygonOffsetUnits: -20 - layer * 2 }));
    m.receiveShadow = true;
    m.name = name;
    group.add(m);
  };
  mk(curb, 0, 'curbs');
  mk(paths, 1, 'paths');
  mk(asphalt, 2, 'asphalt');
  mk(dashes, 3, 'markings');
  return group;
}

/* ------------------------------------------------------------------ */
/* buildings                                                           */
/* ------------------------------------------------------------------ */

const WALL_PALETTE: number[][] = [
  [0xece5d4, 0xe7dcc3, 0xefe9de, 0xe2d4ba, 0xc97a5a, 0xe9e1cf], // academic
  [0xe9dfca, 0xe3d2b2, 0xddd6ca, 0xd9bb9c, 0xeee7d8], // hostel
  [0xefe6d2, 0xe6dcc6, 0xf0e3c4, 0xe2d1b0, 0xeadfd0], // staff housing
  [0xe8e1d3, 0xe2dccd, 0xdcd3c0], // other campus
  [0xe8e2d6, 0xd9d2c3, 0xefe7d8, 0xcfd6d8, 0xe9d9c0, 0xd6c7b2, 0xf2efe8, 0xc9c1b3, 0xe7d3c8, 0xd5dcc8, 0xf0dcc0], // city
  [0xa9bcc7, 0xb6c6cf, 0x9fb2be], // glass
  [0xe8c9a0, 0xd9a873], // temple
  [0xb9b5ab, 0xa4a9aa, 0xc2b9a6], // shed
];
const ROOF_PALETTE: number[][] = [
  [0xd3d0c8, 0xcac6bc, 0xbfbbb2],
  [0xd0ccc2, 0xc5c1b6],
  [0xd2cec4, 0xb9633f, 0xc6c1b6],
  [0xcdc9bf],
  [0xbab6ad, 0xa9a59d, 0xc7c2b8, 0xb3ada2, 0x5f81a5, 0xc8c3b9],
  [0x8f9ea6, 0xa2acb1],
  [0xc18c55],
  [0x8e9aa0, 0xa7a39a, 0x9b5d48],
];

export interface Buildings {
  group: THREE.Group;
  pickables: THREE.Mesh[];
  /** triangle → building index, per pickable mesh */
  triOwner: Map<THREE.Mesh, Int32Array>;
  litMaterials: THREE.MeshStandardMaterial[];
  /** axis-aligned boxes for quick spatial checks */
  boxes: [number, number, number, number][];
}

export function buildBuildings(data: CampusData, hidden: (i: number) => boolean): Buildings {
  const group = new THREE.Group();
  group.name = 'buildings';
  const walls = new GeoBuilder(), glass = new GeoBuilder(), plain = new GeoBuilder(), roofs = new GeoBuilder();
  const rnd = makeRandom(99);
  const tanks: number[] = [], heads: number[] = [];
  const boxes: [number, number, number, number][] = [];
  const BAY = 3.4, FLOOR = 3.3, PLINTH = 0.8;
  const c = new THREE.Color(), rc = new THREE.Color();

  data.buildings.forEach((b, i) => {
    boxes.push(ringBox(b.p));
    if (hidden(i)) return;
    const hsh = hash01(i * 7 + 3);
    const pal = WALL_PALETTE[b.k] || WALL_PALETTE[3];
    c.setHex(pal[Math.floor(hsh * pal.length)]);
    const rpal = ROOF_PALETTE[b.k] || ROOF_PALETTE[3];
    rc.setHex(rpal[Math.floor(hash01(i * 13 + 5) * rpal.length)]);
    const flatRoof = b.k !== 7 && b.k !== 6;
    const parapet = flatRoof ? (b.k === 4 ? 0.6 : 0.8) : 0;
    const top = b.h + parapet;
    const gb = b.k === 5 ? glass : b.k >= 6 ? plain : walls;
    const floorH = FLOOR;
    const uOff = Math.floor(hsh * 64);
    // v counts floors above the 0.8 m plinth, so plinth and parapet fall on the blank part of a tile
    const vOff = Math.floor(hash01(i * 3 + 1) * 8) - PLINTH / floorH;

    const rings: number[][] = [ringArea(b.p) > 0 ? reversed(b.p) : b.p];
    for (const h of b.o || []) rings.push(ringArea(h) < 0 ? reversed(h) : h);
    for (const ring of rings) {
      const n = ring.length / 2;
      let cum = uOff;
      for (let k = 0; k < n; k++) {
        const j = (k + 1) % n;
        const ax = ring[k * 2], az = ring[k * 2 + 1], bx = ring[j * 2], bz = ring[j * 2 + 1];
        const len = Math.hypot(bx - ax, bz - az);
        if (len < 0.05) continue;
        const nx = -(bz - az) / len, nz = (bx - ax) / len;
        // snap bays so each wall shows whole windows
        const bays = Math.max(1, Math.round(len / BAY));
        const u0 = cum, u1 = cum + bays;
        cum = u1;
        const vt = top / floorH + vOff;
        const a0 = gb.v(ax, 0, az, nx, 0, nz, u0, vOff, c, 0.8);
        const b0 = gb.v(bx, 0, bz, nx, 0, nz, u1, vOff, c, 0.8);
        const b1 = gb.v(bx, top, bz, nx, 0, nz, u1, vt, c);
        const a1 = gb.v(ax, top, az, nx, 0, nz, u0, vt, c);
        gb.t(a0, b0, b1, i);
        gb.t(a0, b1, a1, i);
      }
    }
    addFlat(roofs, b.p, b.o, b.h, 8, rc, i);

    // rooftop water tanks and stair rooms
    const area = Math.abs(ringArea(b.p));
    if (flatRoof && area > 90) {
      const box = boxes[i];
      const want = area < 400 ? 1 : area < 1500 ? 2 : 3;
      let made = 0;
      for (let tries = 0; tries < want * 8 && made < want; tries++) {
        const x = box[0] + rnd() * (box[2] - box[0]), z = box[1] + rnd() * (box[3] - box[1]);
        if (!pointInRing(x, z, b.p) || !pointInRing(x + 1.6, z, b.p) || !pointInRing(x - 1.6, z, b.p) || !pointInRing(x, z + 1.6, b.p) || !pointInRing(x, z - 1.6, b.p)) continue;
        if (b.o && b.o.some((h) => pointInRing(x, z, h))) continue;
        tanks.push(x, b.h, z, rnd());
        made++;
      }
      if (area > 320) {
        for (let tries = 0; tries < 10; tries++) {
          const x = box[0] + rnd() * (box[2] - box[0]), z = box[1] + rnd() * (box[3] - box[1]);
          if (!pointInRing(x, z, b.p) || !pointInRing(x + 2.5, z + 2.5, b.p) || !pointInRing(x - 2.5, z - 2.5, b.p) || !pointInRing(x + 2.5, z - 2.5, b.p) || !pointInRing(x - 2.5, z + 2.5, b.p)) continue;
          heads.push(x, b.h, z, c.getHex());
          break;
        }
      }
    }
  });

  const std = windowAtlas('std', 4);
  const gl = windowAtlas('glass', 8);
  const wallMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: std.map, emissive: 0xffffff, emissiveMap: std.lit, emissiveIntensity: 0, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  const glassMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: gl.map, emissive: 0xffffff, emissiveMap: gl.lit, emissiveIntensity: 0, roughness: 0.35, metalness: 0.25, side: THREE.DoubleSide });
  const plainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide });
  const roofMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });

  const pickables: THREE.Mesh[] = [];
  const triOwner = new Map<THREE.Mesh, Int32Array>();
  for (const [gb, mat, name] of [[walls, wallMat, 'walls'], [glass, glassMat, 'glass'], [plain, plainMat, 'plain'], [roofs, roofMat, 'roofs']] as const) {
    if (!gb.idx.length) continue;
    const m = new THREE.Mesh(gb.build(), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = 'b-' + name;
    group.add(m);
    pickables.push(m);
    triOwner.set(m, Int32Array.from(gb.tri));
  }

  // rooftop tanks (black, white and blue, as on Chennai roofs)
  if (tanks.length) {
    const count = tanks.length / 4;
    const geo = new THREE.CylinderGeometry(0.75, 0.75, 1.4, 10);
    geo.translate(0, 0.7, 0);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), count);
    const o = new THREE.Object3D(), col = new THREE.Color();
    for (let k = 0; k < count; k++) {
      const v = tanks[k * 4 + 3];
      o.position.set(tanks[k * 4], tanks[k * 4 + 1], tanks[k * 4 + 2]);
      o.scale.setScalar(v < 0.2 ? 1.3 : 1);
      o.updateMatrix();
      im.setMatrixAt(k, o.matrix);
      im.setColorAt(k, col.setHex(v < 0.72 ? 0x26282a : v < 0.88 ? 0xe9e7df : 0x3d6fa3));
    }
    im.castShadow = true;
    im.name = 'tanks';
    group.add(im);
  }
  if (heads.length) {
    const count = heads.length / 4;
    const geo = new THREE.BoxGeometry(3.2, 2.7, 3.4);
    geo.translate(0, 1.35, 0);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), count);
    const o = new THREE.Object3D(), col = new THREE.Color();
    for (let k = 0; k < count; k++) {
      o.position.set(heads[k * 4], heads[k * 4 + 1], heads[k * 4 + 2]);
      o.rotation.y = hash01(k) * Math.PI;
      o.updateMatrix();
      im.setMatrixAt(k, o.matrix);
      im.setColorAt(k, col.setHex(heads[k * 4 + 3]).multiplyScalar(0.95));
    }
    im.castShadow = true;
    im.name = 'stair-rooms';
    group.add(im);
  }

  return { group, pickables, triOwner, litMaterials: [wallMat, glassMat], boxes };
}

/* ------------------------------------------------------------------ */
/* trees                                                               */
/* ------------------------------------------------------------------ */

function nonIndexed(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const list = gs.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k);
    return n;
  });
  return mergeGeometries(list)!;
}
function at<T extends THREE.BufferGeometry>(g: T, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, ry = 0): T {
  g.scale(sx, sy, sz);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return g;
}

export function crownGeometry(type: number): THREE.BufferGeometry {
  switch (type) {
    case 0: // broadleaf: neem, mango
      return nonIndexed([at(new THREE.IcosahedronGeometry(2.7, 0), 0, 5.6, 0, 1, 0.85, 1), at(new THREE.IcosahedronGeometry(2.1, 0), 1.3, 5.0, 0.6, 1, 0.9, 1, 0.7)]);
    case 1: // rain tree: wide umbrella
      return nonIndexed([at(new THREE.IcosahedronGeometry(3.6, 1), 0, 6.4, 0, 1.55, 0.5, 1.45)]);
    case 2: { // coconut palm fronds
      const pos: number[] = [];
      const top = 8.6;
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2 + (k % 2) * 0.2;
        const ca = Math.cos(a), sa = Math.sin(a), px = -sa, pz = ca;
        const p0 = [0, top, 0], p1 = [ca * 1.9, top + 0.55, sa * 1.9], p2 = [ca * 3.6, top - 0.9, sa * 3.6];
        const w1 = 0.6, w2 = 0.12;
        const l1 = [p1[0] + px * w1, p1[1], p1[2] + pz * w1], r1 = [p1[0] - px * w1, p1[1], p1[2] - pz * w1];
        const l2 = [p2[0] + px * w2, p2[1], p2[2] + pz * w2], r2 = [p2[0] - px * w2, p2[1], p2[2] - pz * w2];
        pos.push(...p0, ...l1, ...r1, ...l1, ...l2, ...r1, ...r1, ...l2, ...r2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      return g;
    }
    case 3: // conical: ashoka, casuarina
      return nonIndexed([at(new THREE.ConeGeometry(1.9, 5.4, 7), 0, 5.0, 0), at(new THREE.ConeGeometry(1.35, 3.4, 7), 0, 7.4, 0)]);
    default: // tall round: mahogany, peepal
      return nonIndexed([at(new THREE.IcosahedronGeometry(2.4, 0), 0, 8.2, 0, 1, 1.4, 1), at(new THREE.IcosahedronGeometry(1.8, 0), 0.6, 10.3, -0.3, 1, 1.1, 1, 0.5)]);
  }
}
export function trunkGeometry(type: number): THREE.BufferGeometry {
  const h = type === 2 ? 8.8 : type === 4 ? 7 : type === 3 ? 3 : type === 1 ? 5 : 4.6;
  const g = new THREE.CylinderGeometry(type === 2 ? 0.17 : 0.24, type === 2 ? 0.27 : 0.42, h, 5, 1, true);
  g.translate(0, h / 2, 0);
  return nonIndexed([g]);
}

const CROWN_HSL: [number, number, number, number][] = [
  // h, s, l, lRange
  [0.27, 0.42, 0.27, 0.1],
  [0.24, 0.45, 0.32, 0.08],
  [0.2, 0.5, 0.36, 0.08],
  [0.33, 0.38, 0.22, 0.07],
  [0.29, 0.4, 0.25, 0.08],
];
const BLOSSOM = [0xe0632a, 0xe8c547, 0xe58fb0, 0xd9452b];

export interface Trees {
  group: THREE.Group;
  meshes: THREE.InstancedMesh[];
  shadowCasters: THREE.InstancedMesh[];
  totals: Map<THREE.InstancedMesh, number>;
  setDensity(f: number): void;
}

export function buildTrees(data: CampusData, excluded: (x: number, z: number) => boolean): Trees {
  const group = new THREE.Group();
  group.name = 'trees';
  const raw = decodeTrees(data.trees);
  // buckets[type][campus] → list of tree indices
  const buckets: number[][][] = [0, 1, 2, 3, 4].map(() => [[], []]);
  for (let i = 0; i < raw.length; i += 3) {
    const x = raw[i] / 10, z = raw[i + 1] / 10;
    if (excluded(x, z)) continue;
    const p = raw[i + 2];
    buckets[(p >> 6) & 7]?.[(p >> 9) & 1]?.push(i);
  }
  const crownMat = new THREE.MeshLambertMaterial({ flatShading: true });
  const palmMat = new THREE.MeshLambertMaterial({ flatShading: true, side: THREE.DoubleSide });
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const meshes: THREE.InstancedMesh[] = [];
  const shadowCasters: THREE.InstancedMesh[] = [];
  const totals = new Map<THREE.InstancedMesh, number>();
  const o = new THREE.Object3D();
  const col = new THREE.Color();
  for (let type = 0; type < 5; type++) {
    const crownGeo = crownGeometry(type), trunkGeo = trunkGeometry(type);
    for (let campus = 0; campus < 2; campus++) {
      const list = buckets[type][campus];
      if (!list.length) continue;
      const crowns = new THREE.InstancedMesh(crownGeo, type === 2 ? palmMat : crownMat, list.length);
      const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, list.length);
      list.forEach((ri, k) => {
        const x = raw[ri] / 10, z = raw[ri + 1] / 10, p = raw[ri + 2];
        const s = 0.6 + (p & 63) * 0.02;
        const h = hash01(ri);
        o.position.set(x, 0, z);
        o.rotation.set(0, h * Math.PI * 2, 0);
        o.scale.set(s * (0.92 + h * 0.16), s * (0.9 + hash01(ri + 1) * 0.25), s * (0.92 + (1 - h) * 0.16));
        o.updateMatrix();
        crowns.setMatrixAt(k, o.matrix);
        trunks.setMatrixAt(k, o.matrix);
        const [hh, ss, ll, lr] = CROWN_HSL[type];
        if ((type === 1 || type === 0) && hash01(ri + 7) < 0.035) col.setHex(BLOSSOM[Math.floor(hash01(ri + 9) * BLOSSOM.length)]);
        else col.setHSL(hh + (hash01(ri + 3) - 0.5) * 0.04, ss, ll + (hash01(ri + 5) - 0.5) * lr);
        crowns.setColorAt(k, col);
        trunks.setColorAt(k, col.setHSL(0.07, 0.3, 0.24 + hash01(ri + 11) * 0.1));
      });
      crowns.castShadow = campus === 1;
      trunks.castShadow = false;
      crowns.name = `trees-${type}-${campus}`;
      for (const m of [crowns, trunks]) {
        m.computeBoundingSphere();
        group.add(m);
        meshes.push(m);
        totals.set(m, list.length);
      }
      if (campus === 1) shadowCasters.push(crowns);
    }
  }
  return {
    group, meshes, shadowCasters, totals,
    setDensity(f: number) {
      for (const m of meshes) m.count = Math.max(0, Math.floor((totals.get(m) || 0) * f));
    },
  };
}

/* ------------------------------------------------------------------ */
/* deer                                                                */
/* ------------------------------------------------------------------ */

export interface Deer {
  mesh: THREE.InstancedMesh;
  update(dt: number): void;
}

export function buildDeer(data: CampusData): Deer {
  const parts: THREE.BufferGeometry[] = [
    at(new THREE.BoxGeometry(1.25, 0.62, 0.46), 0, 1.02, 0), // body
    at(new THREE.BoxGeometry(0.28, 0.62, 0.24), 0.62, 1.42, 0, 1, 1, 1), // neck
    at(new THREE.BoxGeometry(0.5, 0.26, 0.24), 0.86, 1.74, 0), // head
    at(new THREE.BoxGeometry(0.08, 0.2, 0.06), 0.72, 1.92, 0.1), // ear
    at(new THREE.BoxGeometry(0.08, 0.2, 0.06), 0.72, 1.92, -0.1),
    at(new THREE.BoxGeometry(0.06, 0.42, 0.06), 0.66, 2.1, 0.08), // horns
    at(new THREE.BoxGeometry(0.06, 0.42, 0.06), 0.66, 2.1, -0.08),
    at(new THREE.BoxGeometry(0.12, 0.2, 0.1), -0.66, 1.14, 0), // tail
  ];
  for (const [lx, lz] of [[0.45, 0.15], [0.45, -0.15], [-0.45, 0.15], [-0.45, -0.15]]) parts.push(at(new THREE.BoxGeometry(0.1, 0.78, 0.1), lx, 0.39, lz));
  const geo = nonIndexed(parts);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial(), data.deer.length);
  mesh.castShadow = true;
  mesh.name = 'deer';
  const state = data.deer.map(([x, z, h, dark], i) => ({ x, z, ox: x, oz: z, h, dark, walk: 0, wait: 2 + hash01(i) * 8, speed: 0.6 + hash01(i + 4) * 0.5 }));
  const o = new THREE.Object3D(), col = new THREE.Color();
  const place = (i: number): void => {
    const s = state[i];
    o.position.set(s.x, 0, s.z);
    o.rotation.set(0, s.h, 0);
    o.scale.setScalar(s.dark ? 1.05 : 0.95);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  };
  state.forEach((s, i) => {
    place(i);
    mesh.setColorAt(i, col.setHex(s.dark ? 0x3b2f27 : i % 3 ? 0xb3743d : 0xc08a52));
  });
  const rnd = makeRandom(31);
  return {
    mesh,
    update(dt: number) {
      for (let i = 0; i < state.length; i++) {
        const s = state[i];
        if (s.walk > 0) {
          s.walk -= dt;
          // heading: rotation.y = h, local +x is forward → world dir (cos h, -sin h)
          s.x += Math.cos(s.h) * s.speed * dt;
          s.z -= Math.sin(s.h) * s.speed * dt;
          place(i);
        } else if ((s.wait -= dt) <= 0) {
          const back = Math.hypot(s.x - s.ox, s.z - s.oz) > 9;
          s.h = back ? Math.atan2(-(s.oz - s.z), s.ox - s.x) : s.h + (rnd() - 0.5) * 2.2;
          s.walk = 1.5 + rnd() * 3;
          s.wait = 3 + rnd() * 9;
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/* ------------------------------------------------------------------ */
/* street lamps                                                        */
/* ------------------------------------------------------------------ */

export interface Lamps {
  group: THREE.Group;
  setNight(f: number): void;
}

export function buildLamps(data: CampusData, inCampus: (x: number, z: number) => boolean): Lamps {
  const spots: number[] = [];
  for (const r of data.roads) {
    if (r.c > 4) continue;
    const inside = r.c <= 1 || r.v.some((v) => inCampus(data.rv[v * 2], data.rv[v * 2 + 1]));
    if (!inside) continue;
    const off = r.w / 2 + 1.1;
    let carry = 12, side = 1;
    for (let i = 0; i < r.v.length - 1; i++) {
      const ax = data.rv[r.v[i] * 2], az = data.rv[r.v[i] * 2 + 1], bx = data.rv[r.v[i + 1] * 2], bz = data.rv[r.v[i + 1] * 2 + 1];
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 0.5) continue;
      const nx = -(bz - az) / len, nz = (bx - ax) / len;
      let d = carry;
      while (d < len) {
        const px = ax + ((bx - ax) * d) / len, pz = az + ((bz - az) * d) / len;
        spots.push(px + nx * off * side, pz + nz * off * side, Math.atan2(-nz * side, nx * side) + Math.PI);
        if (r.c > 1) side = -side;
        d += r.c <= 1 ? 30 : 34;
      }
      carry = d - len;
    }
  }
  const n = spots.length / 3;
  const group = new THREE.Group();
  group.name = 'lamps';
  const pole = new THREE.CylinderGeometry(0.08, 0.12, 6, 5);
  pole.translate(0, 3, 0);
  const arm = new THREE.BoxGeometry(1.2, 0.08, 0.08);
  arm.translate(0.55, 5.95, 0);
  const poleGeo = nonIndexed([pole, arm]);
  const headGeo = new THREE.BoxGeometry(0.55, 0.16, 0.3);
  headGeo.translate(1.1, 5.86, 0);
  const poles = new THREE.InstancedMesh(poleGeo, new THREE.MeshLambertMaterial({ color: 0x4f5558 }), n);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xdcdad2, emissive: 0xffd590, emissiveIntensity: 0 });
  const headsM = new THREE.InstancedMesh(headGeo, headMat, n);
  const poolTex = radialTexture('rgba(255,214,150,0.9)', 'rgba(255,190,110,0)');
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -20, polygonOffsetUnits: -40 });
  const poolGeo = new THREE.PlaneGeometry(13, 13);
  poolGeo.rotateX(-Math.PI / 2);
  const pools = new THREE.InstancedMesh(poolGeo, poolMat, n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    o.position.set(spots[i * 3], 0, spots[i * 3 + 1]);
    o.rotation.set(0, spots[i * 3 + 2], 0);
    o.scale.setScalar(1);
    o.updateMatrix();
    poles.setMatrixAt(i, o.matrix);
    headsM.setMatrixAt(i, o.matrix);
    // pool sits under the lamp head
    const hx = spots[i * 3] + Math.cos(spots[i * 3 + 2]) * 1.1, hz = spots[i * 3 + 1] - Math.sin(spots[i * 3 + 2]) * 1.1;
    o.position.set(hx, 0.3, hz);
    o.rotation.set(0, 0, 0);
    o.updateMatrix();
    pools.setMatrixAt(i, o.matrix);
  }
  poles.castShadow = true;
  pools.renderOrder = 2;
  group.add(poles, headsM, pools);
  return {
    group,
    setNight(f: number) {
      headMat.emissiveIntensity = f * 2.2;
      poolMat.opacity = f * 0.55;
      pools.visible = f > 0.02;
    },
  };
}
