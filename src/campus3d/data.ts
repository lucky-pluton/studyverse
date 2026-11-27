/** Campus map data produced by scripts/build-campus-data.mjs from OpenStreetMap. */

export interface BuildingRec {
  /** Outer footprint as flat [x, z, x, z, …] in metres. */
  p: number[];
  /** Courtyard holes, same format. */
  o?: number[][];
  /** Height in metres. */
  h: number;
  /** Kind: 0 academic, 1 hostel, 2 staff housing, 3 other campus, 4 city, 5 commercial/IT, 6 temple, 7 shed. */
  k: number;
  /** Floor count (from the map, or estimated). */
  f: number;
  /** 1 when the building stands inside the campus wall. */
  c?: 1;
  /** 1 when the floor count comes from the map rather than an estimate. */
  l?: 1;
  n?: string;
  /** directory category: aca, hos, food, spo, svc, res, lmk, utl, oth or out */
  t?: string;
  /** descriptive label for an unnamed campus building, e.g. "Staff quarters near E-4" */
  g?: string;
  /** house number or reference from the map */
  r?: string;
}

export interface AreaRec {
  p: number[];
  o?: number[][];
  n?: string;
}

export interface RoadRec {
  /** Class: 0 primary, 1 secondary, 2 tertiary, 3 residential, 4 service, 5 track, 6 footpath. */
  c: number;
  /** Width in metres. */
  w: number;
  /** Indices into the shared road vertex table. */
  v: number[];
  n?: string;
  b?: 1;
}

export interface NamedRec {
  n: string;
  x: number;
  z: number;
  t: string;
  /** Index into buildings when the name belongs to a building. */
  b?: number;
  /** Area class when the name belongs to an area. */
  a?: string;
  /** Outline of a named place that is neither a building nor a drawn area. */
  p?: number[];
  /** 1 when the place is outside the campus wall. */
  out?: 1;
}

export interface CampusData {
  meta: {
    source: string;
    fetched?: string;
    origin: { lat: number; lon: number };
    kx: number;
    kz: number;
    bounds: [number, number, number, number];
  };
  campus: number[];
  buildings: BuildingRec[];
  areas: Record<string, AreaRec[]>;
  rv: number[];
  roads: RoadRec[];
  waterways: { w: number; p: number[] }[];
  walls: number[][];
  named: NamedRec[];
  pois: { n: string; x: number; z: number; t: string }[];
  deer: [number, number, number, number][];
  trees: string;
}

export async function loadCampus(url: string, onProgress: (f: number) => void): Promise<CampusData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load campus map data (' + res.status + ')');
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) {
    onProgress(0.6);
    return (await res.json()) as CampusData;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(Math.min(1, got / total));
  }
  const all = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) {
    all.set(c, o);
    o += c.length;
  }
  return JSON.parse(new TextDecoder().decode(all)) as CampusData;
}

export function toLatLon(data: CampusData, x: number, z: number): { lat: number; lon: number } {
  return { lat: data.meta.origin.lat - z / data.meta.kz, lon: data.meta.origin.lon + x / data.meta.kx };
}

export function fromLatLon(data: CampusData, lat: number, lon: number): { x: number; z: number } {
  return { x: (lon - data.meta.origin.lon) * data.meta.kx, z: -(lat - data.meta.origin.lat) * data.meta.kz };
}

/** Signed area of a flat [x, z, …] ring. */
export function ringArea(r: number[]): number {
  let a = 0;
  const n = r.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) a += (r[j * 2] - r[i * 2]) * (r[j * 2 + 1] + r[i * 2 + 1]);
  return a / 2;
}

export function ringCentroid(r: number[]): { x: number; z: number } {
  let x = 0;
  let z = 0;
  const n = r.length / 2;
  for (let i = 0; i < n; i++) {
    x += r[i * 2];
    z += r[i * 2 + 1];
  }
  return { x: x / n, z: z / n };
}

export function pointInRing(x: number, z: number, r: number[]): boolean {
  let c = false;
  const n = r.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ax = r[i * 2], az = r[i * 2 + 1], bx = r[j * 2], bz = r[j * 2 + 1];
    if (az > z !== bz > z && x < ((bx - ax) * (z - az)) / (bz - az) + ax) c = !c;
  }
  return c;
}

export function ringBox(r: number[]): [number, number, number, number] {
  const b: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i < r.length; i += 2) {
    b[0] = Math.min(b[0], r[i]);
    b[1] = Math.min(b[1], r[i + 1]);
    b[2] = Math.max(b[2], r[i]);
    b[3] = Math.max(b[3], r[i + 1]);
  }
  return b;
}

export function decodeTrees(b64: string): Int16Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

/** Small deterministic random generator. */
export function makeRandom(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function hash01(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
