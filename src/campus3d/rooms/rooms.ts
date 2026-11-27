/**
 * Procedural 3D versions of the seven Sahej-Shala study rooms. Each room places a chair, stool,
 * bench or terrace spot for every seat id in src/constants/locations.ts, so presence, timers and
 * seat choice stay shared with the 2D rooms. Rooms open toward +z, where the camera starts.
 */
import * as THREE from 'three';
import { C, add, backdropBuilding, bench, bookStack, bookshelf, box, chair, cyl, deskLamp, flowers, hedge, mat, plant, roundTable, stool, table, tiledFloor, tree, wallClock, wallWithOpenings, windowWall } from './kit';
import { annularSector, buildBanyan, elephant, textPlane } from '../landmarks';
import { buildSurroundings } from './surroundings';

export interface RoomBuild {
  group: THREE.Group;
  /** where each seat's avatar sits (torso height) */
  anchors: Map<string, THREE.Vector3>;
  indoor: boolean;
  view: { pos: [number, number, number]; target: [number, number, number] };
  /** the camera is kept inside this box */
  bounds: { x: [number, number]; y: [number, number]; z: [number, number] };
  maxDistance: number;
  /** materials that glow at night */
  glow: THREE.MeshStandardMaterial[];
  /** interior lights, brighter at night */
  lights: THREE.PointLight[];
  /** per-frame animation of the surroundings (clouds, deer) */
  update?: (t: number) => void;
}

function newRoom(indoor: boolean): RoomBuild {
  return {
    group: new THREE.Group(), anchors: new Map(), indoor, glow: [], lights: [],
    view: { pos: [0, 3, 10], target: [0, 0.8, 0] }, bounds: { x: [-20, 20], y: [0.6, 12], z: [-20, 20] }, maxDistance: 16,
  };
}
/** records a seat anchor at seat height above (x, z) on a floor at height y */
function seat(r: RoomBuild, id: string, x: number, z: number, y = 0): void {
  r.anchors.set(id, new THREE.Vector3(x, y + 0.95, z));
}
const facing = (fromX: number, fromZ: number, toX: number, toZ: number): number => Math.atan2(toX - fromX, toZ - fromZ);

function ceilingLight(r: RoomBuild, x: number, y: number, z: number, w: number, d: number): void {
  const m = new THREE.MeshStandardMaterial({ color: 0xfffaf0, emissive: 0xfff4dc, emissiveIntensity: 0.4 });
  r.glow.push(m);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), m);
  panel.position.set(x, y, z);
  r.group.add(panel);
}
function pointLight(r: RoomBuild, x: number, y: number, z: number, color = 0xffe2b0): void {
  const l = new THREE.PointLight(color, 0, 22, 1.6);
  l.position.set(x, y, z);
  r.group.add(l);
  r.lights.push(l);
}
function outdoorTrees(g: THREE.Object3D, list: [number, number, number, number?][]): void {
  for (const [x, z, s, t] of list) tree(g, x, z, s, t ?? 0, t === 1 ? 0x5b9644 : t === 3 ? 0x3f7a3a : 0x4d8a3c);
}

