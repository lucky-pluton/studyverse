/** Small low-poly furniture and scenery kit shared by the 3D study rooms. Units are metres. */
import * as THREE from 'three';
import { crownGeometry, trunkGeometry } from '../world';

const cache = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: number, rough = 0.8, metal = 0, extra?: Partial<THREE.MeshStandardMaterialParameters>): THREE.MeshStandardMaterial {
  const k = `${color}|${rough}|${metal}|${extra ? JSON.stringify(extra) : ''}`;
  let m = cache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
    cache.set(k, m);
  }
  return m;
}

export const C = {
  oak: 0xd9a96a,
  oakDark: 0xb98448,
  wood: 0x9a6a3f,
  woodDark: 0x6e4a2c,
  chairBlue: 0x5b79b8,
  chairBlueDark: 0x47619b,
  cream: 0xf3ece0,
  white: 0xf7f5f0,
  wall: 0xf4ead8,
  stone: 0xe3d7c2,
  stoneDark: 0xc9bca5,
  green: 0x5f9a4b,
  leaf: 0x4f8f3f,
  leafLight: 0x7fb85a,
  metal: 0x4a5055,
  lampGreen: 0x7cbf4a,
  terracotta: 0xc8743f,
};

export function add(g: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, opts: { cast?: boolean; receive?: boolean; ry?: number } = {}): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  if (opts.ry) mesh.rotation.y = opts.ry;
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  g.add(mesh);
  return mesh;
}
/** box whose bottom sits at y */
export function box(g: THREE.Object3D, w: number, h: number, d: number, color: number | THREE.Material, x: number, y: number, z: number, ry = 0): THREE.Mesh {
  return add(g, new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? mat(color) : color, x, y + h / 2, z, { ry });
}
export function cyl(g: THREE.Object3D, rt: number, rb: number, h: number, color: number | THREE.Material, x: number, y: number, z: number, seg = 16): THREE.Mesh {
  return add(g, new THREE.CylinderGeometry(rt, rb, h, seg), typeof color === 'number' ? mat(color) : color, x, y + h / 2, z);
}

