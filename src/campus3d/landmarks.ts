import * as THREE from 'three';
import type { CampusData, NamedRec } from './data';
import { fromLatLon, ringArea, ringBox, ringCentroid } from './data';
import { LOCATIONS, VERIFIED_IITM_UPCOMING_DESTINATIONS } from '../constants/locations';
import { MAIN_GATE, mainGateNode } from './gate';

export type PlaceKind = 'study' | 'soon' | 'major' | 'hostel' | 'building' | 'minor' | 'area' | 'poi' | 'district' | 'road';

/** Directory tabs, in order. 'all' lists every place a visitor can pick. */
export const CATEGORIES: { id: string; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: '#1f2d26' },
  { id: 'study', label: 'Study spots', color: '#10b981' },
  { id: 'aca', label: 'Academic', color: '#3b82f6' },
  { id: 'hos', label: 'Hostels', color: '#8b6bd1' },
  { id: 'food', label: 'Food', color: '#e0742f' },
  { id: 'spo', label: 'Sports', color: '#16a34a' },
  { id: 'svc', label: 'Services', color: '#0ea5a4' },
  { id: 'res', label: 'Residences', color: '#c08a3e' },
  { id: 'lmk', label: 'Landmarks', color: '#d14d8f' },
  { id: 'utl', label: 'Utilities', color: '#8a97a3' },
  { id: 'oth', label: 'Other', color: '#64748b' },
  { id: 'out', label: 'Outside campus', color: '#9aa3a0' },
];
export const CATEGORY_COLOR: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.color]));
export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

export interface Place {
  id: string;
  name: string;
  tag: string;
  text: string;
  x: number;
  z: number;
  /** label anchor height */
  h: number;
  kind: PlaceKind;
  icon?: string;
  /** app location id for study spots */
  studyId?: string;
  building?: number;
  radius: number;
  floors?: number;
  floorsFromMap?: boolean;
  outside?: boolean;
  badge?: string;
  /** directory category id (see CATEGORIES) */
  cat?: string;
}

/* ------------------------------------------------------------------ */
/* materials and small helpers                                         */
/* ------------------------------------------------------------------ */

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, rough = 0.85, metal = 0): THREE.MeshStandardMaterial {
  const k = color + ':' + rough + ':' + metal;
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    matCache.set(k, m);
  }
  return m;
}
function add(g: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, cast = true): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}
function box(g: THREE.Object3D, w: number, h: number, d: number, color: number, x: number, y: number, z: number): THREE.Mesh {
  return add(g, new THREE.BoxGeometry(w, h, d), mat(color), x, y + h / 2, z);
}
function cyl(g: THREE.Object3D, rt: number, rb: number, h: number, color: number, x: number, y: number, z: number, seg = 20): THREE.Mesh {
  return add(g, new THREE.CylinderGeometry(rt, rb, h, seg), mat(color), x, y + h / 2, z);
}

export function textPlane(w: number, h: number, lines: string[], color: string, bg?: string): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 1400;
  c.height = Math.round((1400 * h) / w);
  const x = c.getContext('2d')!;
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  const n = lines.length;
  let size = Math.floor((c.height / n) * 0.6);
  const font = (s: number): string => `700 ${s}px "Josefin Sans", system-ui, sans-serif`;
  for (const t of lines) { x.font = font(size); while (x.measureText(t).width > c.width * 0.92 && size > 16) { size -= 4; x.font = font(size); } }
  x.font = font(size);
  x.fillStyle = color;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  lines.forEach((t, i) => x.fillText(t, c.width / 2, (c.height * (i + 0.5)) / n));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.15, roughness: 0.6 }));
}

function palm(g: THREE.Object3D, x: number, z: number, s: number): void {
  add(g, new THREE.CylinderGeometry(0.16 * s, 0.28 * s, 6.5 * s, 7), mat(0x7a6650), x, 3.25 * s, z);
  for (let k = 0; k < 9; k++) {
    const piv = new THREE.Group();
    piv.position.set(x, 6.5 * s, z);
    piv.rotation.y = (k * Math.PI * 2) / 9;
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.42 * s, 0.08, 3.0 * s), mat(k % 2 ? 0x3f8a3a : 0x52a04a));
    fr.position.set(0, -0.35 * s, 1.35 * s);
    fr.rotation.x = 0.45;
    fr.castShadow = true;
    piv.add(fr);
    g.add(piv);
  }
}
function hedge(g: THREE.Object3D, x: number, z: number, sx: number, sy: number, sz: number, color: number): void {
  const m = add(g, new THREE.SphereGeometry(1, 12, 8), mat(color, 0.95), x, sy * 0.6, z);
  m.scale.set(sx, sy, sz);
}

/* ------------------------------------------------------------------ */
/* Main Gate                                                           */
/* ------------------------------------------------------------------ */

export interface GateControl {
  setImage(img: HTMLImageElement): void;
  reset(): void;
}

/**
 * The Main Gate, origin at the centre of the median on the wall line, local +z facing out to
 * Sardar Patel Road, local x across the two lanes. Layout from satellite imagery, sign details
 * from photographs (see gate.ts).
 */