/* ================================================================== */
/* Central Library                                                     */
/* ================================================================== */
function library(): RoomBuild {
  const r = newRoom(true);
  const g = r.group;
  const W = 18, D = 14, H = 6;
  tiledFloor(g, W, D + 4, '#f2ebe0', '#e2d8c8', 1.4, 0, 2);
  // back window wall and outdoor view
  windowWall(g, 0, -D / 2, 0, W, H, { x0: -6.2, x1: 6.2, y0: 0.5, y1: 5.3, cols: 6, rows: 3 });
  // entrance wall behind the camera: glass double doors, two windows, the library's name and a clock
  wallWithOpenings(g, 0, 10.88, Math.PI, W, H, [
    { x0: -1.5, x1: 1.5, y0: 0, y1: 2.9, kind: 'door' },
    { x0: -7.2, x1: -3.4, y0: 1.1, y1: 3.9, kind: 'window' },
    { x0: 3.4, x1: 7.2, y0: 1.1, y1: 3.9, kind: 'window' },
  ]);
  {
    const name = textPlane(5.2, 0.7, ['CENTRAL LIBRARY'], '#2d5a43');
    name.position.set(0, 3.55, 10.72);
    name.rotation.y = Math.PI;
    g.add(name);
    wallClock(g, 0, 4.7, 10.72, Math.PI, 0.42);
    for (const x of [-2.3, 2.3]) plant(g, x, 10.2, 0.9);
    bookshelf(g, -5.3, 10.45, Math.PI, 3.6, 0.95);
    bookshelf(g, 5.3, 10.45, Math.PI, 3.6, 0.95);
  }
  box(g, W, 0.3, D + 4, C.white, 0, H, 2); // ceiling
  for (const sx of [-1, 1]) {
    box(g, 0.3, H, D + 4, C.wall, sx * (W / 2), 0, 2); // side walls
    box(g, 1.1, H, 0.8, C.white, sx * 6.8, 0, -D / 2 + 0.3); // pillars
    // green banners with a leaf mark
    const banner = box(g, 1.0, 1.9, 0.04, 0x5f9a7e, sx * 6.8, 3.2, -D / 2 + 0.72);
    banner.castShadow = false;
    bookshelf(g, sx * (W / 2 - 0.4), -1.2, -sx * Math.PI / 2, 9, 3.1);
    plant(g, sx * 5.4, -D / 2 + 1.3, 1.5);
  }
  // the campus outside the window wall: lawn, layered trees and a teaching block beyond
  // through the windows: an open lawn, a few framing trees, a teaching block and sky beyond
  r.update = buildSurroundings(g, { clear: [-9.5, -7.5, 9.5, 11.5], margin: 9, nearMin: 42, nearCount: 70, seed: 11 }).update;
  outdoorTrees(g, [[-13, -27, 1.2, 1], [12, -29, 1.1, 1], [-4, -44, 1.0], [6, -47, 1.0, 4]]);
  backdropBuilding(g, -3, -66, 34, 12, 10);
  flowers(g, Array.from({ length: 50 }, (_, i) => [-10 + i * 0.4, -10.5 + Math.sin(i * 1.3) * 0.3] as [number, number]));
  // low bookshelf with plants along the windows
  bookshelf(g, 0, -D / 2 + 1.2, 0, 7, 1.3);
  for (const x of [-2.8, 2.8]) plant(g, x, -D / 2 + 1.25, 0.6, 1.32);
  for (const x of [-4.6, 4.6]) plant(g, x, -D / 2 + 1.6, 0.75);

  const lit: THREE.MeshStandardMaterial[] = r.glow;
  // front tables: chairs only on the near side, as in the illustration
  const front = [[-4.2, 'lib-cubicle-01', 'lib-cubicle-02'], [4.2, 'lib-cubicle-03', 'lib-cubicle-04']] as const;
  for (const [cx, a, b] of front) {
    table(g, cx, 2.3, 4.6, 1.7);
    deskLamp(g, cx - 1.6, 0.8, 2.0, lit);
    plant(g, cx + 0.2, 2.1, 0.45, 0.8);
    bookStack(g, cx + 1.4, 0.8, 2.4, 0.3);
    for (const [id, x] of [[a, cx - 1.2], [b, cx + 1.2]] as const) { chair(g, x, 3.45, Math.PI); seat(r, id, x, 3.45); }
  }
  // back tables: four chairs on the near side, three on the far side
  const back = [
    [-3.8, ['lib-mid-w-plant', 'lib-table-01', 'lib-mid-w-center', 'lib-table-02'], ['lib-back-w-01', 'lib-window-01', 'lib-back-w-03']],
    [3.8, ['lib-table-03', 'lib-mid-e-center', 'lib-armchair', 'lib-mid-e-plant'], ['lib-back-e-01', 'lib-window-02', 'lib-back-e-03']],
  ] as const;
  for (const [cx, near, far] of back) {
    table(g, cx, -1.7, 4.4, 1.5);
    deskLamp(g, cx + 1.5, 0.8, -1.9, lit);
    deskLamp(g, cx - 1.7, 0.8, -1.5, lit);
    bookStack(g, cx, 0.8, -1.6);
    near.forEach((id, i) => { const x = cx - 1.65 + i * 1.1; chair(g, x, -0.65, Math.PI); seat(r, id, x, -0.65); });
    far.forEach((id, i) => { const x = cx - 1.1 + i * 1.1; chair(g, x, -2.75, 0); seat(r, id, x, -2.75); });
  }
  for (let i = 0; i < 3; i++) ceilingLight(r, -5 + i * 5, H - 0.05, 0.5, 2.2, 0.8);
  pointLight(r, -4, 4.5, 1);
  pointLight(r, 4, 4.5, 1);
  r.view = { pos: [0, 2.6, 9.6], target: [0, 1.0, -1.5] };
  r.bounds = { x: [-8.4, 8.4], y: [0.9, H - 0.4], z: [-6.2, 10.55] };
  r.maxDistance = 13;
  return r;
}

