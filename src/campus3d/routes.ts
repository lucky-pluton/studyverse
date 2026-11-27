import * as THREE from 'three';
import type { CampusData } from './data';
import { hash01 } from './data';
import { GeoBuilder, addRibbon } from './world';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

/* ------------------------------------------------------------------ */
/* road graph                                                          */
/* ------------------------------------------------------------------ */

export class RoadGraph {
  readonly n: number;
  private head: Int32Array;
  private next: Int32Array;
  private to: Int32Array;
  private w: Float32Array;
  readonly rv: number[];
  /** vertices that belong to walkable roads (not primary city roads) */
  private walkable: Uint8Array;

  constructor(data: CampusData) {
    this.rv = data.rv;
    this.n = data.rv.length / 2;
    let edges = 0;
    for (const r of data.roads) edges += (r.v.length - 1) * 2;
    this.head = new Int32Array(this.n).fill(-1);
    this.next = new Int32Array(edges);
    this.to = new Int32Array(edges);
    this.w = new Float32Array(edges);
    this.walkable = new Uint8Array(this.n);
    let e = 0;
    for (const r of data.roads) {
      for (let i = 0; i < r.v.length - 1; i++) {
        const a = r.v[i], b = r.v[i + 1];
        const len = Math.hypot(this.rv[a * 2] - this.rv[b * 2], this.rv[a * 2 + 1] - this.rv[b * 2 + 1]);
        for (const [s, t] of [[a, b], [b, a]]) {
          this.to[e] = t;
          this.w[e] = len;
          this.next[e] = this.head[s];
          this.head[s] = e++;
        }
        if (r.c >= 2) { this.walkable[a] = 1; this.walkable[b] = 1; }
      }
    }
  }

  nearest(x: number, z: number, walkOnly = true): number {
    let best = -1, bd = Infinity;
    for (let i = 0; i < this.n; i++) {
      if (walkOnly && !this.walkable[i]) continue;
      const dx = this.rv[i * 2] - x, dz = this.rv[i * 2 + 1] - z, d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /** Dijkstra with a binary heap. Returns vertex indices from a to b. */
  path(a: number, b: number): number[] | null {
    const dist = new Float64Array(this.n).fill(Infinity);
    const prev = new Int32Array(this.n).fill(-1);
    const heap: number[] = [];
    const hd: number[] = [];
    const push = (v: number, d: number): void => {
      heap.push(v); hd.push(d);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (hd[p] <= hd[i]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        [hd[p], hd[i]] = [hd[i], hd[p]];
        i = p;
      }
    };
    const pop = (): [number, number] => {
      const v = heap[0], d = hd[0];
      const lv = heap.pop()!, ld = hd.pop()!;
      if (heap.length) {
        heap[0] = lv; hd[0] = ld;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if (l < heap.length && hd[l] < hd[m]) m = l;
          if (r < heap.length && hd[r] < hd[m]) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i], heap[m]];
          [hd[m], hd[i]] = [hd[i], hd[m]];
          i = m;
        }
      }
      return [v, d];
    };
    dist[a] = 0;
    push(a, 0);
    while (heap.length) {
      const [u, d] = pop();
      if (u === b) break;
      if (d > dist[u]) continue;
      for (let e = this.head[u]; e >= 0; e = this.next[e]) {
        const v = this.to[e], nd = d + this.w[e];
        if (nd < dist[v]) { dist[v] = nd; prev[v] = u; push(v, nd); }
      }
    }
    if (dist[b] === Infinity) return null;
    const out: number[] = [];
    for (let c = b; c !== -1; c = prev[c]) out.unshift(c);
    return out;
  }

  /** Walking distance in metres from vertex a to every vertex. */
  distances(a: number): Float64Array {
    const dist = new Float64Array(this.n).fill(Infinity);
    const done = new Uint8Array(this.n);
    const heap: [number, number][] = [[0, a]];
    dist[a] = 0;
    const up = (i: number): void => { while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const down = (i: number): void => {
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) return;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    };
    while (heap.length) {
      const top = heap[0];
      const last = heap.pop()!;
      if (heap.length) { heap[0] = last; down(0); }
      const u = top[1];
      if (done[u]) continue;
      done[u] = 1;
      for (let e = this.head[u]; e >= 0; e = this.next[e]) {
        const v = this.to[e], nd = top[0] + this.w[e];
        if (nd < dist[v]) { dist[v] = nd; heap.push([nd, v]); up(heap.length - 1); }
      }
    }
    return dist;
  }

  points(path: number[]): number[] {
    const pts: number[] = [];
    for (const v of path) pts.push(this.rv[v * 2], this.rv[v * 2 + 1]);
    return pts;
  }
}