/** Places a group at (x, z) turned so its local +z faces direction ry. */
function placed(parent: THREE.Object3D, x: number, y: number, z: number, ry: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

/* ---------------- furniture ---------------- */

/** Upholstered chair. The sitter faces local +z. */
export function chair(p: THREE.Object3D, x: number, z: number, ry: number, color = C.chairBlue, y = 0): void {
  const g = placed(p, x, y, z, ry);
  const frame = mat(C.oak, 0.7);
  for (const [lx, lz] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) add(g, new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), frame, lx, 0.225, lz);
  add(g, new THREE.BoxGeometry(0.5, 0.09, 0.48), mat(color, 0.9), 0, 0.49, 0);
  add(g, new THREE.BoxGeometry(0.5, 0.5, 0.08), mat(color, 0.9), 0, 0.8, -0.22).rotation.x = -0.08;
}
export function stool(p: THREE.Object3D, x: number, z: number, top = 0x5f7fae, y = 0): void {
  const g = placed(p, x, y, z, 0);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = add(g, new THREE.CylinderGeometry(0.03, 0.035, 0.46, 6), mat(C.oak, 0.7), Math.cos(a) * 0.15, 0.23, Math.sin(a) * 0.15);
    leg.rotation.z = Math.cos(a) * 0.12;
    leg.rotation.x = -Math.sin(a) * 0.12;
  }
  add(g, new THREE.CylinderGeometry(0.22, 0.2, 0.08, 7), mat(top, 0.85), 0, 0.5, 0);
}
export function table(p: THREE.Object3D, x: number, z: number, w: number, d: number, ry = 0, h = 0.76, color = C.oak, y = 0): THREE.Group {
  const g = placed(p, x, y, z, ry);
  add(g, new THREE.BoxGeometry(w, 0.07, d), mat(color, 0.6), 0, h, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, new THREE.BoxGeometry(0.08, h, 0.08), mat(C.oakDark, 0.7), sx * (w / 2 - 0.12), h / 2, sz * (d / 2 - 0.12));
  return g;
}
export function roundTable(p: THREE.Object3D, x: number, z: number, r: number, h = 0.76, color = C.oak, y = 0): THREE.Group {
  const g = placed(p, x, y, z, 0);
  add(g, new THREE.CylinderGeometry(r, r, 0.08, 28), mat(color, 0.6), 0, h, 0);
  add(g, new THREE.CylinderGeometry(r * 0.42, r * 0.5, h - 0.04, 16), mat(C.oakDark, 0.7), 0, (h - 0.04) / 2, 0);
  return g;
}
/** Wooden park bench along local x; sitters face local +z. */
export function bench(p: THREE.Object3D, x: number, z: number, ry: number, len = 1.8, y = 0): void {
  const g = placed(p, x, y, z, ry);
  const slat = mat(0xc98a4b, 0.75), iron = mat(0x2f3336, 0.5, 0.4);
  for (let k = 0; k < 3; k++) add(g, new THREE.BoxGeometry(len, 0.04, 0.12), slat, 0, 0.45, -0.16 + k * 0.15);
  for (let k = 0; k < 3; k++) add(g, new THREE.BoxGeometry(len, 0.1, 0.03), slat, 0, 0.62 + k * 0.13, -0.27).rotation.x = -0.12;
  for (const sx of [-1, 1]) {
    add(g, new THREE.BoxGeometry(0.06, 0.45, 0.45), iron, sx * (len / 2 - 0.1), 0.225, 0);
    add(g, new THREE.BoxGeometry(0.05, 0.5, 0.05), iron, sx * (len / 2 - 0.1), 0.7, -0.27);
  }
}
export function deskLamp(p: THREE.Object3D, x: number, y: number, z: number, glow: THREE.MeshStandardMaterial[]): void {
  const g = placed(p, x, y, z, 0);
  add(g, new THREE.CylinderGeometry(0.09, 0.11, 0.03, 12), mat(0xb08a3a, 0.4, 0.6), 0, 0.015, 0);
  add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), mat(0xb08a3a, 0.4, 0.6), 0, 0.17, 0);
  const shade = new THREE.MeshStandardMaterial({ color: C.lampGreen, roughness: 0.4, emissive: 0xfff2b0, emissiveIntensity: 0, side: THREE.DoubleSide });
  glow.push(shade);
  add(g, new THREE.CylinderGeometry(0.05, 0.16, 0.12, 14, 1, true), shade, 0, 0.36, 0);
}
export function plant(p: THREE.Object3D, x: number, z: number, s = 1, y = 0, pot = 0xf1ede6): void {
  const g = placed(p, x, y, z, (x * 7 + z * 3) % 6);
  add(g, new THREE.CylinderGeometry(0.22 * s, 0.17 * s, 0.38 * s, 12), mat(pot, 0.7), 0, 0.19 * s, 0);
  const leaf = new THREE.MeshLambertMaterial({ color: C.leaf, flatShading: true });
  const leaf2 = new THREE.MeshLambertMaterial({ color: C.leafLight, flatShading: true });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2;
    const l = add(g, new THREE.SphereGeometry(0.5 * s, 6, 4), k % 2 ? leaf : leaf2, Math.cos(a) * 0.18 * s, 0.75 * s + (k % 3) * 0.12 * s, Math.sin(a) * 0.18 * s);
    l.scale.set(0.28, 1, 0.14);
    l.rotation.z = Math.cos(a) * 0.6;
    l.rotation.x = -Math.sin(a) * 0.6;
    l.rotation.y = -a;
  }
}
/** Bookshelf facing local +z. */
export function bookshelf(p: THREE.Object3D, x: number, z: number, ry: number, w: number, h: number, y = 0): void {
  const g = placed(p, x, y, z, ry);
  const frame = mat(0xd5a463, 0.7);
  add(g, new THREE.BoxGeometry(w, h, 0.05), mat(0xc69455, 0.8), 0, h / 2, -0.17);
  for (const sx of [-1, 1]) add(g, new THREE.BoxGeometry(0.05, h, 0.38), frame, sx * (w / 2), h / 2, 0);
  const shelves = Math.max(2, Math.round(h / 0.4));
  const colors = [0x3f6a9a, 0xb14a3f, 0x4f8a5a, 0xd9a441, 0x6f5aa0, 0xe8e2d6, 0x2f4f6f, 0xc76f3a];
  const books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.85 }), Math.ceil((w / 0.06) * shelves));
  const o = new THREE.Object3D(), col = new THREE.Color();
  let n = 0;
  for (let k = 0; k <= shelves; k++) add(g, new THREE.BoxGeometry(w, 0.04, 0.38), frame, 0, (k * h) / shelves, 0);
  for (let k = 0; k < shelves; k++) {
    let bx = -w / 2 + 0.06;
    const base = (k * h) / shelves + 0.02;
    while (bx < w / 2 - 0.08 && n < books.count) {
      const bw = 0.035 + ((n * 37) % 5) * 0.008, bh = (h / shelves) * (0.62 + ((n * 13) % 4) * 0.07);
      o.position.set(bx + bw / 2, base + bh / 2, 0.02);
      o.scale.set(bw, bh, 0.26);
      o.rotation.z = (n * 7) % 23 === 0 ? 0.25 : 0;
      o.updateMatrix();
      books.setMatrixAt(n, o.matrix);
      books.setColorAt(n, col.setHex(colors[(n * 5 + k) % colors.length]));
      bx += bw + 0.004;
      n++;
    }
  }
  books.count = n;
  books.castShadow = true;
  g.add(books);
}
export function bookStack(p: THREE.Object3D, x: number, y: number, z: number, ry = 0): void {
  const g = placed(p, x, y, z, ry);
  const cols = [0x3f6a9a, 0xe8e2d6, 0x4f8a5a];
  cols.forEach((c, i) => add(g, new THREE.BoxGeometry(0.3 - i * 0.03, 0.04, 0.22), mat(c, 0.8), 0, 0.02 + i * 0.04, 0));
}

/* ---------------- architecture ---------------- */

export const glassMat = new THREE.MeshStandardMaterial({ color: 0xd8ecf6, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });

/**
 * A wall in the local x/y plane with a grid of glass panes. Width w, height h, the glazed block
 * spans [gx0, gx1] × [gy0, gy1] with cols × rows panes. Faces local +z.
 */
export function windowWall(p: THREE.Object3D, x: number, z: number, ry: number, w: number, h: number, glaze: { x0: number; x1: number; y0: number; y1: number; cols: number; rows: number }, wallColor = C.wall): THREE.Group {
  const g = placed(p, x, 0, z, ry);
  const wm = mat(wallColor, 0.95);
  const t = 0.25;
  const { x0, x1, y0, y1, cols, rows } = glaze;
  // solid parts around the glazing
  box(g, x0 + w / 2, h, t, wm, (-w / 2 + x0) / 2, 0, 0);
  box(g, w / 2 - x1, h, t, wm, (x1 + w / 2) / 2, 0, 0);
  box(g, x1 - x0, y0, t, wm, (x0 + x1) / 2, 0, 0);
  box(g, x1 - x0, h - y1, t, wm, (x0 + x1) / 2, y1, 0);
  const frame = mat(0xb8bfc4, 0.4, 0.5);
  for (let c = 0; c <= cols; c++) box(g, 0.08, y1 - y0, 0.16, frame, x0 + ((x1 - x0) * c) / cols, y0, 0);
  for (let r = 0; r <= rows; r++) box(g, x1 - x0, 0.08, 0.16, frame, (x0 + x1) / 2, y0 + ((y1 - y0) * r) / rows - 0.04, 0);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), glassMat);
  glass.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
  glass.renderOrder = 2;
  g.add(glass);
  return g;
}

/** Floor with a soft tile grid. */
export function tiledFloor(p: THREE.Object3D, w: number, d: number, color: string, line: string, tile = 1.2, x = 0, z = 0): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 126, 126);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / tile, d / tile);
  tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0, z);
  m.receiveShadow = true;
  p.add(m);
  return m;
}

export function ground(p: THREE.Object3D, size: number, color: number, y = -0.02): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ color }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  p.add(m);
  return m;
}

const leafMats = new Map<number, THREE.MeshLambertMaterial>();
/** Low-poly tree matching the campus model (types: 0 broadleaf, 1 rain tree, 2 palm, 3 conical, 4 tall). */
export function tree(p: THREE.Object3D, x: number, z: number, s: number, type = 0, color = 0x4d8a3c): void {
  let lm = leafMats.get(color);
  if (!lm) { lm = new THREE.MeshLambertMaterial({ color, flatShading: true, side: type === 2 ? THREE.DoubleSide : THREE.FrontSide }); leafMats.set(color, lm); }
  const g = placed(p, x, 0, z, (x * 13 + z * 7) % 6);
  g.scale.setScalar(s);
  add(g, trunkGeometry(type), mat(0x6b4f3a, 0.9), 0, 0, 0);
  add(g, crownGeometry(type), type === 2 ? new THREE.MeshLambertMaterial({ color, flatShading: true, side: THREE.DoubleSide }) : lm, 0, 0, 0);
}

export function hedge(p: THREE.Object3D, x: number, z: number, w: number, h: number, d: number, color = 0x5f9a4b): void {
  const m = add(p, new THREE.BoxGeometry(w, h, d, 4, 2, 2), new THREE.MeshLambertMaterial({ color, flatShading: true }), x, h / 2, z);
  const pos = m.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vy = pos.getY(i);
    if (vy > 0) pos.setY(i, vy + Math.sin(i * 12.9898) * 0.08);
  }
  m.geometry.computeVertexNormals();
}

export function flowers(p: THREE.Object3D, pts: [number, number][], colors = [0xe0508a, 0xf2c14e, 0xf4f0e6, 0xe58fb0, 0xb85cd6]): void {
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshLambertMaterial({ flatShading: true }), pts.length);
  const o = new THREE.Object3D(), c = new THREE.Color();
  pts.forEach(([x, z], i) => {
    o.position.set(x, 0.35 + (i % 3) * 0.05, z);
    o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
    im.setColorAt(i, c.setHex(colors[i % colors.length]));
  });
  p.add(im);
}

/** A distant campus building block with windows, as seen through windows or behind the scenery. */
export function backdropBuilding(p: THREE.Object3D, x: number, z: number, w: number, h: number, d: number, ry = 0): void {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f3efe6';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#9fb7c8';
  ctx.fillRect(10, 18, 44, 26);
  ctx.fillStyle = '#e2dccf';
  ctx.fillRect(8, 46, 48, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const fm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const t1 = tex.clone(); t1.repeat.set(w / 3.4, h / 3.3); t1.needsUpdate = true;
  const t2 = tex.clone(); t2.repeat.set(d / 3.4, h / 3.3); t2.needsUpdate = true;
  const m1 = fm.clone(); m1.map = t1;
  const m2 = fm.clone(); m2.map = t2;
  const roof = mat(0xd8d2c6);
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [m2, m2, roof, roof, m1, m1]);
  b.position.set(x, h / 2, z);
  b.rotation.y = ry;
  b.castShadow = true;
  b.receiveShadow = true;
  p.add(b);
}