/* ================================================================== */
/* Lecture Hall Complex                                                */
/* ================================================================== */
function lhc(): RoomBuild {
  const r = newRoom(true);
  const g = r.group;
  const W = 20, D = 18, H = 7;
  tiledFloor(g, W, D + 4, '#efe3cf', '#e0d2bb', 1.6, 0, 1);
  box(g, W, 0.3, D + 4, C.white, 0, H, 1);
  box(g, W, H, 0.3, C.wall, 0, 0, -D / 2);
  for (const sx of [-1, 1]) windowWall(g, sx * (W / 2), 0, -sx * Math.PI / 2, D + 4, H, { x0: -4, x1: 6, y0: 1.2, y1: 5.2, cols: 3, rows: 2 }, C.wall);
  // back wall of the hall: entrance doors at both corners with exit signs, high windows and a clock
  wallWithOpenings(g, 0, 10.9, Math.PI, W, H, [
    { x0: -8.6, x1: -6.4, y0: 0, y1: 2.7, kind: 'door' },
    { x0: 6.4, x1: 8.6, y0: 0, y1: 2.7, kind: 'door' },
    { x0: -5.2, x1: -1.2, y0: 3.6, y1: 5.8, kind: 'window' },
    { x0: 1.2, x1: 5.2, y0: 3.6, y1: 5.8, kind: 'window' },
  ], C.wall);
  {
    const exitMat = new THREE.MeshStandardMaterial({ color: 0x1f8a4c, emissive: 0x2fd36b, emissiveIntensity: 0.6 });
    r.glow.push(exitMat);
    for (const x of [-7.5, 7.5]) {
      add(g, new THREE.BoxGeometry(0.9, 0.32, 0.08), exitMat, x, 3.05, 10.74, { cast: false });
      const word = textPlane(0.7, 0.22, ['EXIT'], '#ffffff');
      word.position.set(x, 3.05, 10.69);
      word.rotation.y = Math.PI;
      g.add(word);
    }
    wallClock(g, 0, 4.7, 10.74, Math.PI, 0.5);
  }
  r.update = buildSurroundings(g, { clear: [-10.5, -10, 10.5, 13], margin: 8, nearMin: 40, nearCount: 80, seed: 21 }).update;
  outdoorTrees(g, [[-24, -6, 1.2, 1], [-27, 8, 1.1], [24, -5, 1.2, 4], [27, 9, 1.1, 1]]);
  // stage, chalkboard, podium
  box(g, 14, 0.5, 4, 0xe7c48f, 0, 0, -D / 2 + 2.2);
  box(g, 15, 0.12, 4.4, 0xd4ad74, 0, 0.5, -D / 2 + 2.2);
  box(g, 10, 3.2, 0.12, 0x2f5a44, 0, 1.8, -D / 2 + 0.2);
  box(g, 10.4, 0.15, 0.25, 0xc8a06a, 0, 1.75, -D / 2 + 0.25);
  for (const sx of [-1, 1]) {
    box(g, 0.9, 1.3, 0.6, 0x2b2d30, sx * 6.6, 3.3, -D / 2 + 0.5);
    plant(g, sx * 7.6, -D / 2 + 1.6, 1.4, 0.62);
    plant(g, sx * 5.4, -D / 2 + 1.2, 0.7, 0.62);
  }
  box(g, 4.2, 1.05, 1.0, 0xd9a96a, 0, 0.62, -D / 2 + 3.0);
  chair(g, 0, -D / 2 + 2.1, 0, 0x2b2d30, 0.62);
  for (const [id, x] of [['lhc-podium', -1.3], ['lhc-podium-02', 1.3]] as const) { chair(g, x, -D / 2 + 2.1, 0, C.chairBlue, 0.62); seat(r, id, x, -D / 2 + 2.1, 0.62); }
  // tiered rows: the row nearest the stage is lowest; rows nearer the camera rise and, as in the
  // illustration, show fewer chairs per side
  const rows: { z: number; y: number; west: string[]; east: string[] }[] = [
    { z: -3.2, y: 0, west: ['lhc-r5-w-01', 'lhc-r5-w-02', 'lhc-r5-w-03', 'lhc-r5-w-04', 'lhc-r5-w-05'], east: ['lhc-r5-e-01', 'lhc-r5-e-02', 'lhc-r5-e-03', 'lhc-r5-e-04', 'lhc-r5-e-05'] },
    { z: -1.4, y: 0.35, west: ['lhc-r4-w-01', 'lhc-r4-w-02', 'lhc-r4-w-03', 'lhc-r4-w-04', 'lhc-r4-w-05'], east: ['lhc-r4-e-01', 'lhc-r4-e-02', 'lhc-r4-e-03', 'lhc-r4-e-04', 'lhc-r4-e-05'] },
    { z: 0.4, y: 0.7, west: ['lhc-r3-w-01', 'lhc-r3-w-02', 'lhc-balcony', 'lhc-r3-w-04'], east: ['lhc-r3-e-01', 'lhc-r3-e-02', 'lhc-r3-e-03', 'lhc-r3-e-04'] },
    { z: 2.2, y: 1.05, west: ['lhc-r2-w-edge', 'lhc-hall1-01', 'lhc-hall1-02'], east: ['lhc-hall1-03', 'lhc-hall1-04', 'lhc-r2-e-edge'] },
    { z: 4.0, y: 1.4, west: ['lhc-hall1-05', 'lhc-hall1-06'], east: ['lhc-crc-01', 'lhc-crc-02'] },
  ];
  const SP = 1.5, AISLE = 1.6;
  for (const row of rows) {
    for (const side of [-1, 1]) {
      // riser platform across the whole side, and a long desk in front of the chairs
      if (row.y > 0) box(g, W / 2 - AISLE - 0.15, row.y, 1.8, 0x8f8a8c, side * (AISLE + (W / 2 - AISLE) / 2), 0, row.z); // carpeted riser
      const ids = side < 0 ? row.west : row.east;
      const n = ids.length;
      const deskW = n * SP + 0.4;
      // west ids run left→right (outer→aisle); east ids run aisle→outer
      const xs = ids.map((_, i) => (side < 0 ? -AISLE - (n - 1 - i) * SP - SP / 2 : AISLE + i * SP + SP / 2));
      const cx = (xs[0] + xs[n - 1]) / 2;
      table(g, cx, row.z - 0.75, deskW, 0.55, 0, 0.78, 0xd9a96a, row.y);
      ids.forEach((id, i) => { chair(g, xs[i], row.z, Math.PI, C.chairBlue, row.y); seat(r, id, xs[i], row.z, row.y); });
      // planters fill the short rows' outer ends
      if (n < 5) plant(g, side * (W / 2 - 1.2), row.z, 0.6, row.y);
    }
  }
  for (let i = 0; i < 3; i++) ceilingLight(r, 0, H - 0.05, -6 + i * 5, 8, 0.5);
  pointLight(r, -5, 5.5, -1);
  pointLight(r, 5, 5.5, -1);
  r.view = { pos: [0, 3.9, 9.8], target: [0, 1.3, -4.2] };
  r.bounds = { x: [-9.4, 9.4], y: [1.2, H - 0.4], z: [-7.5, 10.55] };
  r.maxDistance = 15;
  return r;
}

