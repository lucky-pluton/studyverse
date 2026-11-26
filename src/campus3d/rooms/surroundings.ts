/**
 * The campus around a 3D study room: grassy ground, a layered forest like the IIT Madras canopy,
 * a far tree line on the horizon, campus blocks rising above the trees, drifting clouds and, for
 * outdoor rooms, a few grazing deer. Everything is instanced, so it stays cheap to draw.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { crownGeometry, trunkGeometry } from '../world';
import { backdropBuilding } from './kit';

export interface SurroundingsOptions {
  /** area kept free for the room itself: [minX, minZ, maxX, maxZ] */
  clear: [number, number, number, number];
  /** extra empty margin around that area */
  margin: number;
  /** show grazing deer on the lawns */
  deer?: boolean;
  /** inner radius and size of the nearest tree band; indoor rooms keep it open so windows show sky */
  nearMin?: number;
  nearCount?: number;
  seed?: number;
}

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function grassTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d')!;
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, S, S);
  const r = rng(17);
  for (let i = 0; i < 1800; i++) {
    const px = r() * S, py = r() * S, rad = 2 + r() * 14, a = r() * 0.12, dark = r() < 0.65;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, rad);
      g.addColorStop(0, dark ? `rgba(40,70,20,${a})` : `rgba(255,255,220,${a})`);
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

function deerGeometry(): THREE.BufferGeometry {
  const part = (w: number, h: number, d: number, x: number, y: number, z: number, rz = 0): THREE.BufferGeometry => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rz) g.rotateZ(rz);
    g.translate(x, y, z);
    return g;
  };
  const parts = [
    part(1.25, 0.62, 0.46, 0, 1.02, 0), part(0.28, 0.62, 0.24, 0.66, 1.3, 0, -0.5), part(0.5, 0.26, 0.24, 0.98, 1.0, 0, -0.9),
    part(0.08, 0.2, 0.06, 0.82, 1.2, 0.1), part(0.08, 0.2, 0.06, 0.82, 1.2, -0.1), part(0.12, 0.2, 0.1, -0.66, 1.14, 0),
  ];
  for (const [lx, lz] of [[0.45, 0.15], [0.45, -0.15], [-0.45, 0.15], [-0.45, -0.15]]) parts.push(part(0.1, 0.78, 0.1, lx, 0.39, lz));
  return mergeGeometries(parts.map((g) => g.toNonIndexed()))!;
}

const LEAF: [number, number, number][] = [[0.27, 0.42, 0.27], [0.24, 0.45, 0.32], [0.2, 0.5, 0.36], [0.33, 0.38, 0.22], [0.29, 0.4, 0.25]];
const BLOSSOM = [0xe0632a, 0xe8c547, 0xe58fb0];

