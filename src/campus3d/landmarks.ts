import * as THREE from 'three';
import type { CampusData, NamedRec } from './data';
import { fromLatLon, ringArea, ringBox, ringCentroid } from './data';
import { LOCATIONS, VERIFIED_IITM_UPCOMING_DESTINATIONS } from '../constants/locations';

export type PlaceKind = 'study' | 'soon' | 'major' | 'hostel' | 'building' | 'area' | 'poi' | 'district' | 'road';

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

/** Builds the gate with local +z facing out of campus and local x running across the road. */
function buildMainGate(roadHalf: number, glow: THREE.MeshStandardMaterial[]): { group: THREE.Group; emblem: GateControl } {
  const g = new THREE.Group();
  const pink = 0xb97874, maroon = 0x7d2a36, white = 0xf3efe6, slate = 0x6d7b87, brick = 0x8a3b36;
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, emissive: 0xfff0c0, emissiveIntensity: 0 });
  const warmMat = new THREE.MeshStandardMaterial({ color: 0x7a5a30, emissive: 0xffc27a, emissiveIntensity: 0 });
  glow.push(lampMat, warmMat);

  // sign pavilion beside the road, facing out
  const sign = new THREE.Group();
  sign.position.set(-(roadHalf + 15), 0, 1);
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
    u.position.set(ux, 1.0, 0.45);
    sign.add(u);
  }
  for (const p of [[-11.5, 2.4, 1.1], [11.5, 2.4, 1.1]]) palm(sign, p[0], p[1], p[2]);
  for (let hx = -9; hx <= 9; hx += 3) hedge(sign, hx, 2.6, 1.7, 0.9, 1.1, 0x84a396);

  // emblem disc on the sign
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d')!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ring = (): void => {
    x.strokeStyle = '#d9c66e';
    x.fillStyle = '#d9c66e';
    x.lineWidth = 16; x.beginPath(); x.arc(256, 256, 244, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 6; x.beginPath(); x.arc(256, 256, 206, 0, Math.PI * 2); x.stroke();
  };
  const drawDefault = (): void => {
    x.clearRect(0, 0, 512, 512); ring();
    x.beginPath(); x.moveTo(256, 150); x.lineTo(306, 256); x.lineTo(256, 362); x.lineTo(206, 256); x.closePath(); x.fill();
    x.beginPath(); x.arc(256, 256, 18, 0, Math.PI * 2); x.fillStyle = '#b97874'; x.fill();
    tex.needsUpdate = true;
  };
  const drawImage = (img: HTMLImageElement): void => {
    x.clearRect(0, 0, 512, 512);
    x.save(); x.beginPath(); x.arc(256, 256, 200, 0, Math.PI * 2); x.clip();
    const s = Math.max(400 / img.width, 400 / img.height), w = img.width * s, h = img.height * s;
    x.drawImage(img, 256 - w / 2, 256 - h / 2, w, h); x.restore(); ring();
    tex.needsUpdate = true;
  };
  drawDefault();
  const em = new THREE.Mesh(new THREE.CircleGeometry(1.9, 48), new THREE.MeshStandardMaterial({ map: tex, transparent: true, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25 }));
  em.position.set(0, 3.1, 0.2);
  sign.add(em);

  // brick piers with lamp finials on both sides of the road
  for (const px of [-(roadHalf + 2.6), roadHalf + 2.6]) {
    box(g, 3.0, 7.0, 3.0, brick, px, 0, 0);
    box(g, 3.6, 0.6, 3.6, white, px, 7.0, 0);
    cyl(g, 0.3, 2.0, 1.3, slate, px, 7.6, 0, 4);
    const fin = new THREE.Mesh(new THREE.OctahedronGeometry(1.0, 0), lampMat);
    fin.scale.set(1, 0.8, 1);
    fin.position.set(px, 9.7, 0);
    fin.castShadow = true;
    g.add(fin);
  }
  // guard booth and iron fence
  box(g, 3.2, 3.0, 3.2, 0xe9e2d2, roadHalf + 7.5, 0, -2);
  box(g, 3.8, 0.4, 3.8, 0xa1442f, roadHalf + 7.5, 3.0, -2);
  for (let fx = roadHalf + 4.5; fx <= roadHalf + 26; fx += 1.4) box(g, 0.1, 1.4, 0.1, 0x23272a, fx, 0, 1.2);
  box(g, 22, 0.1, 0.1, 0x23272a, roadHalf + 15.2, 1.25, 1.2);
  return { group: g, emblem: { setImage: drawImage, reset: drawDefault } };
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