/* ================================================================== */
/* Campus Café                                                         */
/* ================================================================== */
function menuBoard(): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 420;
  const x = c.getContext('2d')!;
  x.fillStyle = '#3c3a36';
  x.fillRect(0, 0, 1024, 420);
  x.strokeStyle = '#c9a26a';
  x.lineWidth = 14;
  x.strokeRect(7, 7, 1010, 406);
  x.fillStyle = '#f4efe6';
  x.font = '600 44px "Josefin Sans", system-ui, sans-serif';
  x.fillText('Good Ideas', 70, 300);
  x.fillText('Better Coffee', 50, 350);
  x.strokeStyle = '#f4efe6';
  x.lineWidth = 6;
  x.strokeRect(110, 150, 120, 90);
  x.beginPath(); x.arc(250, 195, 26, -1.2, 1.2); x.stroke();
  x.font = '500 30px Inter, system-ui, sans-serif';
  const items = [['Espresso', '₹120', 'Mocha', '₹180'], ['Americano', '₹140', 'Cold Coffee', '₹150'], ['Cappuccino', '₹160', 'Masala Chai', '₹100'], ['Latte', '₹160', 'Green Tea', '₹90']];
  items.forEach((row, i) => {
    const y = 110 + i * 78;
    x.fillText(row[0], 380, y); x.fillText(row[1], 590, y);
    x.fillText(row[2], 700, y); x.fillText(row[3], 905, y);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.03), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
}

function cafe(): RoomBuild {
  const r = newRoom(true);
  const g = r.group;
  const W = 18, D = 13, H = 6;
  tiledFloor(g, W, D + 4, '#f1e6db', '#e5d6c8', 1.3, 0, 2);
  box(g, W, 0.3, D + 4, C.white, 0, H, 2);
  box(g, W, H, 0.3, 0xf6e6c8, 0, 0, -D / 2);
  for (const sx of [-1, 1]) windowWall(g, sx * (W / 2), 1, -sx * Math.PI / 2, D + 6, H, { x0: -6, x1: 7.2, y0: 0.4, y1: 5.4, cols: 4, rows: 2 }, 0xf6e6c8);
  // shop front behind the camera: glass doors in the middle, display windows either side, name above
  wallWithOpenings(g, 0, 10.4, Math.PI, W, H, [
    { x0: -1.3, x1: 1.3, y0: 0, y1: 2.8, kind: 'door' },
    { x0: -7.6, x1: -2.4, y0: 0.7, y1: 3.9, kind: 'window' },
    { x0: 2.4, x1: 7.6, y0: 0.7, y1: 3.9, kind: 'window' },
  ], 0xf6e6c8);
  {
    const name = textPlane(4.4, 0.75, ['CAMPUS CAFÉ'], '#845328');
    name.position.set(0, 3.5, 10.24);
    name.rotation.y = Math.PI;
    g.add(name);
    wallClock(g, 5.0, 4.75, 10.24, Math.PI, 0.38);
    for (const x of [-2.0, 2.0]) plant(g, x, 9.8, 0.8);
  }
  r.update = buildSurroundings(g, { clear: [-9.5, -7, 9.5, 12], margin: 8, nearMin: 38, nearCount: 80, seed: 31 }).update;
  outdoorTrees(g, [[-22, -4, 1.2, 1], [-24, 8, 1.1], [22, -3, 1.2], [24, 9, 1.1, 1]]);
  backdropBuilding(g, -48, 2, 10, 11, 26);
  backdropBuilding(g, 48, 4, 10, 12, 26);
  // counter, machines and the menu board
  box(g, 12, 1.05, 1.0, 0xd8a868, 0, 0, -D / 2 + 1.2);
  box(g, 12.2, 0.07, 1.1, 0xe9c48c, 0, 1.05, -D / 2 + 1.2);
  box(g, 1.3, 0.75, 0.6, 0x8e9396, 2.8, 1.12, -D / 2 + 1.1);
  box(g, 0.4, 0.85, 0.4, 0x2d2f32, 5.0, 1.12, -D / 2 + 1.1);
  box(g, 0.35, 0.55, 0.35, 0x2d2f32, -4.4, 1.12, -D / 2 + 1.1);
  const mb = menuBoard();
  mb.position.set(0, 3.9, -D / 2 + 0.17);
  g.add(mb);
  // pendant lamps
  for (const px of [-6.5, -3.6, 0, 3.6, 6.5]) {
    add(g, new THREE.CylinderGeometry(0.01, 0.01, 1.8, 4), mat(0x2d2f32), px, H - 0.9, -1.5, { cast: false });
    const shade = new THREE.MeshStandardMaterial({ color: 0x2f3b37, roughness: 0.5, emissive: 0xffd9a0, emissiveIntensity: 0, side: THREE.DoubleSide });
    r.glow.push(shade);
    add(g, new THREE.ConeGeometry(0.45, 0.4, 16, 1, true), shade, px, H - 2.0, -1.5, { cast: false });
  }
  for (const [x, z, s] of [[-6.2, -4.6, 1.5], [6.4, -4.6, 1.5], [-3.6, -5.2, 1.0]] as [number, number, number][]) plant(g, x, z, s);
  // round tables with chairs turned toward them
  const tables: [number, number, [string, number, number][]][] = [
    [-4.3, 2.6, [['cafe-patio-01', -5.6, 3.7], ['cafe-patio-02', -2.9, 3.6]]],
    [-3.2, -0.9, [['cafe-bistro-01', -4.6, -0.5], ['cafe-counter-01', -1.8, -0.5]]],
    [3.2, -0.9, [['cafe-veranda-01', 1.8, -0.5], ['cafe-veranda-02', 4.6, -0.5]]],
    [4.3, 2.6, [['cafe-booth-01', 2.9, 3.6], ['cafe-booth-02', 5.6, 3.7]]],
  ];
  for (const [tx, tz, chairs] of tables) {
    roundTable(g, tx, tz, 1.1);
    plant(g, tx, tz, 0.35, 0.8);
    for (const [id, x, z] of chairs) { chair(g, x, z, facing(x, z, tx, tz)); seat(r, id, x, z); }
  }
  // window lounges: two armchairs facing each other across a low table
  for (const [sx, a, b] of [[-1, 'cafe-armchair', 'cafe-lounge-w'], [1, 'cafe-nook', 'cafe-lounge-e']] as const) {
    const tx = sx * 7.4, tz = -3.6;
    roundTable(g, tx, tz, 0.45, 0.45);
    plant(g, tx, tz, 0.25, 0.48);
    for (const [id, dz] of [[a, 1.0], [b, -1.0]] as const) {
      const x = tx, z = tz + dz;
      chair(g, x, z, facing(x, z, tx, tz), C.chairBlueDark);
      seat(r, id, x, z);
    }
  }
  pointLight(r, -3.5, 4.2, 0);
  pointLight(r, 3.5, 4.2, 0);
  r.view = { pos: [0, 2.7, 9.2], target: [0, 1.0, -1.2] };
  r.bounds = { x: [-8.4, 8.4], y: [0.9, H - 0.4], z: [-5.6, 10.05] };
  r.maxDistance = 13;
  return r;
}