function buildMainGate(glow: THREE.MeshStandardMaterial[]): { group: THREE.Group; emblem: GateControl } {
  const g = new THREE.Group();
  const pink = 0xb97874, maroon = 0x7d2a36, white = 0xf3efe6, slate = 0x6d7b87, brick = 0x8a3b36;
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, emissive: 0xfff0c0, emissiveIntensity: 0 });
  const warmMat = new THREE.MeshStandardMaterial({ color: 0x7a5a30, emissive: 0xffc27a, emissiveIntensity: 0 });
  glow.push(lampMat, warmMat);
  const lane = MAIN_GATE.laneWidth, inner = 7.9, outer = inner + 1.2 + lane + 1.2;

  // planted median with its kerb
  box(g, inner * 2 - 0.6, 0.35, 9, 0xcfc8b8, 0, 0, -1.5);
  box(g, inner * 2 - 1.2, 0.4, 8.4, 0x6f9c55, 0, 0.02, -1.5);

  // the name sign, facing the road, scaled to the median
  const sign = new THREE.Group();
  sign.position.set(0, 0.35, 0.6);
  sign.scale.setScalar(0.8);
  g.add(sign);
  box(sign, 19, 0.7, 3.4, 0xcdc6b6, 0, 0, 0);
  box(sign, 14.4, 8.6, 0.9, pink, 0, 0.7, -0.3);
  for (const px of [-7.7, 7.7]) box(sign, 1.2, 9.2, 2.2, white, px, 0.7, 0.3);
  box(sign, 17.6, 1.1, 2.6, white, 0, 9.9, 0.2);
  box(sign, 15.4, 1.2, 1.8, maroon, 0, 11.0, 0);
  box(sign, 18.2, 0.9, 2.9, white, 0, 12.2, 0.2);
  box(sign, 17.0, 0.6, 2.4, slate, 0, 13.1, 0.1);
  box(sign, 14.5, 0.5, 1.8, slate, 0, 13.7, 0.1);
  const t = textPlane(12.6, 3.6, ['Indian Institute of Technology', 'Madras'], '#e0cc74');
  t.position.set(0, 6.9, 0.2);
  sign.add(t);
  for (const ux of [-4.2, 4.2]) {
    const u = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 0.35), warmMat);
    u.position.set(ux, 0.85, 0.45);
    sign.add(u);
  }
  for (const p of [[-10.2, -2.2, 1.15], [10.2, -2.2, 1.15], [-6.5, -5.5, 0.95], [6.5, -5.5, 0.95]]) palm(sign, p[0], p[1], p[2]);
  for (let hx = -8; hx <= 8; hx += 2.6) hedge(sign, hx, 2.6, 1.5, 0.85, 1.0, 0x9fb3a8);

  // The IIT Madras seal, as on the real sign: a gold relief on the granite. The artwork is
  // "IIT Madras Logo (Black and White).svg" by IIT Madras via Wikimedia Commons, CC BY-SA 4.0,
  // shipped in public/brand and recoloured gold here (the recoloured seal is under the same licence).
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  /** the image tinted with a fill style, on a scratch canvas */
  const tinted = (img: CanvasImageSource, fill: string | CanvasGradient, size: number): HTMLCanvasElement => {
    const t = document.createElement('canvas');
    t.width = t.height = S;
    const tx = t.getContext('2d')!;
    tx.drawImage(img, (S - size) / 2, (S - size) / 2, size, size);
    tx.globalCompositeOperation = 'source-in';
    tx.fillStyle = fill;
    tx.fillRect(0, 0, S, S);
    return t;
  };
  /** draws a layer several times in a small ring so its thin lines read from a distance */
  const bold = (layer: HTMLCanvasElement, ox: number, oy: number, r: number): void => {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      x.drawImage(layer, ox + Math.cos(a) * r, oy + Math.sin(a) * r);
    }
    x.drawImage(layer, ox, oy);
  };
  const gold = (): CanvasGradient => {
    const g = x.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#fbe9ad');
    g.addColorStop(0.45, '#e2bf68');
    g.addColorStop(0.7, '#c99f4c');
    g.addColorStop(1, '#f2da92');
    return g;
  };
  const seal = new Image();
  let sealReady = false;
  const drawDefault = (): void => {
    x.clearRect(0, 0, S, S);
    if (sealReady) {
      // a soft dark offset copy reads as the relief's shadow, then the bold gold face on top
      bold(tinted(seal, 'rgba(50, 22, 16, 0.6)', S * 0.95), 8, 11, 4);
      bold(tinted(seal, gold(), S * 0.95), 0, 0, 4);
    } else {
      x.strokeStyle = '#d4af5a';
      x.lineWidth = 22;
      x.beginPath(); x.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2); x.stroke();
    }
    tex.needsUpdate = true;
  };
  let custom = false;
  seal.onload = () => { sealReady = true; if (!custom) drawDefault(); };
  seal.src = new URL('brand/iitm-logo.svg', document.baseURI).href;
  const drawImage = (img: HTMLImageElement): void => {
    custom = true;
    x.clearRect(0, 0, S, S);
    x.save(); x.beginPath(); x.arc(S / 2, S / 2, S * 0.42, 0, Math.PI * 2); x.clip();
    const s = Math.max((S * 0.84) / img.width, (S * 0.84) / img.height), w = img.width * s, h = img.height * s;
    x.drawImage(img, S / 2 - w / 2, S / 2 - h / 2, w, h); x.restore();
    x.strokeStyle = '#d4af5a'; x.lineWidth = 22;
    x.beginPath(); x.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2); x.stroke();
    tex.needsUpdate = true;
  };
  drawDefault();
  const em = new THREE.Mesh(new THREE.CircleGeometry(2.1, 64), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, metalness: 0.1, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.32 }));
  em.position.set(0, 3.3, 0.2);
  sign.add(em);

  // low iron railing in front of the hedges
  for (let fx = -inner + 0.6; fx <= inner - 0.6; fx += 0.7) box(g, 0.06, 1.0, 0.06, 0x23272a, fx, 0.35, 3.5);
  box(g, inner * 2 - 1.2, 0.08, 0.08, 0x23272a, 0, 1.25, 3.5);
  box(g, inner * 2 - 1.2, 0.08, 0.08, 0x23272a, 0, 0.6, 3.5);

  // brick-red piers with white caps and lantern tops, framing each lane
  for (const px of [-outer, -inner, inner, outer]) {
    box(g, 2.4, 5.6, 2.4, brick, px, 0, -1.5);
    box(g, 2.9, 0.45, 2.9, white, px, 5.6, -1.5);
    box(g, 1.2, 0.9, 1.2, white, px, 6.05, -1.5);
    const lantern = add(g, new THREE.CylinderGeometry(0.42, 0.32, 0.9, 6), lampMat, px, 7.4, -1.5);
    lantern.castShadow = false;
    cyl(g, 0.05, 0.5, 0.35, slate, px, 7.85, -1.5, 6);
  }
  for (const side of [-1, 1]) {
    const mid = side * (inner + 1.2 + lane / 2);
    // sliding iron gate, open and parked against the outer pier along the wall line
    const gx = side * (outer + 1.2 + lane / 2);
    box(g, lane, 0.1, 0.1, 0x2b2f33, gx, 2.1, -1.5);
    box(g, lane, 0.1, 0.1, 0x2b2f33, gx, 0.25, -1.5);
    for (let k = 0; k <= 14; k++) box(g, 0.05, 1.85, 0.05, 0x2b2f33, gx - lane / 2 + (k * lane) / 14, 0.25, -1.5);
    // boom barrier, raised, just inside the gate
    box(g, 0.45, 1.1, 0.45, 0xe7e3da, mid - side * (lane / 2 - 0.5), 0, -6);
    const boom = add(g, new THREE.BoxGeometry(lane - 0.8, 0.12, 0.12), mat(0xd9483b), mid, 1.15, -6);
    boom.geometry.translate((lane - 0.8) / 2 * side, 0, 0);
    boom.position.x = mid - side * (lane / 2 - 0.5);
    boom.rotation.z = side * 1.2;
    // lane markings: IN on one side, OUT on the other
    const word = textPlane(3.2, 1.2, [side < 0 ? 'IN' : 'OUT'], '#f4f1e8');
    word.rotation.x = -Math.PI / 2;
    word.position.set(mid, 0.18, 1.5);
    word.castShadow = false;
    g.add(word);
  }
  return { group: g, emblem: { setImage: drawImage, reset: () => { custom = false; drawDefault(); } } };
}