function buildOAT(ring: number[]): { group: THREE.Group; cx: number; cz: number; r: number } {
  const c = ringCentroid(ring);
  // principal axis of the outline
  let sxx = 0, szz = 0, sxz = 0;
  const n = ring.length / 2;
  for (let i = 0; i < n; i++) {
    const dx = ring[i * 2] - c.x, dz = ring[i * 2 + 1] - c.z;
    sxx += dx * dx; szz += dz * dz; sxz += dx * dz;
  }
  const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const ax = Math.cos(ang), az = Math.sin(ang);
  let maxA = 0, maxB = 0;
  for (let i = 0; i < n; i++) {
    const dx = ring[i * 2] - c.x, dz = ring[i * 2 + 1] - c.z;
    maxA = Math.max(maxA, Math.abs(dx * ax + dz * az));
    maxB = Math.max(maxB, Math.abs(-dx * az + dz * ax));
  }
  const R = Math.max(18, Math.min(maxA, maxB * 1.6));
  const g = new THREE.Group();
  g.position.set(c.x, 0, c.z);
  // the bowl opens along the long axis; local +x points from the stage into the seats
  g.rotation.y = -ang;
  const floor = add(g, new THREE.CircleGeometry(R * 1.02, 48), mat(0xc4a67e, 0.95), 0, 0.2, 0, false);
  floor.rotation.x = -Math.PI / 2;
  // stepped stone tiers: each is an annular sector, taller the further it is from the stage
  const tiers = 9, step = (R * 0.7) / tiers;
  for (let i = 0; i < tiers; i++) {
    const r0 = R * 0.28 + i * step;
    const m = new THREE.Mesh(annularSector(r0, r0 + step, -Math.PI * 0.42, Math.PI * 0.42, 0.5 + i * 0.55), mat(i % 2 ? 0xcdc5b2 : 0xbab29e, 0.95));
    m.position.set(-R * 0.3, 0, 0);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  // stage and its canopy
  box(g, 7, 1.4, R * 0.7, 0x8c7d68, -R * 0.42, 0, 0);
  box(g, 1, 7, R * 0.72, 0x6b5d4a, -R * 0.5, 0, 0);
  box(g, 8, 0.6, R * 0.78, 0xa8402a, -R * 0.44, 7.2, 0);
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
  const gatePoi = data.pois.find((p) => p.n === 'IIT Madras gate');
  if (gatePoi) {
    // find the road through the gate and which way leads into campus
    let best = Infinity, dirX = 0, dirZ = 1, roadHalf = 4;
    for (const r of data.roads) {
      if (r.c > 4) continue;
      for (let i = 0; i < r.v.length - 1; i++) {
        const ax = data.rv[r.v[i] * 2], az = data.rv[r.v[i] * 2 + 1], bx = data.rv[r.v[i + 1] * 2], bz = data.rv[r.v[i + 1] * 2 + 1];
        const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
        if (l2 < 1) continue;
        const t = Math.max(0, Math.min(1, ((gatePoi.x - ax) * dx + (gatePoi.z - az) * dz) / l2));
        const d = Math.hypot(ax + dx * t - gatePoi.x, az + dz * t - gatePoi.z);
        if (d < best && r.c > 0) { best = d; const l = Math.sqrt(l2); dirX = dx / l; dirZ = dz / l; roadHalf = r.w / 2; }
      }
    }
    if (!inCampus(gatePoi.x + dirX * 40, gatePoi.z + dirZ * 40)) { dirX = -dirX; dirZ = -dirZ; }
    const gate = buildMainGate(roadHalf, glow);
    gate.group.position.set(gatePoi.x, 0, gatePoi.z);
    // local +z must point out of campus: rotation.y = atan2(outX, outZ)
    gate.group.rotation.y = Math.atan2(-dirX, -dirZ);
    group.add(gate.group);
    emblem = gate.emblem;
    clear.push({ x: gatePoi.x, z: gatePoi.z, r: 34 });
    const p = addPlace({ id: 'gate', name: 'Main Gate', tag: 'Entrance', kind: 'major', x: gatePoi.x, z: gatePoi.z, h: 15, radius: 45,
      text: 'The main entrance, on Sardar Patel Road between Adyar and Guindy. A pink granite sign with gold lettering stands in a white pavilion with a slate roof, beside brick-red piers topped with lamps. Bonn Avenue runs from here through the forest to Gajendra Circle, about 2 km away.' });
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