/* ================================================================== */
/* Banyan Tree Study Grove                                             */
/* ================================================================== */
function banyan(): RoomBuild {
  const r = newRoom(false);
  const g = r.group;
  r.update = buildSurroundings(g, { clear: [-12, -18, 12, 8], margin: 6, deer: true, seed: 41 }).update;
  tiledFloor(g, 22, 15, '#e9ded4', '#d9ccc0', 1.5, 0, 1);
  // pergola: two front columns, beams and slats overhead
  for (const sx of [-1, 1]) {
    box(g, 0.8, 4.6, 0.8, C.cream, sx * 7.6, 0, 4.5);
    box(g, 0.8, 4.6, 0.8, C.cream, sx * 7.6, 0, -4.8);
    box(g, 0.5, 0.5, 10.2, 0xb27a45, sx * 7.6, 4.6, -0.15);
  }
  for (let i = 0; i < 8; i++) box(g, 16.4, 0.18, 0.28, 0xc08a52, 0, 5.1, -4.4 + i * 1.25);
  box(g, 16.6, 0.4, 0.5, 0xb27a45, 0, 4.6, 4.5);
  box(g, 16.6, 0.4, 0.5, 0xb27a45, 0, 4.6, -4.8);
  // banyans and greenery behind
  for (const [x, z, s] of [[-6, -15, 0.55], [7, -16, 0.6]] as [number, number, number][]) {
    const b = buildBanyan();
    b.position.set(x, 0, z);
    b.scale.setScalar(s);
    g.add(b);
  }
  hedge(g, 0, -7.2, 24, 1.3, 1.2);
  flowers(g, Array.from({ length: 40 }, (_, i) => [-11 + i * 0.55, -6.5 + Math.sin(i * 1.7) * 0.25] as [number, number]));
  outdoorTrees(g, [[-16, -8, 1.4, 1], [16, -9, 1.4, 1], [-18, 2, 1.2], [18, 3, 1.2], [-13, -22, 1.6, 4], [13, -24, 1.6, 4]]);
  backdropBuilding(g, -20, -30, 16, 10, 8);
  backdropBuilding(g, 20, -30, 16, 9, 8);
  // tables and stools
  const sets: [number, number, number, [string, number, number][]][] = [
    [-4.6, 2.1, 1.4, [['banyan-lawn-03', -6.5, 1.6], ['banyan-lawn-01', -5.6, 3.8], ['banyan-lawn-02', -2.7, 3.1]]],
    [-2.8, -1.5, 1.0, [['banyan-stone-01', -4.3, -0.9], ['banyan-stone-03', -1.2, -1.0]]],
    [2.8, -1.5, 1.0, [['banyan-stone-04', 1.2, -1.0], ['banyan-stone-02', 4.3, -0.9]]],
    [4.6, 2.1, 1.4, [['banyan-picnic-01', 2.7, 3.1], ['banyan-picnic-02', 5.6, 3.8], ['banyan-picnic-03', 6.5, 1.6]]],
  ];
  for (const [tx, tz, tr, stools] of sets) {
    roundTable(g, tx, tz, tr, 0.78, 0xd29a5a);
    for (const [id, x, z] of stools) { stool(g, x, z); seat(r, id, x, z); }
  }
  // benches
  bench(g, 0, -5.2, 0, 2.6);
  seat(r, 'banyan-canopy-01', -0.6, -5.15);
  seat(r, 'banyan-hammock', 0.6, -5.15);
  bench(g, -9.6, -2.6, Math.PI / 2 - 0.25, 2.0);
  seat(r, 'banyan-quiet', -9.55, -2.6);
  bench(g, 9.6, -2.6, -Math.PI / 2 + 0.25, 2.0);
  seat(r, 'banyan-sunbeam', 9.55, -2.6);
  r.view = { pos: [0, 3.0, 12.5], target: [0, 3.2, -5] };
  r.bounds = { x: [-26, 26], y: [0.9, 20], z: [-26, 30] };
  r.maxDistance = 22;
  return r;
}