/* ------------------------------------------------------------------ */
/* polyline sampling                                                   */
/* ------------------------------------------------------------------ */

export class Polyline {
  readonly pts: number[];
  readonly cum: number[];
  readonly length: number;
  constructor(pts: number[]) {
    this.pts = pts;
    this.cum = [0];
    for (let i = 1; i < pts.length / 2; i++) this.cum.push(this.cum[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]));
    this.length = this.cum[this.cum.length - 1];
  }
  /** Position and unit direction at distance s along the line. */
  at(s: number, out: { x: number; z: number; dx: number; dz: number }): void {
    s = Math.max(0, Math.min(this.length, s));
    let lo = 0, hi = this.cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.cum[m] < s) lo = m; else hi = m; }
    const seg = this.cum[hi] - this.cum[lo] || 1;
    const t = (s - this.cum[lo]) / seg;
    const ax = this.pts[lo * 2], az = this.pts[lo * 2 + 1], bx = this.pts[hi * 2], bz = this.pts[hi * 2 + 1];
    out.x = ax + (bx - ax) * t;
    out.z = az + (bz - az) * t;
    const l = Math.hypot(bx - ax, bz - az) || 1;
    out.dx = (bx - ax) / l;
    out.dz = (bz - az) / l;
  }
}

/* ------------------------------------------------------------------ */
/* walking route display                                               */
/* ------------------------------------------------------------------ */

export class RouteView {
  readonly group = new THREE.Group();
  private line: Polyline | null = null;
  private walker: THREE.Mesh;
  private u = 0;
  private mat = new THREE.MeshBasicMaterial({ color: 0x14b8a6, polygonOffset: true, polygonOffsetFactor: -40, polygonOffsetUnits: -80 });
  /** screen-space line so the route stays visible when zoomed far out */
  private lineMat = new LineMaterial({ color: 0x0fbf9f, linewidth: 5, worldUnits: false, transparent: true, opacity: 0.95, depthTest: false });

  setResolution(w: number, h: number): void { this.lineMat.resolution.set(w, h); }

  constructor() {
    this.group.name = 'route';
    this.walker = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.walker.visible = false;
    this.group.add(this.walker);
  }

  get active(): boolean { return !!this.line; }

  clear(): void {
    for (const c of [...this.group.children]) {
      if (c === this.walker) continue;
      this.group.remove(c);
      (c as THREE.Mesh).geometry?.dispose();
    }
    this.line = null;
    this.walker.visible = false;
  }