/** White tensile canopy over a security checkpoint, with a guard cabin; local +z runs along the lane. */
function checkpointCanopy(w: number, d: number, glow: THREE.MeshStandardMaterial[]): THREE.Group {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.1, 0.12, 4.4, 0xe9e9e6, sx * (w / 2 - 0.3), 0, sz * (d / 2 - 0.3), 8);
  const roof = add(g, new THREE.ConeGeometry(1, 1.4, 4, 1, true), new THREE.MeshStandardMaterial({ color: 0xf7f7f4, roughness: 0.6, side: THREE.DoubleSide }), 0, 5.1, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set((w / 2) * Math.SQRT2, 1, (d / 2) * Math.SQRT2);
  const light = new THREE.MeshStandardMaterial({ color: 0xfafaf5, emissive: 0xfff4d8, emissiveIntensity: 0 });
  glow.push(light);
  add(g, new THREE.BoxGeometry(w * 0.7, 0.06, 0.25), light, 0, 4.35, 0, false);
  box(g, 1.7, 2.5, 2.2, 0xe9e2d2, w / 2 + 1.4, 0, 0);
  box(g, 2.1, 0.25, 2.6, 0x8a3b36, w / 2 + 1.4, 2.5, 0);
  return g;
}

/* ------------------------------------------------------------------ */
/* Gajendra Circle                                                     */
/* ------------------------------------------------------------------ */

export function elephant(stone: number): THREE.Group {
  const g = new THREE.Group();
  const m = mat(stone, 0.75);
  const body = add(g, new THREE.SphereGeometry(1, 24, 16), m, 0, 2.45, 0);
  body.scale.set(2.0, 1.35, 1.25);
  const head = add(g, new THREE.SphereGeometry(0.95, 20, 14), m, 1.95, 2.95, 0);
  head.scale.set(0.9, 1.05, 0.95);
  for (const s of [-1, 1]) {
    const ear = add(g, new THREE.SphereGeometry(1, 16, 10), m, 1.55, 3.0, s * 0.95);
    ear.scale.set(0.55, 0.95, 0.12);
    ear.rotation.y = s * 0.35;
    const tusk = add(g, new THREE.ConeGeometry(0.11, 1.1, 8), mat(0xf1ece0, 0.5), 2.55, 2.35, s * 0.32);
    tusk.rotation.z = -1.9;
  }
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.55, 2.8, 0), new THREE.Vector3(3.05, 2.1, 0), new THREE.Vector3(3.35, 2.6, 0), new THREE.Vector3(3.5, 3.6, 0), new THREE.Vector3(3.2, 4.4, 0),
  ]);
  add(g, new THREE.TubeGeometry(trunkCurve, 24, 0.22, 10, false), m, 0, 0, 0);
  for (const [lx, lz] of [[1.1, 0.6], [1.1, -0.6], [-1.1, 0.6], [-1.1, -0.6]]) add(g, new THREE.CylinderGeometry(0.42, 0.46, 1.9, 12), m, lx, 0.95, lz);
  const tail = add(g, new THREE.CylinderGeometry(0.05, 0.08, 1.2, 6), m, -2.05, 2.1, 0);
  tail.rotation.z = -0.4;
  return g;
}