/* ================================================================== */
/* Open Air Theatre                                                    */
/* ================================================================== */
function oat(): RoomBuild {
  const r = newRoom(false);
  const g = r.group;
  r.update = buildSurroundings(g, { clear: [-18, -26, 18, 10], margin: 6, deer: true, seed: 51 }).update;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7.6, 64), new THREE.MeshStandardMaterial({ color: 0xeadfcd, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  g.add(floor);
  const lawnRing = new THREE.Mesh(new THREE.RingGeometry(7.6, 8.0, 64), new THREE.MeshLambertMaterial({ color: 0x6fae55 }));
  lawnRing.rotation.x = -Math.PI / 2;
  lawnRing.position.y = 0.03;
  g.add(lawnRing);
  // terraces wrap around the floor, opening toward the camera; stairs at the back centre
  const tiers = 5, R0 = 8.0, STEP = 1.7, RISE = 0.48;
  const stone = mat(0xe8dcc6, 0.9), stone2 = mat(0xdcceb5, 0.9), planter = new THREE.MeshLambertMaterial({ color: 0x5e9c46, flatShading: true });
  const bowl = new THREE.Group();
  bowl.rotation.y = Math.PI / 2; // sector arcs are built around local +x; turn them to face −z
  g.add(bowl);
  const gap = THREE.MathUtils.degToRad(12), span = THREE.MathUtils.degToRad(112);
  for (let i = 0; i < tiers; i++) {
    const r0 = R0 + i * STEP;
    for (const [a0, a1] of [[gap, span], [-span, -gap]]) {
      const m = new THREE.Mesh(annularSector(r0, r0 + STEP, a0, a1, (i + 1) * RISE), i % 2 ? stone2 : stone);
      m.castShadow = true;
      m.receiveShadow = true;
      bowl.add(m);
      if (i < tiers - 1) {
        const p = new THREE.Mesh(annularSector(r0 + STEP - 0.45, r0 + STEP - 0.05, a0, a1, (i + 1) * RISE + 0.28), planter);
        bowl.add(p);
      }
    }
  }
  // central stairs up to the pavilion
  for (let i = 0; i < tiers * 2; i++) {
    const m = new THREE.Mesh(annularSector(R0 + i * STEP * 0.5, R0 + (i + 1) * STEP * 0.5, -gap, gap, (i + 1) * RISE * 0.5), stone);
    m.receiveShadow = true;
    m.castShadow = true;
    bowl.add(m);
  }
  const Rtop = R0 + tiers * STEP;
  // pavilion with a dome and the institute plaque
  const pav = new THREE.Group();
  pav.position.set(0, tiers * RISE, -(Rtop + 3.2));
  g.add(pav);
  cyl(pav, 3.6, 3.8, 0.5, 0xe6dccb, 0, 0, 0, 32);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    cyl(pav, 0.22, 0.25, 3.6, C.cream, Math.cos(a) * 3.0, 0.5, Math.sin(a) * 3.0, 12);
  }
  cyl(pav, 3.5, 3.5, 0.5, 0xe6dccb, 0, 4.1, 0, 32);
  add(pav, new THREE.SphereGeometry(3.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe9dfcf, 0.85), 0, 4.55, 0).scale.y = 0.45;
  box(pav, 2.4, 2.2, 0.35, 0x8b8f93, 0, 0.5, 0);
  const plaque = textPlane(2.0, 1.0, ['IIT', 'MADRAS'], '#efe6d2');
  plaque.position.set(0, 1.75, 0.19);
  pav.add(plaque);
  // low back wall, trees and buildings around the bowl
  for (const [a0, a1] of [[gap, span], [-span, -gap]]) {
    const wall = new THREE.Mesh(annularSector(Rtop + 0.2, Rtop + 0.7, a0, a1, tiers * RISE + 1.0), mat(0xe1d4bc, 0.9));
    wall.castShadow = true;
    bowl.add(wall);
  }
  outdoorTrees(g, [[-18, -10, 1.8, 1], [-12, -20, 1.6], [12, -21, 1.7, 1], [19, -9, 1.7], [-22, 2, 1.4, 4], [22, 3, 1.5, 4], [-6, -26, 1.6, 4], [7, -27, 1.6]]);
  backdropBuilding(g, 26, -18, 14, 12, 10, -0.5);
  // lamp post
  cyl(g, 0.08, 0.1, 4, 0x2f3336, -10.5, 0, 6);
  const lampM = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, emissive: 0xffe2a0, emissiveIntensity: 0 });
  r.glow.push(lampM);
  add(g, new THREE.SphereGeometry(0.28, 12, 8), lampM, -10.5, 4.1, 6);
  // seats on the terraces: angle 0 is the back centre, negative angles to the west
  const onTier = (id: string, tier: number, deg: number): void => {
    const rr = R0 + tier * STEP + STEP * 0.45, a = THREE.MathUtils.degToRad(deg);
    seat(r, id, Math.sin(a) * rr, -Math.cos(a) * rr, (tier + 1) * RISE);
  };
  onTier('oat-tier-lower-01', 0, -82); onTier('oat-tier-lower-04', 0, -58); onTier('oat-tier-lower-02', 0, -32);
  onTier('oat-tier-lower-03', 0, 32); onTier('oat-tier-lower-05', 0, 58); onTier('oat-stage-02', 0, 82);
  onTier('oat-tier-mid-01', 2, -86); onTier('oat-tier-mid-04', 2, -56); onTier('oat-tier-mid-05', 2, 56); onTier('oat-tier-top-01', 2, 86);
  onTier('oat-tier-upper-01', 4, -64); onTier('oat-tier-upper-02', 4, 64);
  const stair = (id: string, step: number, x: number): void => {
    const rr = R0 + step * STEP * 0.5 + STEP * 0.25;
    seat(r, id, x, -rr, (step + 1) * RISE * 0.5);
  };
  stair('oat-tier-mid-02', 5, -0.9);
  stair('oat-tier-mid-03', 5, 0.9);
  stair('oat-stage-01', 9, 0);
  seat(r, 'oat-tier-top-02', 0, -(Rtop + 1.6), tiers * RISE + 0.5);
  r.view = { pos: [0, 6.2, 12.5], target: [0, 2.0, -7.5] };
  r.bounds = { x: [-30, 30], y: [1.0, 26], z: [-30, 32] };
  r.maxDistance = 30;
  return r;
}