  show(pts: number[], from: { x: number; z: number; h: number }, to: { x: number; z: number; h: number }): number {
    this.clear();
    const gb = new GeoBuilder();
    const white = new THREE.Color(1, 1, 1);
    addRibbon(gb, pts, 3.2, 0.5, white);
    addRibbon(gb, [from.x, from.z, pts[0], pts[1]], 1.2, 0.5, white);
    addRibbon(gb, [pts[pts.length - 2], pts[pts.length - 1], to.x, to.z], 1.2, 0.5, white);
    const ribbon = new THREE.Mesh(gb.build(), this.mat);
    ribbon.renderOrder = 5;
    this.group.add(ribbon);
    const lp: number[] = [from.x, 1.5, from.z];
    for (let i = 0; i < pts.length; i += 2) lp.push(pts[i], 1.5, pts[i + 1]);
    lp.push(to.x, 1.5, to.z);
    const lg = new LineGeometry();
    lg.setPositions(lp);
    const line = new Line2(lg, this.lineMat);
    line.computeLineDistances();
    line.renderOrder = 8;
    this.group.add(line);
    for (const [p, color] of [[from, 0x6b7a74], [to, 0x14b8a6]] as const) {
      const top = p.h + 14;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, top, 8), new THREE.MeshBasicMaterial({ color }));
      pole.position.set(p.x, top / 2, p.z);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color }));
      ball.position.set(p.x, top + 2, p.z);
      this.group.add(pole, ball);
    }
    this.line = new Polyline(pts);
    this.u = 0;
    this.walker.visible = true;
    return this.line.length + Math.hypot(from.x - pts[0], from.z - pts[1]) + Math.hypot(to.x - pts[pts.length - 2], to.z - pts[pts.length - 1]);
  }

  update(dt: number): void {
    if (!this.line) return;
    this.u = (this.u + dt * Math.max(25, this.line.length / 20)) % this.line.length;
    const p = { x: 0, z: 0, dx: 0, dz: 0 };
    this.line.at(this.u, p);
    this.walker.position.set(p.x, 2.2, p.z);
  }
}

/* ------------------------------------------------------------------ */
/* buses and cars                                                      */
/* ------------------------------------------------------------------ */

interface Mover { line: Polyline; s: number; speed: number; dir: 1 | -1; lane: number; obj?: THREE.Object3D; idx?: number }

export class Traffic {
  readonly group = new THREE.Group();
  private buses: Mover[] = [];
  private cars: Mover[] = [];
  private carBody: THREE.InstancedMesh | null = null;
  private carTop: THREE.InstancedMesh | null = null;
  private tmp = { x: 0, z: 0, dx: 0, dz: 0 };
  private o = new THREE.Object3D();