export function buildSurroundings(parent: THREE.Object3D, o: SurroundingsOptions): { update(t: number): void } {
  const g = new THREE.Group();
  g.name = 'surroundings';
  parent.add(g);
  const r = rng(o.seed ?? 7);
  const [cx0, cz0, cx1, cz1] = o.clear;
  const ccx = (cx0 + cx1) / 2, ccz = (cz0 + cz1) / 2;
  const isClear = (x: number, z: number, extra = 0): boolean => x > cx0 - o.margin - extra && x < cx1 + o.margin + extra && z > cz0 - o.margin - extra && z < cz1 + o.margin + extra;

  // ground: one large lawn, lightly mottled
  const tex = grassTexture();
  tex.repeat.set(60, 60);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(700, 64), new THREE.MeshLambertMaterial({ color: 0x86b862, map: tex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(ccx, -0.06, ccz);
  ground.receiveShadow = true;
  g.add(ground);

  // a layered forest: near trees in front of buildings, a dense band behind, a far tree line
  const spots: [number, number, number, number][] = []; // x, z, scale, type
  const place = (count: number, rMin: number, rMax: number, sMin: number, sMax: number, tries = count * 6): void => {
    let made = 0;
    for (let k = 0; k < tries && made < count; k++) {
      const a = r() * Math.PI * 2, rr = rMin + Math.sqrt(r()) * (rMax - rMin);
      const x = ccx + Math.cos(a) * rr, z = ccz + Math.sin(a) * rr;
      if (isClear(x, z, 4)) continue;
      const t = r(), type = t < 0.45 ? 0 : t < 0.65 ? 1 : t < 0.78 ? 4 : t < 0.9 ? 3 : 2;
      spots.push([x, z, sMin + r() * (sMax - sMin), type]);
      made++;
    }
  };
  place(o.nearCount ?? 150, o.nearMin ?? Math.max(18, Math.hypot(cx1 - cx0, cz1 - cz0) / 2 + o.margin), 75, 0.9, 1.5);
  place(260, 75, 160, 1.1, 1.9);
  place(170, 160, 260, 1.8, 3.0);
  const byType: number[][] = [[], [], [], [], []];
  spots.forEach((s, i) => byType[s[3]].push(i));
  const leafMat = new THREE.MeshLambertMaterial({ flatShading: true });
  const palmMat = new THREE.MeshLambertMaterial({ flatShading: true, side: THREE.DoubleSide });
  const barkMat = new THREE.MeshLambertMaterial({ color: 0x6b4f3a });
  const ob = new THREE.Object3D(), col = new THREE.Color();
  byType.forEach((list, type) => {
    if (!list.length) return;
    const crowns = new THREE.InstancedMesh(crownGeometry(type), type === 2 ? palmMat : leafMat, list.length);
    const trunks = new THREE.InstancedMesh(trunkGeometry(type), barkMat, list.length);
    list.forEach((si, k) => {
      const [x, z, s] = spots[si];
      ob.position.set(x, 0, z);
      ob.rotation.set(0, r() * Math.PI * 2, 0);
      ob.scale.set(s * (0.9 + r() * 0.2), s * (0.9 + r() * 0.3), s * (0.9 + r() * 0.2));
      ob.updateMatrix();
      crowns.setMatrixAt(k, ob.matrix);
      trunks.setMatrixAt(k, ob.matrix);
      if ((type === 0 || type === 1) && r() < 0.06) col.setHex(BLOSSOM[Math.floor(r() * BLOSSOM.length)]);
      else { const [h, sat, l] = LEAF[type]; col.setHSL(h + (r() - 0.5) * 0.04, sat, l + (r() - 0.5) * 0.09); }
      crowns.setColorAt(k, col);
    });
    crowns.castShadow = true;
    g.add(crowns, trunks);
  });

  // campus blocks rising above the trees, mostly behind and to the sides of the room
  const blocks = 6;
  for (let k = 0; k < blocks; k++) {
    const a = -Math.PI / 2 + (k - (blocks - 1) / 2) * 0.55 + (r() - 0.5) * 0.2;
    const rr = 95 + r() * 60;
    const x = ccx + Math.cos(a) * rr, z = ccz + Math.sin(a) * rr;
    backdropBuilding(g, x, z, 18 + r() * 20, 12 + r() * 12, 10 + r() * 6, -a + Math.PI / 2);
  }

  // clouds: soft low-poly puffs that drift slowly
  const puff = new THREE.IcosahedronGeometry(1, 1);
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xdfe7ee, emissiveIntensity: 0.35, flatShading: true, transparent: true, opacity: 0.92, fog: false });
  const cloudParts: number[] = [];
  const clouds: { x: number; z: number; y: number; speed: number; parts: [number, number, number, number][] }[] = [];
  for (let c = 0; c < 14; c++) {
    const a = r() * Math.PI * 2, rr = 140 + r() * 260;
    const parts: [number, number, number, number][] = [];
    const n = 4 + Math.floor(r() * 4);
    for (let p = 0; p < n; p++) parts.push([(p - n / 2) * (6 + r() * 4), r() * 4, (r() - 0.5) * 8, 7 + r() * 7]);
    clouds.push({ x: ccx + Math.cos(a) * rr, z: ccz + Math.sin(a) * rr, y: 48 + r() * 42, speed: 1.2 + r() * 1.5, parts });
    cloudParts.push(n);
  }
  const cloudMesh = new THREE.InstancedMesh(puff, cloudMat, cloudParts.reduce((s, n) => s + n, 0));
  cloudMesh.frustumCulled = false;
  g.add(cloudMesh);
  const placeClouds = (t: number): void => {
    let i = 0;
    for (const c of clouds) {
      // drift east and wrap around the scene
      const dx = ((c.x - ccx + t * c.speed + 420) % 840) - 420;
      for (const [px, py, pz, s] of c.parts) {
        ob.position.set(ccx + dx + px, c.y + py, c.z + pz);
        ob.rotation.set(0, 0, 0);
        ob.scale.set(s, s * 0.62, s);
        ob.updateMatrix();
        cloudMesh.setMatrixAt(i++, ob.matrix);
      }
    }
    cloudMesh.instanceMatrix.needsUpdate = true;
  };
  placeClouds(0);

  // a few deer grazing on the lawns around outdoor rooms
  let deer: THREE.InstancedMesh | null = null;
  const herd: { x: number; z: number; h: number; phase: number }[] = [];
  if (o.deer) {
    const base = Math.max(cx1 - cx0, cz1 - cz0) / 2 + o.margin + 4;
    for (let k = 0; k < 60 && herd.length < 5; k++) {
      // on the lawns to either side of the room, a little behind it, where the camera can see them
      const a = (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.9 - (r() < 0.5 ? 0.25 : -0.25);
      const rr = base + r() * 14;
      const x = ccx + Math.cos(a) * rr, z = ccz - Math.abs(Math.sin(a)) * rr * 0.6;
      if (isClear(x, z, 3) || spots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 3)) continue;
      herd.push({ x, z, h: r() * Math.PI * 2, phase: r() * 10 });
    }
    deer = new THREE.InstancedMesh(deerGeometry(), new THREE.MeshLambertMaterial(), herd.length);
    for (let k = 0; k < herd.length; k++) deer.setColorAt(k, col.setHex(k % 3 === 0 ? 0x3b2f27 : 0xb3743d));
    deer.castShadow = true;
    g.add(deer);
  }
  const placeDeer = (t: number): void => {
    if (!deer) return;
    herd.forEach((d, k) => {
      ob.position.set(d.x, 0, d.z);
      // turn slowly now and then while grazing
      ob.rotation.set(0, d.h + Math.sin(t * 0.15 + d.phase) * 0.6, 0);
      ob.scale.setScalar(1);
      ob.updateMatrix();
      deer!.setMatrixAt(k, ob.matrix);
    });
    deer.instanceMatrix.needsUpdate = true;
  };
  placeDeer(0);

  return {
    update(t: number) {
      placeClouds(t);
      placeDeer(t);
    },
  };
}