/* ================================================================== */
/* Sangam Gardens                                                      */
/* ================================================================== */
function park(): RoomBuild {
  const r = newRoom(false);
  const g = r.group;
  r.update = buildSurroundings(g, { clear: [-16, -10, 16, 12], margin: 6, deer: true, seed: 61 }).update;
  tiledFloor(g, 30, 18, '#ece3d6', '#ddd1c2', 1.6, 0, 2);
  // octagonal gazebo
  const gz = new THREE.Group();
  gz.position.set(0, 0, -2.4);
  g.add(gz);
  add(gz, new THREE.CylinderGeometry(5.6, 5.8, 0.4, 8), mat(0xcfc8bc, 0.9), 0, 0.2, 0).rotation.y = Math.PI / 8;
  add(gz, new THREE.CylinderGeometry(6.0, 6.0, 0.18, 8), mat(0xbfb8ad, 0.9), 0, 0.09, 0).rotation.y = Math.PI / 8;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (Math.abs(Math.sin(a)) < 0.1 && Math.cos(a) > 0) continue; // keep the front entrance open
    cyl(gz, 0.28, 0.32, 4.0, C.cream, Math.sin(a) * 5.0, 0.4, Math.cos(a) * 5.0, 12);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(gz, 0.5, 0.5, 0.5, C.cream, Math.sin(a) * 5.0, 0.4, Math.cos(a) * 5.0);
  }
  add(gz, new THREE.CylinderGeometry(5.6, 5.6, 0.45, 8, 1, true), mat(C.cream), 0, 4.6, 0).rotation.y = Math.PI / 8;
  const roof = add(gz, new THREE.ConeGeometry(7.0, 3.0, 8), mat(0xc8743f, 0.8), 0, 6.3, 0);
  roof.rotation.y = Math.PI / 8;
  cyl(gz, 0.12, 0.2, 0.7, 0xa85f33, 0, 7.8, 0, 8);
  // benches inside the gazebo
  bench(gz, 0, -3.7, 0, 2.6, 0.4);
  seat(r, 'park-fountain-01', -0.55, -2.4 - 3.65, 0.4);
  seat(r, 'park-fountain-03', 0.55, -2.4 - 3.65, 0.4);
  for (const [id, x, z, ry] of [['park-trellis', -3.0, -2.4, 0.9], ['park-pondside', 3.0, -2.4, -0.9]] as const) {
    bench(gz, x, z, ry, 1.8, 0.4);
    seat(r, id, x, z - 2.4, 0.4);
  }
  for (const [id, x, z, ry] of [['park-fountain-02', -3.3, 1.2, 1.9], ['park-picnic-01', 3.3, 1.2, -1.9]] as const) {
    bench(gz, x, z, ry, 1.8, 0.4);
    seat(r, id, x, z - 2.4, 0.4);
  }
  // garden benches, flower beds, lamp and trees
  bench(g, -9.6, -0.6, 0.5, 2.2);
  seat(r, 'park-path-01', -9.6, -0.6);
  bench(g, 9.6, -0.6, -0.5, 2.2);
  seat(r, 'park-rain-tree', 9.6, -0.6);
  for (const sx of [-1, 1]) {
    const bed = new THREE.Mesh(new THREE.CircleGeometry(4.5, 32), new THREE.MeshLambertMaterial({ color: 0x6fae55 }));
    bed.rotation.x = -Math.PI / 2;
    bed.scale.set(1.3, 0.8, 1);
    bed.position.set(sx * 10.5, 0.04, 6.5);
    g.add(bed);
    flowers(g, Array.from({ length: 60 }, (_, i) => { const a = i * 2.4, rr = 0.6 + (i % 7) * 0.55; return [sx * 10.5 + Math.cos(a) * rr * 1.3, 6.5 + Math.sin(a) * rr * 0.8] as [number, number]; }));
    hedge(g, sx * 12.5, -4, 6, 1.1, 1.6);
  }
  cyl(g, 0.09, 0.12, 4.6, 0x3a3f42, 13.5, 0, -1);
  const lampM = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, emissive: 0xffe2a0, emissiveIntensity: 0 });
  r.glow.push(lampM);
  add(g, new THREE.CylinderGeometry(0.3, 0.2, 0.55, 8), lampM, 13.5, 4.85, -1);
  outdoorTrees(g, [[-14, -8, 1.8, 1], [14, -9, 1.8, 1], [-7, -14, 1.5], [7, -15, 1.6], [-20, 2, 1.6, 1], [20, 1, 1.6]]);
  backdropBuilding(g, 0, -28, 30, 9, 8);
  r.view = { pos: [0, 4.2, 15], target: [0, 1.6, -2.5] };
  r.bounds = { x: [-28, 28], y: [1.0, 22], z: [-26, 30] };
  r.maxDistance = 24;
  return r;
}