  constructor(data: CampusData, graph: RoadGraph, busRoute: number[] | null) {
    this.group.name = 'traffic';
    // campus buses shuttle between the main gate and the hostel zone
    if (busRoute && busRoute.length > 4) {
      const there = new Polyline(busRoute);
      for (let i = 0; i < 4; i++) {
        const bus = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.4, 9), new THREE.MeshStandardMaterial({ color: 0xe7b03a, roughness: 0.6 }));
        body.position.y = 1.6;
        const glass = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.8, 7.6), new THREE.MeshStandardMaterial({ color: 0x47606e, roughness: 0.2 }));
        glass.position.y = 2.2;
        const band = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.4, 9.05), new THREE.MeshStandardMaterial({ color: 0x8a2f2f }));
        band.position.y = 0.75;
        const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 8.8), new THREE.MeshStandardMaterial({ color: 0xf1efe8 }));
        roof.position.y = 2.88;
        for (const m of [body, glass, band, roof]) { m.castShadow = true; bus.add(m); }
        this.group.add(bus);
        this.buses.push({ line: there, s: (there.length * i) / 4, speed: 8 + i * 0.6, dir: i % 2 ? -1 : 1, lane: 1.9, obj: bus });
      }
    }
    // cars on the main city roads
    const chains = this.chains(data);
    const carDefs: Mover[] = [];
    for (const ch of chains) {
      const line = new Polyline(graph.points(ch.v));
      if (line.length < 300) continue;
      const count = Math.min(14, Math.floor(line.length / 110));
      for (let i = 0; i < count; i++) {
        carDefs.push({ line, s: hash01(carDefs.length * 7 + 1) * line.length, speed: 9 + hash01(carDefs.length * 3) * 6, dir: i % 2 ? -1 : 1, lane: ch.w * 0.24 });
      }
    }
    if (carDefs.length) {
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.85, 4.2);
      bodyGeo.translate(0, 0.75, 0);
      const topGeo = new THREE.BoxGeometry(1.6, 0.7, 2.2);
      topGeo.translate(0, 1.5, -0.2);
      this.carBody = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.2 }), carDefs.length);
      this.carTop = new THREE.InstancedMesh(topGeo, new THREE.MeshStandardMaterial({ color: 0x2b333a, roughness: 0.25 }), carDefs.length);
      const palette = [0xe9e9e4, 0xd8d6d0, 0x2f5a8a, 0xb23a3a, 0x3d3d40, 0xc9c2a6, 0x9aa3a8, 0xf2c94c];
      const col = new THREE.Color();
      carDefs.forEach((c, i) => {
        c.idx = i;
        this.carBody!.setColorAt(i, col.setHex(palette[Math.floor(hash01(i * 5 + 2) * palette.length)]));
      });
      this.carBody.castShadow = true;
      this.group.add(this.carBody, this.carTop);
      this.cars = carDefs;
    }
    this.update(0);
  }

  /** Joins primary and secondary road ways into long chains. */
  private chains(data: CampusData): { v: number[]; w: number }[] {
    const roads = data.roads.filter((r) => r.c <= 1 && r.v.length > 1);
    const used = new Uint8Array(roads.length);
    const byEnd = new Map<number, number[]>();
    roads.forEach((r, i) => {
      for (const v of [r.v[0], r.v[r.v.length - 1]]) {
        if (!byEnd.has(v)) byEnd.set(v, []);
        byEnd.get(v)!.push(i);
      }
    });
    const out: { v: number[]; w: number }[] = [];
    for (let i = 0; i < roads.length; i++) {
      if (used[i]) continue;
      used[i] = 1;
      let v = [...roads[i].v];
      const w = roads[i].w;
      for (const atEnd of [true, false]) {
        for (let guard = 0; guard < 200; guard++) {
          const end = atEnd ? v[v.length - 1] : v[0];
          const cand = (byEnd.get(end) || []).find((k) => !used[k]);
          if (cand === undefined) break;
          used[cand] = 1;
          let seg = roads[cand].v;
          if (atEnd) { if (seg[0] !== end) seg = [...seg].reverse(); v = v.concat(seg.slice(1)); }
          else { if (seg[seg.length - 1] !== end) seg = [...seg].reverse(); v = seg.slice(0, -1).concat(v); }
        }
      }
      out.push({ v, w });
    }
    return out;
  }

  private place(m: Mover, dt: number): { x: number; z: number; ry: number } {
    m.s += m.speed * dt * m.dir;
    const L = m.line.length;
    if (m.s > L) m.s -= L;
    if (m.s < 0) m.s += L;
    m.line.at(m.s, this.tmp);
    const dx = this.tmp.dx * m.dir, dz = this.tmp.dz * m.dir;
    // traffic keeps left in India: shift to the left of the direction of travel
    return { x: this.tmp.x + dz * m.lane, z: this.tmp.z - dx * m.lane, ry: Math.atan2(dx, dz) };
  }

  update(dt: number): void {
    for (const b of this.buses) {
      const p = this.place(b, dt);
      b.obj!.position.set(p.x, 0, p.z);
      b.obj!.rotation.y = p.ry;
    }
    if (this.carBody && this.carTop) {
      for (const c of this.cars) {
        const p = this.place(c, dt);
        this.o.position.set(p.x, 0, p.z);
        this.o.rotation.set(0, p.ry, 0);
        this.o.updateMatrix();
        this.carBody.setMatrixAt(c.idx!, this.o.matrix);
        this.carTop.setMatrixAt(c.idx!, this.o.matrix);
      }
      this.carBody.instanceMatrix.needsUpdate = true;
      this.carTop.instanceMatrix.needsUpdate = true;
    }
  }
}