function buildGajendraCircle(glow: THREE.MeshStandardMaterial[]): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 10.6, 10.8, 0.45, 0xc9c2b2, 0, 0, 0, 48); // kerb
  cyl(g, 10.0, 10.0, 0.5, 0x7da35e, 0, 0.02, 0, 48); // lawn
  // flower border
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 6, 5), new THREE.MeshLambertMaterial(), 90);
  const o = new THREE.Object3D(), col = new THREE.Color();
  const fcols = [0xe0508a, 0xf2c14e, 0xe8603c, 0xf4f0e6, 0xb85cd6];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    o.position.set(Math.cos(a) * 8.7, 0.7, Math.sin(a) * 8.7);
    o.updateMatrix();
    flowers.setMatrixAt(i, o.matrix);
    flowers.setColorAt(i, col.setHex(fcols[i % 5]));
  }
  g.add(flowers);
  // fountain basin and pedestal
  cyl(g, 5.6, 5.9, 1.0, 0xd8d1c0, 0, 0.5, 0, 40);
  const water = add(g, new THREE.CylinderGeometry(5.1, 5.1, 0.2, 40), new THREE.MeshPhongMaterial({ color: 0x4f94ad, shininess: 100, specular: 0xbfe2ec }), 0, 1.45, 0, false);
  water.receiveShadow = true;
  cyl(g, 2.4, 2.8, 2.2, 0xcfc7b4, 0, 1.5, 0, 24);
  cyl(g, 2.9, 2.9, 0.35, 0xbdb5a2, 0, 3.7, 0, 24);
  const el = elephant(0x8d9196);
  el.position.set(0, 4.05, 0);
  el.rotation.y = Math.PI / 2; // trunk raised toward the north
  g.add(el);
  // fountain jets
  const jetMat = new THREE.MeshStandardMaterial({ color: 0xdff3f8, transparent: true, opacity: 0.55, roughness: 0.1 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const jet = add(g, new THREE.ConeGeometry(0.18, 2.4, 8), jetMat, Math.cos(a) * 4.2, 2.7, Math.sin(a) * 4.2, false);
    jet.rotation.z = Math.cos(a) * 0.35;
    jet.rotation.x = -Math.sin(a) * 0.35;
  }
  // festive bulbs along the kerb, lit at night
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xf5e6b0, emissive: 0xffd77a, emissiveIntensity: 0 });
  glow.push(bulbMat);
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 5), bulbMat, 64);
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    o.position.set(Math.cos(a) * 10.5, 0.6, Math.sin(a) * 10.5);
    o.updateMatrix();
    bulbs.setMatrixAt(i, o.matrix);
  }
  g.add(bulbs);
  return g;
}

/* ------------------------------------------------------------------ */
/* Open Air Theatre seating                                            */
/* ------------------------------------------------------------------ */

/** A ring segment between two radii, extruded upward by h. The arc is centred on local +x. */
export function annularSector(rIn: number, rOut: number, a0: number, a1: number, h: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const seg = 28;
  for (let k = 0; k <= seg; k++) {
    const a = a0 + ((a1 - a0) * k) / seg;
    if (k === 0) s.moveTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
    else s.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
  }
  for (let k = seg; k >= 0; k--) {
    const a = a0 + ((a1 - a0) * k) / seg;
    s.lineTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2); // shape (x, y) → ground (x, -y); extrusion goes up
  return g;
}

/**
 * The OAT, calibrated against satellite imagery: a round bowl (the mapped outline, about 39 m in
 * radius) of concentric stone tiers around a central floor, with the stage on the south-east rim.
 */
const OAT_STAGE_DIR = { x: 0.75, z: 0.65 }; // from the bowl centre toward the stage (east, south)
function buildOAT(ring: number[]): { group: THREE.Group; cx: number; cz: number; r: number } {
  const c = ringCentroid(ring);
  let R = 0;
  const n = ring.length / 2;
  for (let i = 0; i < n; i++) R += Math.hypot(ring[i * 2] - c.x, ring[i * 2 + 1] - c.z);
  R = Math.max(18, R / n);
  const g = new THREE.Group();
  g.position.set(c.x, 0, c.z);
  // local +x points from the stage into the seats: rotation.y = atan2(-dz, dx) for that direction
  g.rotation.y = Math.atan2(OAT_STAGE_DIR.z, -OAT_STAGE_DIR.x);
  const floor = add(g, new THREE.CircleGeometry(R * 1.01, 64), mat(0xc4a67e, 0.95), 0, 0.15, 0, false);
  floor.rotation.x = -Math.PI / 2;
  const centre = add(g, new THREE.CircleGeometry(R * 0.34, 48), mat(0xd9cdb6, 0.9), 0, 0.22, 0, false);
  centre.rotation.x = -Math.PI / 2;
  // concentric stepped tiers wrapping round, leaving a gap on the stage side
  const tiers = 10, step = (R * 0.62) / tiers, half = Math.PI * 0.8;
  for (let i = 0; i < tiers; i++) {
    const r0 = R * 0.36 + i * step;
    const m = new THREE.Mesh(annularSector(r0, r0 + step, -half, half, 0.4 + i * 0.42), mat(i % 2 ? 0xcdc5b2 : 0xbab29e, 0.95));
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  // stage block and roof on the rim, facing the bowl
  const sx = -R * 0.72;
  box(g, R * 0.22, 1.4, R * 0.5, 0x8c7d68, sx, 0, 0);
  box(g, 1, 7, R * 0.52, 0x6b5d4a, sx - R * 0.1, 0, 0);
  box(g, R * 0.26, 0.6, R * 0.58, 0xa8402a, sx, 7.2, 0);
  return { group: g, cx: c.x, cz: c.z, r: R };
}

/* ------------------------------------------------------------------ */
/* Banyan grove                                                        */
/* ------------------------------------------------------------------ */

export function buildBanyan(): THREE.Group {
  const g = new THREE.Group();
  const bark = mat(0x6f5a46, 0.95);
  const leaf = new THREE.MeshLambertMaterial({ color: 0x3f6f35, flatShading: true });
  const leaf2 = new THREE.MeshLambertMaterial({ color: 0x4d7f3d, flatShading: true });
  // knotted main trunk
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const t = add(g, new THREE.CylinderGeometry(0.7, 1.2, 9, 8), bark, Math.cos(a) * 0.9, 4.5, Math.sin(a) * 0.9);
    t.rotation.z = Math.cos(a) * 0.12;
    t.rotation.x = Math.sin(a) * 0.12;
  }
  // limbs
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const limb = add(g, new THREE.CylinderGeometry(0.35, 0.6, 12, 6), bark, Math.cos(a) * 5.5, 9.4, Math.sin(a) * 5.5);
    limb.rotation.z = Math.cos(a) * 1.15;
    limb.rotation.x = -Math.sin(a) * 1.15;
  }
  // wide canopy of overlapping crowns
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, r = i % 2 ? 11 : 6;
    const crown = add(g, new THREE.IcosahedronGeometry(6.5 - (i % 3), 1), i % 3 ? leaf : leaf2, Math.cos(a) * r, 12.5 + (i % 3) * 0.8, Math.sin(a) * r);
    crown.scale.set(1.35, 0.55, 1.35);
  }
  add(g, new THREE.IcosahedronGeometry(8, 1), leaf2, 0, 14.5, 0).scale.set(1.3, 0.55, 1.3);
  // aerial prop roots
  for (let i = 0; i < 34; i++) {
    const a = i * 2.39996, r = 4 + ((i * 37) % 11);
    const h = 10 + ((i * 13) % 3);
    add(g, new THREE.CylinderGeometry(0.06 + (i % 3) * 0.05, 0.12 + (i % 3) * 0.08, h, 5), bark, Math.cos(a) * r, h / 2, Math.sin(a) * r, false);
  }
  // study tables and benches in the shade
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.6, r = 14;
    const tx = Math.cos(a) * r, tz = Math.sin(a) * r;
    cyl(g, 1.1, 1.1, 0.12, 0x9a6f45, tx, 0.85, tz, 16);
    cyl(g, 0.12, 0.16, 0.85, 0x5b4636, tx, 0, tz, 8);
    for (const s of [-1, 1]) {
      const b = box(g, 2.2, 0.12, 0.45, 0x8a5f3a, tx + Math.cos(a + Math.PI / 2) * 1.8 * s, 0.45, tz + Math.sin(a + Math.PI / 2) * 1.8 * s);
      b.rotation.y = -a;
    }
  }
  return g;
}