/* ================================================================== */
/* Gajendra Circle                                                     */
/* ================================================================== */
function gc(): RoomBuild {
  const r = newRoom(false);
  const g = r.group;
  r.update = buildSurroundings(g, { clear: [-14, -14, 14, 14], margin: 6, deer: true, seed: 71 }).update;
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(13, 64), new THREE.MeshStandardMaterial({ color: 0xeadfcf, roughness: 0.9 }));
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  g.add(plaza);
  // central island: lawn and flowers, then the elephant on its pedestal
  cyl(g, 7.2, 7.4, 0.35, 0xd8cdb9, 0, 0, 0, 48);
  cyl(g, 6.8, 6.8, 0.4, 0x6fae55, 0, 0, 0, 48);
  flowers(g, Array.from({ length: 120 }, (_, i) => { const a = (i / 120) * Math.PI * 2, rr = 5.2 + (i % 3) * 0.5; return [Math.cos(a) * rr, Math.sin(a) * rr] as [number, number]; }));
  cyl(g, 3.6, 3.9, 0.7, 0xd9d0bf, 0, 0.4, 0, 40);
  cyl(g, 2.8, 3.1, 0.9, 0xcbc2b0, 0, 1.1, 0, 32);
  const el = elephant(0x9a9ea3);
  el.position.set(0, 2.0, 0);
  el.rotation.y = -Math.PI / 2 + 0.5; // faces the camera, turned slightly
  el.scale.setScalar(1.05);
  g.add(el);
  // path from the front to the island
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 6), mat(0xe2d6c3, 0.9));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.42, 4.6);
  g.add(path);
  // benches around the promenade, turned toward the statue
  const around = (ids: string[], deg: number, rad: number, len: number): void => {
    const a = THREE.MathUtils.degToRad(deg);
    const x = Math.sin(a) * rad, z = Math.cos(a) * rad;
    const ry = facing(x, z, 0, 0);
    bench(g, x, z, ry, len);
    const tx = Math.cos(ry), tz = -Math.sin(ry); // bench's local +x in world space
    if (ids.length === 1) seat(r, ids[0], x, z);
    else ids.forEach((id, i) => seat(r, id, x + tx * (i ? 0.55 : -0.55), z + tz * (i ? 0.55 : -0.55)));
  };
  around(['gc-fountain-03', 'gc-fountain-01'], -48, 9.6, 2.4);
  around(['gc-fountain-02', 'gc-fountain-04'], 48, 9.6, 2.4);
  around(['gc-pergola-01'], -95, 11.6, 2.0);
  around(['gc-tree-02'], 95, 11.6, 2.0);
  around(['gc-pergola-02'], -140, 9.6, 2.0);
  around(['gc-tree-01'], 140, 9.6, 2.0);
  outdoorTrees(g, [[-16, -10, 1.6, 1], [16, -11, 1.7, 1], [-9, -17, 1.5, 3], [9, -17, 1.5, 3], [-20, -2, 1.5, 3], [20, -1, 1.6, 3], [-4, -22, 1.8, 1], [5, -23, 1.7], [-22, 9, 1.3], [22, 9, 1.3]]);
  backdropBuilding(g, -26, -12, 10, 14, 18, 0.4);
  backdropBuilding(g, 26, -12, 10, 13, 18, -0.4);
  r.view = { pos: [0, 5.5, 20], target: [0, 2.0, 0] };
  r.bounds = { x: [-30, 30], y: [1.0, 26], z: [-30, 34] };
  r.maxDistance = 28;
  return r;
}

const BUILDERS: Record<string, () => RoomBuild> = { library, lhc, cafe, banyan, oat, park, gc };

export function buildRoom(locationId: string): RoomBuild {
  return (BUILDERS[locationId] || library)();
}