/* ------------------------------------------------------------------ */
/* study spot markers                                                  */
/* ------------------------------------------------------------------ */

export interface Marker {
  place: Place;
  ring: THREE.Mesh;
  beam: THREE.Mesh;
}

function beamTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  x.fillStyle = g;
  x.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------------------------ */
/* places                                                              */
/* ------------------------------------------------------------------ */

/** Short descriptions for well-known places, kept from the earlier schematic model. */
const NOTES: [RegExp, string, string?][] = [
  [/^Administration Building$/, "The Administrative Block, close to Gajendra Circle. The Director's office and the Institute's main administrative offices are here.", 'Administration'],
  [/^Humanities and Social Sciences Block/, 'The Humanities and Social Sciences Block (HSB), next to the Central Lecture Theatre.', 'Teaching'],
  [/^Central Lecture The/, 'The Central Lecture Theatre (CLT), one of the largest lecture halls on campus.', 'Teaching'],
  [/^IC&SR Building$/, 'Industrial Consultancy and Sponsored Research, the office for the Institute\'s industry projects and research grants.', 'Research office'],
  [/^Department of Managament Studies/, 'The Department of Management Studies.', 'Academic'],
  [/^Bose-Einstein Guest House$/, 'A guest house for visitors to the Institute.', 'Guest house'],
  [/^Taramani Guest House$/, 'A guest house on the campus; Institute buses stop nearby.', 'Guest house'],
  [/^Kendriya Vidyalaya IIT Chennai$/, 'One of the two schools on campus.', 'School'],
  [/^Vana ?Vani/, 'The Vana Vani school, one of the two schools on campus.', 'School'],
  [/^India Post/, 'The campus post office.', 'Amenity'],
  [/^State Bank of India$/, 'A bank branch on the campus.', 'Bank'],
  [/^IITM Hospital$/, 'The campus hospital, one of the amenities that make the campus largely self-contained.', 'Health'],
  [/^Central Workshop$/, 'The central workshop, where students build and test their projects.', 'Fabrication'],
  [/^PG Senapathy Centre$/, 'The P G Senapathy Centre for Computing Resources, the central computing facility.', 'Computing'],
  [/^New Academic Complex/, 'One of the New Academic Complex buildings, home to several departments.', 'Academic'],
  [/^Hostel Management Office$/, 'The Office of Hostel Management, in the hostel zone.', 'Hostel management'],
  [/^(Nilgiri|Vindhya) Mess$/, 'One of the central dining halls for students living in the hostels.', 'Dining'],
  [/^Mandakini$/, 'Mandakini, one of the tallest hostels on campus.', 'Hostel'],
  [/^IITM Research Park$/, 'The IIT Madras Research Park, where companies, start-ups and Institute labs work side by side. It sits just outside the campus wall.', 'Innovation'],
  [/^IITM Shopping Complex$/, 'Shops, a bakery, a coffee shop and other everyday services for campus residents.', 'Shopping'],
  [/^Heritage Centre$/, 'The Heritage Centre, a museum of the Institute\'s history.', 'Museum'],
  [/^IIT Lake$/, 'A lake in the north of the campus that collects much of the campus rainwater.', 'Water'],
  [/^Black Buck Habitat$/, 'A protected patch where blackbuck and spotted deer graze. The campus forest adjoins Guindy National Park.', 'Wildlife'],
  [/^Students Activity Centre/, 'The Students Activity Centre (SAC), with rooms for clubs, practice and events.', 'Student life'],
  [/^IIT Madras Swimming Pool$/, 'The Institute swimming pool.', 'Sport'],
  [/^Sports Complex$/, 'The indoor sports complex.', 'Sport'],
  [/^T\.T\. Jagannathan Auditorium$/, 'The T. T. Jagannathan Auditorium, used for lectures, talks and events.', 'Auditorium'],
];

function genericText(name: string, tag: string, kind: number | undefined): string {
  if (tag === 'Hostel') return `${name}, a student hostel in the hostel zone south of Gajendra Circle.`;
  if (tag === 'Food') return `${name}, a place to eat on campus.`;
  if (tag === 'Academic') return `${name}, an academic building on the IIT Madras campus.`;
  if (tag === 'Residence' || kind === 2) return `${name}, a block of staff housing in the campus residential area.`;
  if (tag === 'Sport') return `${name}, a sports facility on campus.`;
  if (tag === 'Temple') return `${name}, a temple on the campus.`;
  if (tag === 'School') return `${name}, a school on the campus.`;
  if (tag === 'Bank') return `${name}, a bank on the campus.`;
  return `${name}, on the IIT Madras campus.`;
}

export interface Landmarks {
  group: THREE.Group;
  places: Place[];
  byId: Map<string, Place>;
  byBuilding: Map<number, Place>;
  markers: Marker[];
  pickTargets: { obj: THREE.Object3D; place: Place }[];
  glow: THREE.MeshStandardMaterial[];
  emblem: GateControl | null;
  /** areas where generated trees should not grow */
  excluded(x: number, z: number): boolean;
  update(t: number, nightF: number): void;
}

export function buildLandmarks(data: CampusData, inCampus: (x: number, z: number) => boolean, buildingBoxes: [number, number, number, number][]): Landmarks {
  const group = new THREE.Group();
  group.name = 'landmarks';
  const places: Place[] = [];
  const byId = new Map<string, Place>();
  const byBuilding = new Map<number, Place>();
  const glow: THREE.MeshStandardMaterial[] = [];
  const pickTargets: { obj: THREE.Object3D; place: Place }[] = [];
  const clear: { x: number; z: number; r: number }[] = [];
  const usedNamed = new Set<NamedRec>();

  const addPlace = (p: Place): Place => {
    if (byId.has(p.id)) return byId.get(p.id)!;
    places.push(p);
    byId.set(p.id, p);
    if (p.building !== undefined && !byBuilding.has(p.building)) byBuilding.set(p.building, p);
    return p;
  };
  const find = (re: RegExp, pred?: (n: NamedRec) => boolean): NamedRec | undefined => data.named.find((n) => re.test(n.n) && (!pred || pred(n)));
  const bInfo = (n: NamedRec | undefined): { h: number; r: number; floors?: number; fromMap?: boolean } => {
    if (!n || n.b === undefined) return { h: 6, r: 40 };
    const b = data.buildings[n.b];
    const bx = buildingBoxes[n.b];
    return { h: b.h, r: Math.max(20, Math.hypot(bx[2] - bx[0], bx[3] - bx[1]) / 2), floors: b.f, fromMap: !!b.l };
  };

  /* --- Main Gate --- */
  let emblem: GateControl | null = null;
  const gateNode = mainGateNode(data);
  if (gateNode) {
    const sx = gateNode.x + MAIN_GATE.sign.dx, sz = gateNode.z + MAIN_GATE.sign.dz;
    const gate = buildMainGate(glow);
    gate.group.position.set(sx, 0, sz);
    // local +z faces the road: rotation.y = atan2(faceX, faceZ)
    gate.group.rotation.y = Math.atan2(MAIN_GATE.facing.x, MAIN_GATE.facing.z);
    group.add(gate.group);
    emblem = gate.emblem;
    clear.push({ x: sx, z: sz, r: 24 });
    for (const c of MAIN_GATE.canopies) {
      const cp = checkpointCanopy(c.w, c.d, glow);
      cp.position.set(gateNode.x + c.dx, 0, gateNode.z + c.dz);
      cp.rotation.y = Math.atan2(c.dir.x, c.dir.z);
      group.add(cp);
      clear.push({ x: gateNode.x + c.dx, z: gateNode.z + c.dz, r: 10 });
    }
    const p = addPlace({ id: 'gate', name: 'Main Gate', tag: 'Entrance', kind: 'major', x: sx, z: sz, h: 12, radius: 40,
      text: 'The main entrance on Sardar Patel Road, rebuilt in 2021 where the IIT flyover begins. The pink granite name sign with gold lettering and the Institute emblem stands on the planted median between the in and out lanes, framed by brick-red piers with lanterns. Security checkpoints under white canopies sit a little further in, and Bonn Avenue then runs through the forest to Gajendra Circle, about 2 km away.' });
    pickTargets.push({ obj: gate.group, place: p });
  }

  /* --- other gates --- */
  for (const [re, id, name, text] of [
    [/^Velachery Gate$/, 'velachery-gate', 'Velachery Gate', 'The western entrance, on the Velachery side of the campus.'],
    [/^Taramani Gate$/, 'taramani-gate', 'Taramani Gate', 'An entrance on the Taramani side, in the south of the campus.'],
    [/^Kanagam Gate$/, 'kanagam-gate', 'Kanagam Gate', 'A gate on the eastern edge towards Kanagam and the Research Park.'],
  ] as [RegExp, string, string, string][]) {
    const poi = data.pois.find((p) => re.test(p.n));
    if (poi) addPlace({ id, name, tag: 'Entrance', kind: 'major', x: poi.x, z: poi.z, h: 6, radius: 40, text });
  }

  /* --- Gajendra Circle --- */
  const gc = buildGajendraCircle(glow);
  group.add(gc);
  clear.push({ x: 0, z: 0, r: 16 });

  /* --- Open Air Theatre --- */
  const oatRec = find(/^Open Air Thea/);
  let oatPos = { x: 0, z: 0, r: 30 };
  let oatGroup: THREE.Group | null = null;
  if (oatRec && oatRec.p) {
    const oat = buildOAT(oatRec.p);
    oatGroup = oat.group;
    group.add(oat.group);
    oatPos = { x: oat.cx, z: oat.cz, r: oat.r };
    const b = ringBox(oatRec.p);
    clear.push({ x: oat.cx, z: oat.cz, r: Math.hypot(b[2] - b[0], b[3] - b[1]) / 2 + 4 });
    usedNamed.add(oatRec);
  }

  /* --- Banyan grove beside Banyan Avenue --- */
  let banyanPos = { x: 120, z: -260 };
  const banyanRoad = data.roads.find((r) => r.n === 'Banyan Avenue');
  if (banyanRoad) {
    const mid = banyanRoad.v[Math.floor(banyanRoad.v.length / 2)];
    const nxt = banyanRoad.v[Math.min(banyanRoad.v.length - 1, Math.floor(banyanRoad.v.length / 2) + 1)];
    const mx = data.rv[mid * 2], mz = data.rv[mid * 2 + 1];
    let dx = data.rv[nxt * 2] - mx, dz = data.rv[nxt * 2 + 1] - mz;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l; dz /= l;
    const free = (x: number, z: number): boolean => !buildingBoxes.some((b) => x > b[0] - 16 && x < b[2] + 16 && z > b[1] - 16 && z < b[3] + 16);
    outer: for (const off of [26, 34, 44, 56]) for (const s of [1, -1]) {
      const x = mx - dz * off * s, z = mz + dx * off * s;
      if (free(x, z) && inCampus(x, z)) { banyanPos = { x, z }; break outer; }
    }
  }
  const banyan = buildBanyan();
  banyan.position.set(banyanPos.x, 0, banyanPos.z);
  group.add(banyan);
  clear.push({ x: banyanPos.x, z: banyanPos.z, r: 24 });

  /* --- study spots from the app's own location list --- */
  const studyDefs: { id: string; at: () => { x: number; z: number; h: number; r: number; rec?: NamedRec } }[] = [
    { id: 'library', at: () => { const n = find(/^Central Library$/); const i = bInfo(n); return { x: n ? n.x : 22, z: n ? n.z : 72, h: i.h, r: i.r, rec: n }; } },
    { id: 'lhc', at: () => { const n = find(/^Classroom Complex/); const i = bInfo(n); return { x: n ? n.x : -330, z: n ? n.z : 167, h: i.h, r: i.r, rec: n }; } },
    { id: 'oat', at: () => ({ x: oatPos.x, z: oatPos.z, h: 8, r: oatPos.r + 10, rec: oatRec }) },
    { id: 'cafe', at: () => { const n = find(/^Himalaya Mess$/); const i = bInfo(n); return { x: n ? n.x : 248, z: n ? n.z : 484, h: i.h, r: i.r, rec: n }; } },
    { id: 'banyan', at: () => ({ x: banyanPos.x, z: banyanPos.z, h: 17, r: 28 }) },
    { id: 'park', at: () => { const n = find(/^Sangam Ground$/); return { x: n ? n.x : 414, z: n ? n.z : 676, h: 3, r: 60, rec: n }; } },
    { id: 'gc', at: () => ({ x: 0, z: 0, h: 9, r: 22 }) },
  ];
  const beamTex = beamTexture();
  const markers: Marker[] = [];
  for (const def of studyDefs) {
    const loc = (LOCATIONS as Record<string, { name: string; icon: string; description: string; category?: string; tagline?: string }>)[def.id];
    if (!loc) continue;
    const at = def.at();
    if (at.rec) usedNamed.add(at.rec);
    const extra = def.id === 'cafe' ? ' It sits by the Himalaya mess and food court in the hostel zone.' :
      def.id === 'park' ? ' On the map this is Sangam Ground, in the hostel zone.' :
      def.id === 'banyan' ? ' The grove is placed beside Banyan Avenue in the residential area.' :
      def.id === 'gc' ? ' The roundabout at the heart of the campus, with a fountain and an elephant statue, between the residential and academic zones.' : '';
    const p = addPlace({
      id: 'study-' + def.id, name: loc.name, tag: 'Study spot', kind: 'study', icon: loc.icon, studyId: def.id,
      x: at.x, z: at.z, h: at.h, radius: at.r, text: loc.description + extra,
      building: at.rec && at.rec.b !== undefined ? at.rec.b : undefined,
      floors: at.rec && at.rec.b !== undefined ? data.buildings[at.rec.b].f : undefined,
      floorsFromMap: at.rec && at.rec.b !== undefined ? !!data.buildings[at.rec.b].l : undefined,
    });
    // marker: pulsing ground ring and a soft light column
    const rr = Math.min(70, at.r + 6);
    const ring = new THREE.Mesh(new THREE.RingGeometry(rr, rr + 1.6, 64), new THREE.MeshBasicMaterial({ color: 0x2fd3b0, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -30, polygonOffsetUnits: -60 }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(at.x, 0.35, at.z);
    ring.renderOrder = 3;
    group.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 90, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x4fe3c1, map: beamTex, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beam.position.set(at.x, at.h + 45, at.z);
    beam.renderOrder = 4;
    group.add(beam);
    markers.push({ place: p, ring, beam });
    if (def.id === 'gc') pickTargets.push({ obj: gc, place: p });
    if (def.id === 'banyan') pickTargets.push({ obj: banyan, place: p });
  }
  const oatPlace = byId.get('study-oat');
  if (oatPlace && oatGroup) pickTargets.push({ obj: oatGroup, place: oatPlace });

  /* --- coming-soon study spots --- */
  const soonMatch: Record<string, RegExp> = { chemplast: /^Chemplast Cricket Ground$/, sac: /^Students Activity Centre/, aerospace: /^Aerospace engineering$/i, mandakini: /^Mandakini$/ };
  for (const d of VERIFIED_IITM_UPCOMING_DESTINATIONS) {
    const re = soonMatch[d.id];
    const n = re ? find(re) : undefined;
    if (!n) continue;
    usedNamed.add(n);
    const i = bInfo(n);
    addPlace({ id: 'soon-' + d.id, name: d.name, tag: d.badge, kind: 'soon', x: n.x, z: n.z, h: n.a ? 3 : i.h, radius: n.a ? 80 : i.r, text: d.description + ' This study spot is not open yet.', building: n.b, floors: i.floors, floorsFromMap: i.fromMap, badge: 'Soon' });
  }

  /* --- curated and named places from the map --- */
  for (const n of data.named) {
    if (usedNamed.has(n)) continue;
    const note = NOTES.find(([re]) => re.test(n.n));
    const i = bInfo(n);
    const isHostel = n.t === 'Hostel';
    const major = !!note && !n.out;
    const kind: PlaceKind = n.out ? 'building' : isHostel ? 'hostel' : major ? 'major' : n.a || n.p ? 'area' : 'building';
    const id = 'n-' + n.n.toLowerCase().replace(/[^a-z0-9]+/g, '-') + (n.b !== undefined ? '-' + n.b : '');
    const tag = (note && note[2]) || n.t || (n.out ? 'Outside campus' : 'Building');
    addPlace({
      id, name: n.n, tag, kind, x: n.x, z: n.z, h: n.a ? 2 : i.h, radius: n.a ? 70 : i.r,
      text: note ? note[1] : n.out ? `${n.n}, outside the campus wall.` : genericText(n.n, n.t, n.b !== undefined ? data.buildings[n.b].k : undefined),
      building: n.b, floors: i.floors, floorsFromMap: i.fromMap, outside: !!n.out,
    });
  }
  /* --- every other campus building, with the descriptive label from the map data --- */
  const KIND_TEXT: Record<string, string> = {
    aca: 'an academic or lab building', hos: 'a block in the hostel zone', food: 'a place to eat', spo: 'a sports building', svc: 'a service building',
    res: 'staff housing', lmk: 'a landmark building', utl: 'a utility building such as a pump house, store or shed', oth: 'a campus building',
  };
  data.buildings.forEach((b, i) => {
    if (!b.c || !b.g || byBuilding.has(i)) return;
    const c = ringCentroid(b.p), bx = buildingBoxes[i];
    addPlace({
      id: 'b-' + i, name: b.g, tag: CATEGORY_LABEL[b.t || 'oth'] || 'Campus building', kind: 'minor', x: c.x, z: c.z, h: b.h, building: i,
      radius: Math.max(16, Math.hypot(bx[2] - bx[0], bx[3] - bx[1]) / 2), floors: b.f, floorsFromMap: !!b.l,
      text: `This building has no name on the map yet. From its map tags and surroundings it is ${KIND_TEXT[b.t || 'oth'] || 'a campus building'}; the label says what it is and where it stands.`,
    });
  });

  const stadium = data.pois.find((p) => /Stadium/.test(p.n));
  if (stadium) addPlace({ id: 'stadium', name: 'Manohar C Watsa Stadium', tag: 'Sport', kind: 'major', x: stadium.x, z: stadium.z, h: 4, radius: 90, text: 'The Manohar C Watsa Stadium, the main campus stadium with an athletics track. The campus also has grounds for cricket, football and hockey.' });
  addPlace({ id: 'gc-name', name: 'Gajendra Circle', tag: 'Landmark', kind: 'poi', x: 0, z: 0, h: 9, radius: 22, text: '' });
  for (const poi of data.pois) {
    if (/gate|Stadium/i.test(poi.n) || !poi.t || !inCampus(poi.x, poi.z)) continue;
    addPlace({ id: 'p-' + poi.n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: poi.n, tag: poi.t[0].toUpperCase() + poi.t.slice(1), kind: 'poi', x: poi.x, z: poi.z, h: 3, radius: 25, text: `${poi.n} (${poi.t}).` });
  }

  /* --- neighbourhood and road names --- */
  const wood = (data.areas.wood || []).filter((a) => { const c = ringCentroid(a.p); return !inCampus(c.x, c.z); }).sort((a, b) => Math.abs(ringArea(b.p)) - Math.abs(ringArea(a.p)))[0];
  if (wood) { const c = ringCentroid(wood.p); addPlace({ id: 'd-guindy', name: 'Guindy National Park', tag: 'Neighbourhood', kind: 'district', x: c.x, z: c.z, h: 0, radius: 600, text: 'Guindy National Park, a protected forest next to the campus.' }); }
  for (const [id, name, lat, lon] of [['d-velachery', 'Velachery', 12.9805, 80.2215], ['d-taramani', 'Taramani', 12.9825, 80.2455], ['d-adyar', 'Adyar', 13.0095, 80.2462], ['d-kotturpuram', 'Kotturpuram', 13.0102, 80.2365]] as [string, string, number, number][]) {
    const p = fromLatLon(data, lat, lon);
    addPlace({ id, name, tag: 'Neighbourhood', kind: 'district', x: p.x, z: p.z, h: 0, radius: 600, text: `${name}, a neighbourhood of Chennai next to the campus.` });
  }
  const roadNames = new Map<string, { len: number; x: number; z: number }>();
  for (const r of data.roads) {
    if (!r.n || r.c > 4) continue;
    const inside = r.v.some((v) => inCampus(data.rv[v * 2], data.rv[v * 2 + 1]));
    if (!inside && r.n !== 'Sardar Patel Road') continue;
    let len = 0;
    for (let i = 0; i < r.v.length - 1; i++) len += Math.hypot(data.rv[r.v[i + 1] * 2] - data.rv[r.v[i] * 2], data.rv[r.v[i + 1] * 2 + 1] - data.rv[r.v[i] * 2 + 1]);
    const mid = r.v[Math.floor(r.v.length / 2)];
    const prev = roadNames.get(r.n);
    if (!prev || prev.len < len) roadNames.set(r.n, { len, x: data.rv[mid * 2], z: data.rv[mid * 2 + 1] });
  }
  for (const [name, r] of roadNames) if (r.len > 120) addPlace({ id: 'r-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, tag: 'Road', kind: 'road', x: r.x, z: r.z, h: 0.5, radius: 120, text: `${name}.` });

  const excluded = (x: number, z: number): boolean => clear.some((c) => (x - c.x) * (x - c.x) + (z - c.z) * (z - c.z) < c.r * c.r);

  // directory category for each place
  const areaCat = (name: string): string => {
    const rec = data.named.find((q) => q.n === name);
    return rec && (rec.a === 'pitch' || rec.a === 'track' || rec.a === 'stadium') ? 'spo' : 'lmk';
  };
  for (const p of places) {
    if (p.kind === 'study' || p.kind === 'soon') p.cat = 'study';
    else if (p.kind === 'district' || p.kind === 'road' || p.kind === 'poi') p.cat = undefined;
    else if (p.building !== undefined) p.cat = data.buildings[p.building].t || (p.outside ? 'out' : 'oth');
    else if (p.id === 'stadium') p.cat = 'spo';
    else if (p.kind === 'area') p.cat = areaCat(p.name);
    else p.cat = 'lmk'; // gates and other mapped landmarks
  }

  return {
    group, places, byId, byBuilding, markers, pickTargets, glow, emblem, excluded,
    update(t: number, nightF: number) {
      for (const g of glow) g.emissiveIntensity = nightF * 2;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
      for (const m of markers) {
        (m.ring.material as THREE.MeshBasicMaterial).opacity = 0.45 + pulse * 0.45;
        (m.beam.material as THREE.MeshBasicMaterial).opacity = 0.18 + nightF * 0.3 + pulse * 0.08;
      }
    },
  };
}
