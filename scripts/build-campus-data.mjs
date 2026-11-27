#!/usr/bin/env node
/**
 * Builds public/data/iitm-campus.json, the compact map file the 3D campus loads.
 *
 * Source: OpenStreetMap via the Overpass API (data © OpenStreetMap contributors, ODbL).
 *
 *   node scripts/build-campus-data.mjs            # use the cached download if present
 *   node scripts/build-campus-data.mjs --fetch    # download fresh data first
 *   node scripts/build-campus-data.mjs --raw path/to/overpass.json
 *
 * Coordinates are projected to metres on a flat plane centred on Gajendra Circle:
 * x grows east, z grows south (so north is -z, matching three.js's default camera).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'scripts', '.cache', 'iitm-overpass.json');
const OUT = path.join(ROOT, 'public', 'data', 'iitm-campus.json');
const CAMPUS_WAY = 24730814; // "Indian Institute of Technology - Madras" outline
const BBOX = [12.979, 80.2185, 13.011, 80.248]; // south, west, north, east
const ORIGIN = { lat: 12.99155, lon: 80.23372 }; // Gajendra Circle

const QUERY = `[out:json][timeout:170][bbox:${BBOX.join(',')}];
(
  way(${CAMPUS_WAY});
  way[building]; relation[building];
  way[highway];
  way[natural]; relation[natural];
  way[water]; way[waterway];
  way[landuse]; relation[landuse];
  way[leisure]; relation[leisure];
  way[amenity];
  way[barrier=wall];
  node[name];
);
out geom qt;`;

/* ---------------- load ---------------- */
const args = process.argv.slice(2);
const rawArg = args.indexOf('--raw');
let rawPath = rawArg >= 0 ? path.resolve(args[rawArg + 1]) : CACHE;
if (args.includes('--fetch') || !fs.existsSync(rawPath)) {
  console.log('Downloading OpenStreetMap data from Overpass…');
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'campus-3d-model-builder/1.0' },
    body: 'data=' + encodeURIComponent(QUERY),
  });
  if (!res.ok) throw new Error('Overpass returned ' + res.status + ': ' + (await res.text()).slice(0, 300));
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, await res.text());
  rawPath = CACHE;
}
const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const E = raw.elements;
console.log('OSM elements:', E.length, 'timestamp', raw.osm3s && raw.osm3s.timestamp_osm_base);

/* ---------------- geometry helpers ---------------- */
const KX = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
const KZ = 110574;
const r1 = (v) => Math.round(v * 10) / 10;
const proj = (p) => [(p.lon - ORIGIN.lon) * KX, -(p.lat - ORIGIN.lat) * KZ];
function hash(n) { let x = (n ^ 0x9e3779b9) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; }
let seed = 20261126;
function rnd() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }

function ringArea(r) { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return a / 2; }
function centroid(r) { let x = 0, z = 0; for (const p of r) { x += p[0]; z += p[1]; } return [x / r.length, z / r.length]; }
function bboxOf(r) { let a = [1e9, 1e9, -1e9, -1e9]; for (const p of r) { a[0] = Math.min(a[0], p[0]); a[1] = Math.min(a[1], p[1]); a[2] = Math.max(a[2], p[0]); a[3] = Math.max(a[3], p[1]); } return a; }
function pip(x, z, r) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > z) !== (b[1] > z) && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function segDist2(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz; let t = l2 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0; t = Math.max(0, Math.min(1, t)); const qx = ax + t * dx - px, qz = az + t * dz - pz; return qx * qx + qz * qz; }

/** Douglas–Peucker on an open polyline of [x,z] points. */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]], t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop(); let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) { const d = segDist2(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1]); if (d > best) { best = d; bi = i; } }
    if (best > t2) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function cleanRing(geom, tol = 0.25) {
  let r = geom.map(proj);
  if (r.length > 1 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.01) r.pop();
  if (r.length < 3) return null;
  r = simplify([...r, r[0]], tol); r.pop();
  if (r.length < 3 || Math.abs(ringArea(r)) < 2) return null;
  return r;
}
/** Joins way member geometries of a multipolygon into closed rings. */
function assembleRings(members) {
  const segs = members.filter((m) => m.geometry && m.geometry.length > 1).map((m) => m.geometry.map((g) => ({ lat: g.lat, lon: g.lon })));
  const key = (g) => g.lat.toFixed(7) + ',' + g.lon.toFixed(7);
  const rings = [];
  while (segs.length) {
    let cur = segs.shift();
    let guard = 0;
    while (key(cur[0]) !== key(cur[cur.length - 1]) && guard++ < 500) {
      const end = key(cur[cur.length - 1]);
      let idx = segs.findIndex((s) => key(s[0]) === end), rev = false;
      if (idx < 0) { idx = segs.findIndex((s) => key(s[s.length - 1]) === end); rev = true; }
      if (idx < 0) break;
      const s = segs.splice(idx, 1)[0]; if (rev) s.reverse();
      cur = cur.concat(s.slice(1));
    }
    rings.push(cur);
  }
  return rings;
}
/** Returns [{outer, holes}] polygons for a way or multipolygon relation. */
function polygonsOf(e) {
  if (e.type === 'way' && e.geometry) { const r = cleanRing(e.geometry); return r ? [{ outer: r, holes: [] }] : []; }
  if (e.type === 'relation' && e.members) {
    const outers = assembleRings(e.members.filter((m) => m.role !== 'inner')).map((g) => cleanRing(g)).filter(Boolean);
    const inners = assembleRings(e.members.filter((m) => m.role === 'inner')).map((g) => cleanRing(g)).filter(Boolean);
    return outers.map((o) => ({ outer: o, holes: inners.filter((h) => { const c = centroid(h); return pip(c[0], c[1], o); }) }));
  }
  return [];
}
const flat = (r) => r.flatMap((p) => [r1(p[0]), r1(p[1])]);

/* ---------------- campus outline ---------------- */
const campusEl = E.find((e) => e.type === 'way' && e.id === CAMPUS_WAY);
if (!campusEl) throw new Error('Campus outline way ' + CAMPUS_WAY + ' missing from the download');
const campus = cleanRing(campusEl.geometry, 0.5);
const campusBox = bboxOf(campus);
const inCampus = (x, z) => x >= campusBox[0] && x <= campusBox[2] && z >= campusBox[1] && z <= campusBox[3] && pip(x, z, campus);

/* ---------------- buildings ---------------- */
const FLOOR_OVERRIDES = {
  'Mandakini': 10, 'Pampa': 8, 'Tamiraparani': 8, 'Sindhu': 8, 'Mahanadi': 8, 'Central Library': 6,
  'Administration Building': 4, 'New Academic Complex 1': 7, 'New Academic Complex 2': 6, 'IITM Research Park': 12,
  'Students Activity Centre (SAC)': 3, 'Classroom Complex (CRC)': 3, 'Humanities and Social Sciences Block (HSB)': 4,
  'Central Lecture Theatre': 2, 'T.T. Jagannathan Auditorium': 2, 'IITM Hospital': 3,
};
function kindOf(t, inside) {
  const b = t.building, a = t.amenity || '';
  if (b === 'roof' || b === 'shed' || b === 'garage' || b === 'garages' || b === 'carport' || b === 'hut' || b === 'kiosk' || b === 'toilets' || b === 'service') return 7;
  if (a === 'place_of_worship' || b === 'temple' || b === 'church' || b === 'mosque') return 6;
  if (a === 'student_accommodation' || b === 'dormitory' || t.tourism === 'hostel') return 1;
  if (!inside) return (b === 'industrial' || b === 'commercial' || b === 'office' || b === 'warehouse') ? 5 : 4;
  if (b === 'university' || b === 'college' || b === 'school' || a === 'university' || a === 'school' || a === 'library' || b === 'hospital' || b === 'office' || a === 'theatre') return 0;
  if (b === 'house' || b === 'residential' || b === 'apartments' || b === 'detached' || b === 'semidetached_house' || /^([A-Z]\d?-?\d|[A-Z]{1,3}\d|B\d)/.test(t.name || '')) return 2;
  if (b === 'industrial' || b === 'commercial') return 5;
  return 3;
}
function floorsOf(t, area, kind, id, inside) {
  const lv = parseInt(t['building:levels'], 10);
  if (t.name && FLOOR_OVERRIDES[t.name]) return FLOOR_OVERRIDES[t.name];
  if (lv > 0 && lv < 60) return lv;
  const h = hash(id);
  if (kind === 7) return 1;
  if (kind === 6) return 2;
  if (kind === 1) return area > 3000 ? 6 : 4;
  if (kind === 0) return area < 150 ? 1 : area < 600 ? 2 : area < 2200 ? 3 : 4;
  if (kind === 2) return area < 120 ? 1 : area < 380 ? 2 : 3 + (h > 0.6 ? 1 : 0);
  if (kind === 5) return area > 2500 ? 6 + Math.floor(h * 9) : 2 + Math.floor(h * 3);
  if (inside) return area < 100 ? 1 : area < 500 ? 2 : 3;
  // the city outside the walls
  if (area < 50) return 1;
  if (area < 150) return 2 + Math.floor(h * 2);
  if (area < 500) return 3 + Math.floor(h * 2);
  if (area < 1500) return 4 + Math.floor(h * 3);
  return 5 + Math.floor(h * 6);
}
const buildings = [];
const named = [];
const buildingBoxes = [];
for (const e of E) {
  if (!e.tags || !e.tags.building || e.tags.building === 'no') continue;
  for (const poly of polygonsOf(e)) {
    const c = centroid(poly.outer), inside = inCampus(c[0], c[1]);
    const area = Math.abs(ringArea(poly.outer)) - poly.holes.reduce((s, h) => s + Math.abs(ringArea(h)), 0);
    if (area < 6) continue;
    const kind = kindOf(e.tags, inside);
    const floors = floorsOf(e.tags, area, kind, e.id, inside);
    const hTag = parseFloat(e.tags.height);
    const height = hTag > 0 && hTag < 200 ? hTag : floors * 3.3 + (kind === 7 ? 0.4 : 0.8);
    const b = { p: flat(poly.outer), h: r1(height), k: kind, f: floors };
    if (poly.holes.length) b.o = poly.holes.map(flat);
    if (inside) b.c = 1;
    if (parseInt(e.tags['building:levels'], 10) > 0) b.l = 1; // floor count comes from the map
    const name = e.tags.name || e.tags['name:en'];
    b.t = categoryOf(e.tags, name || '', kind, inside);
    const ref = e.tags['addr:housenumber'] || e.tags.ref;
    if (!name && ref && inside && ref.length < 16) b.r = String(ref);
    if (name) {
      b.n = name.split(';')[0].trim();
      const rec = { n: b.n, x: r1(c[0]), z: r1(c[1]), t: tagOf(e.tags), b: buildings.length };
      if (!inside) rec.out = 1;
      named.push(rec);
    }
    buildingBoxes.push({ box: bboxOf(poly.outer), ring: poly.outer, h: height });
    buildings.push(b);
  }
}
/**
 * Directory category for a building, used by the 3D page's tabs:
 * aca academic, hos hostels, food, spo sport, svc services, res residences, lmk landmarks,
 * utl utilities, oth other campus buildings, out outside the campus wall.
 */
function categoryOf(t, name, kind, inside) {
  if (!inside) return 'out';
  const n = name.toLowerCase(), a = t.amenity || '', b = t.building || '';
  if (a === 'place_of_worship' || b === 'temple' || t.tourism === 'museum' || t.historic || /temple|heritage|museum/.test(n)) return 'lmk';
  if (/^(restaurant|cafe|food_court|fast_food|canteen|ice_cream)$/.test(a) || /\bmess\b|canteen|caf[eé]|food|dining|juice|bakery|coffee/.test(n)) return 'food';
  if (a === 'student_accommodation' || b === 'dormitory' || t.tourism === 'hostel' || kind === 1) return 'hos';
  if (/^(sports_centre|stadium|swimming_pool|fitness_centre|pitch)$/.test(t.leisure || '') || /sports|gym|swimming|stadium|pavilion|court/.test(n)) return 'spo';
  if (/sump|pump|sub-?station|transformer|tank|generator|ozone|garage|parking|shed|store room|laundry/.test(n) || kind === 7) return 'utl';
  if (/^(bank|atm|post_office|hospital|clinic|doctors|police|fire_station|townhall)$/.test(a) || b === 'hospital' || b === 'office' || t.tourism === 'guest_house' || t.shop ||
    /bank|post|hospital|guest house|office|shopping|store|mart|parlour|maintenance|exchange|club|security|admin/.test(n)) return 'svc';
  if (b === 'university' || b === 'college' || b === 'school' || /^(university|college|school|library|theatre|conference_centre)$/.test(a) ||
    /department|dept|\blab\b|laborator|block|centre|center|lecture|library|academic|workshop|engineering|science|research|auditorium|school|complex|gate office|innovation/.test(n)) return 'aca';
  if (kind === 2 || /^(house|residential|apartments|detached|semidetached_house|bungalow)$/.test(b) || /quarter|^[a-z]{1,3}\d|^[a-z]\d?-\s?\d|&/.test(n)) return 'res';
  return 'oth';
}

function tagOf(t) {
  if (t.amenity === 'student_accommodation' || t.building === 'dormitory' || t.tourism === 'hostel') return 'Hostel';
  if (t.amenity === 'library') return 'Library';
  if (t.amenity === 'restaurant' || t.amenity === 'food_court' || t.amenity === 'cafe' || t.amenity === 'fast_food') return 'Food';
  if (t.amenity === 'theatre' || t.amenity === 'conference_centre') return 'Auditorium';
  if (t.amenity === 'bank' || t.amenity === 'atm') return 'Bank';
  if (t.amenity === 'place_of_worship') return 'Temple';
  if (t.amenity === 'school' || t.building === 'school') return 'School';
  if (t.building === 'hospital' || t.amenity === 'hospital') return 'Health';
  if (t.tourism === 'guest_house') return 'Guest house';
  if (t.tourism === 'museum') return 'Museum';
  if (t.leisure === 'sports_centre' || t.leisure === 'stadium' || t.leisure === 'pitch' || t.leisure === 'swimming_pool') return 'Sport';
  if (t.building === 'university' || t.amenity === 'university') return 'Academic';
  if (t.building === 'office') return 'Administration';
  if (t.building === 'residential' || t.building === 'house') return 'Residence';
  return '';
}

/* ---------------- areas ---------------- */
function areaClass(t) {
  if (t.building) return null;
  const n = t.natural, l = t.landuse, le = t.leisure;
  if (n === 'water' || t.water || l === 'reservoir' || l === 'basin' || t.waterway === 'riverbank' || le === 'swimming_pool') return 'water';
  if (n === 'wood' || n === 'scrub' || l === 'forest') return 'wood';
  if (l === 'orchard' || l === 'plantation') return 'orchard';
  if (n === 'wetland') return 'wetland';
  if (le === 'pitch') return 'pitch';
  if (le === 'track') return 'track';
  if (le === 'stadium') return 'stadium';
  if (le === 'golf_course') return 'golf';
  if (l === 'grass' || l === 'meadow' || l === 'recreation_ground' || l === 'village_green' || l === 'greenfield' || le === 'park' || le === 'garden' || le === 'playground' || le === 'sports_centre' || n === 'grassland') return 'grass';
  if (t.amenity === 'parking' || le === 'outdoor_seating') return 'paved';
  if (l === 'residential' || l === 'commercial' || l === 'retail' || l === 'industrial' || l === 'depot' || l === 'construction' || l === 'education' || l === 'cemetery' || l === 'hospital') return 'urban';
  return null;
}
const AREA_ORDER = ['urban', 'grass', 'golf', 'wetland', 'wood', 'orchard', 'stadium', 'paved', 'pitch', 'track', 'water'];
const areas = {}; for (const k of AREA_ORDER) areas[k] = [];
const areaPolys = {}; for (const k of AREA_ORDER) areaPolys[k] = [];
for (const e of E) {
  if (!e.tags) continue;
  const cls = areaClass(e.tags); if (!cls) continue;
  if (e.type === 'way' && (!e.geometry || e.geometry.length < 4)) continue;
  if (e.type === 'way' && (e.geometry[0].lat !== e.geometry[e.geometry.length - 1].lat || e.geometry[0].lon !== e.geometry[e.geometry.length - 1].lon)) continue; // open line, not an area
  for (const poly of polygonsOf(e)) {
    const a = { p: flat(poly.outer) }; if (poly.holes.length) a.o = poly.holes.map(flat);
    const name = e.tags.name; const c = centroid(poly.outer);
    if (name && inCampus(c[0], c[1])) { a.n = name; named.push({ n: name, x: r1(c[0]), z: r1(c[1]), t: tagOf(e.tags) || (cls === 'water' ? 'Water' : cls === 'wood' || cls === 'orchard' ? 'Green' : cls === 'pitch' || cls === 'stadium' || cls === 'track' ? 'Sport' : 'Green'), a: cls }); }
    areas[cls].push(a); areaPolys[cls].push({ box: bboxOf(poly.outer), ring: poly.outer, holes: poly.holes });
  }
}
// named places that are neither buildings nor drawn areas (the Open Air Theatre, for example): keep their outline
for (const e of E) {
  if (!e.tags || !e.tags.name || e.tags.building || areaClass(e.tags) || e.tags.highway || e.type === 'node' || e.id === CAMPUS_WAY) continue;
  if (!(e.tags.amenity || e.tags.leisure || e.tags.tourism || e.tags.landuse)) continue;
  for (const poly of polygonsOf(e)) {
    const c = centroid(poly.outer);
    if (!inCampus(c[0], c[1])) continue;
    named.push({ n: e.tags.name.split(';')[0], x: r1(c[0]), z: r1(c[1]), t: tagOf(e.tags), p: flat(poly.outer) });
  }
}

/* ---------------- roads (with a shared vertex table for routing) ---------------- */
const ROAD = {
  primary: [0, 14], primary_link: [0, 8], trunk: [0, 14], secondary: [1, 11], secondary_link: [1, 7], tertiary: [2, 9], tertiary_link: [2, 6],
  residential: [3, 6.5], unclassified: [3, 6], road: [3, 6], living_street: [3, 5], service: [4, 5], track: [5, 3.5],
  pedestrian: [6, 4], footway: [6, 2.2], path: [6, 1.8], cycleway: [6, 2], steps: [6, 2],
};
const vIndex = new Map(), rv = [], roads = [];
function vid(nodeId, g) {
  let i = vIndex.get(nodeId);
  if (i === undefined) { i = rv.length / 2; vIndex.set(nodeId, i); const p = proj(g); rv.push(r1(p[0]), r1(p[1])); }
  return i;
}
const roadSegsForMask = [];
for (const e of E) {
  if (e.type !== 'way' || !e.tags || !e.tags.highway || !e.geometry) continue;
  const def = ROAD[e.tags.highway]; if (!def) continue;
  if (e.tags.area === 'yes') continue;
  let [cls, w] = def;
  if (e.tags.highway === 'service' && /parking_aisle|driveway/.test(e.tags.service || '')) w = 4;
  const width = parseFloat(e.tags.width); if (width > 1.5 && width < 30) w = width;
  const v = e.nodes.map((n, i) => vid(n, e.geometry[i]));
  const r = { c: cls, w, v };
  if (e.tags.name) r.n = e.tags.name.split(';')[0];
  if (e.tags.bridge === 'yes') r.b = 1;
  roads.push(r);
  for (let i = 0; i < e.geometry.length - 1; i++) { const a = proj(e.geometry[i]), b = proj(e.geometry[i + 1]); roadSegsForMask.push([a[0], a[1], b[0], b[1], w / 2]); }
}
const waterways = [];
for (const e of E) {
  if (e.type !== 'way' || !e.tags || !e.tags.waterway || !e.geometry || e.tags.waterway === 'riverbank') continue;
  const w = e.tags.waterway === 'canal' ? 14 : e.tags.waterway === 'river' ? 20 : e.tags.waterway === 'stream' ? 4 : 3;
  waterways.push({ w, p: flat(simplify(e.geometry.map(proj), 0.5)) });
}
const walls = [];
for (const e of E) {
  if (e.type !== 'way' || !e.tags || e.tags.barrier !== 'wall' || !e.geometry || e.id === CAMPUS_WAY) continue;
  walls.push(flat(simplify(e.geometry.map(proj), 0.4)));
}

/* ---------------- named points ---------------- */
const pois = [];
for (const e of E) {
  if (e.type !== 'node' || !e.tags || !e.tags.name) continue;
  const p = proj(e); if (!inCampus(p[0], p[1]) && !/gate/i.test(e.tags.name)) continue;
  pois.push({ n: e.tags.name.split(';')[0], x: r1(p[0]), z: r1(p[1]), t: tagOf(e.tags) || (e.tags.barrier === 'gate' ? 'Gate' : e.tags.highway === 'bus_stop' ? 'Bus stop' : e.tags.amenity ? e.tags.amenity.replace(/_/g, ' ') : '') });
}

/* ---------------- labels for every campus building ---------------- */
// Named buildings keep their map name. Every other campus building gets a descriptive label from
// its category and its nearest named neighbour or road, e.g. "Staff quarters near E-4".
const KIND_LABEL = { aca: 'Academic building', hos: 'Hostel block', food: 'Dining hall', spo: 'Sports building', svc: 'Service building', res: 'Staff quarters', lmk: 'Temple building', utl: 'Utility building', oth: 'Campus building' };
const refs = [
  ...named.filter((q) => !q.out && !/^(quarter|building|block)$/i.test(q.n)).map((q) => ({ n: q.n, x: q.x, z: q.z, b: q.b })),
  ...pois.filter((q) => q.t && q.t !== 'Bus stop').map((q) => ({ n: q.n, x: q.x, z: q.z, b: undefined })),
];
const namedRoads = [];
for (const r of roads) {
  if (!r.n || r.c > 4) continue;
  for (let i = 0; i < r.v.length - 1; i++) namedRoads.push([rv[r.v[i] * 2], rv[r.v[i] * 2 + 1], rv[r.v[i + 1] * 2], rv[r.v[i + 1] * 2 + 1], r.n]);
}
const centroids = buildings.map((b) => centroid(b.p.reduce((acc, v, i) => (i % 2 ? acc[acc.length - 1].push(v) : acc.push([v]), acc), [])));
// unnamed generic buildings take the category of a named neighbour within 70 m (quarters next to quarters)
buildings.forEach((b, i) => {
  if (!b.c || b.n || b.t !== 'oth') return;
  const [cx, cz] = centroids[i];
  let best = 70 * 70, cat = null;
  for (const q of named) {
    if (q.b === undefined || q.out) continue;
    const t = buildings[q.b].t;
    if (t !== 'res' && t !== 'aca' && t !== 'hos') continue;
    const d = (q.x - cx) ** 2 + (q.z - cz) ** 2;
    if (d < best) { best = d; cat = t; }
  }
  if (cat) b.t = cat;
});
const labelCount = new Map();
buildings.forEach((b, i) => {
  if (!b.c || b.n) return;
  const [cx, cz] = centroids[i];
  let where = '';
  let best = 190 * 190;
  for (const q of refs) {
    if (q.b === i) continue;
    const d = (q.x - cx) ** 2 + (q.z - cz) ** 2;
    if (d < best) { best = d; where = 'near ' + q.n; }
  }
  if (!where) {
    let bd = 140 * 140;
    for (const s of namedRoads) { const d = segDist2(cx, cz, s[0], s[1], s[2], s[3]); if (d < bd) { bd = d; where = 'on ' + s[4]; } }
  }
  const base = (b.r ? `${KIND_LABEL[b.t] || 'Campus building'} ${b.r}` : KIND_LABEL[b.t] || 'Campus building') + (where ? ' ' + where : '');
  const k = (labelCount.get(base) || 0) + 1;
  labelCount.set(base, k);
  b.g = k > 1 ? `${base} (${k})` : base;
});
// the first of a repeated label gets "(1)" so the directory reads clearly
const firstOf = new Map();
buildings.forEach((b) => { if (b.g && !/\(\d+\)$/.test(b.g) && labelCount.get(b.g) > 1 && !firstOf.has(b.g)) { firstOf.set(b.g, true); b.g += ' (1)'; } });


/* ---------------- tree and deer placement ---------------- */
function boxHit(box, x, z, m) { return x >= box[0] - m && x <= box[2] + m && z >= box[1] - m && z <= box[3] + m; }
const GRID = 40; // spatial hash for fast "is anything here" checks
const cells = new Map();
function addToGrid(obj, box) { for (let gx = Math.floor(box[0] / GRID); gx <= Math.floor(box[2] / GRID); gx++) for (let gz = Math.floor(box[1] / GRID); gz <= Math.floor(box[3] / GRID); gz++) { const k = gx + ',' + gz; if (!cells.has(k)) cells.set(k, []); cells.get(k).push(obj); } }
for (const b of buildingBoxes) addToGrid({ t: 'b', ...b }, b.box);
for (const s of roadSegsForMask) addToGrid({ t: 'r', s }, [Math.min(s[0], s[2]) - s[4], Math.min(s[1], s[3]) - s[4], Math.max(s[0], s[2]) + s[4], Math.max(s[1], s[3]) + s[4]]);
for (const cls of ['water', 'pitch', 'track', 'paved', 'stadium']) for (const a of areaPolys[cls]) addToGrid({ t: 'a', ...a }, a.box);
function blocked(x, z, margin) {
  const list = cells.get(Math.floor(x / GRID) + ',' + Math.floor(z / GRID)); if (!list) return false;
  for (const o of list) {
    if (o.t === 'r') { const s = o.s, m = s[4] + margin; if (segDist2(x, z, s[0], s[1], s[2], s[3]) < m * m) return true; }
    else if (boxHit(o.box, x, z, margin)) {
      if (pip(x, z, o.ring)) return true;
      if (margin > 0) { const r = o.ring; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (segDist2(x, z, r[i][0], r[i][1], r[j][0], r[j][1]) < margin * margin) return true; }
    }
  }
  return false;
}
function inAreas(cls, x, z) { for (const a of areaPolys[cls]) if (boxHit(a.box, x, z, 0) && pip(x, z, a.ring) && !a.holes.some((h) => pip(x, z, h))) return true; return false; }

// type: 0 broadleaf, 1 rain tree (wide), 2 palm, 3 conical, 4 tall round
function pickType(zone) {
  const r = rnd();
  if (zone === 'orchard') return r < 0.85 ? 2 : 0;
  if (zone === 'wood') return r < 0.55 ? 0 : r < 0.75 ? 4 : r < 0.9 ? 1 : 3;
  if (zone === 'campus') return r < 0.42 ? 0 : r < 0.62 ? 1 : r < 0.74 ? 4 : r < 0.86 ? 3 : 2;
  return r < 0.5 ? 0 : r < 0.75 ? 2 : r < 0.9 ? 3 : 4;
}
const trees = [];
const [s, w, n, eLon] = BBOX;
const minX = (w - ORIGIN.lon) * KX, maxX = (eLon - ORIGIN.lon) * KX, minZ = -(n - ORIGIN.lat) * KZ, maxZ = -(s - ORIGIN.lat) * KZ;
for (let z = minZ + 4; z < maxZ - 4; z += 7) {
  for (let x = minX + 4; x < maxX - 4; x += 7) {
    const jx = x + (rnd() - 0.5) * 6, jz = z + (rnd() - 0.5) * 6;
    const campusHere = inCampus(jx, jz);
    let zone = campusHere ? 'campus' : 'city', p = campusHere ? 0.5 : 0.05;
    if (inAreas('wood', jx, jz)) { zone = 'wood'; p = campusHere ? 0.92 : 0.62; }
    else if (inAreas('orchard', jx, jz)) { zone = 'orchard'; p = 0.55; }
    else if (inAreas('grass', jx, jz) || inAreas('golf', jx, jz)) { p = campusHere ? 0.12 : 0.08; }
    else if (inAreas('wetland', jx, jz)) { p = 0.1; }
    else if (!campusHere && inAreas('urban', jx, jz)) { p = 0.05; }
    if (rnd() > p) continue;
    if (blocked(jx, jz, campusHere ? 2.5 : 1.5)) continue;
    const type = pickType(zone);
    const scale = 0.75 + rnd() * (zone === 'wood' ? 0.8 : 0.6);
    trees.push([jx, jz, type, scale, campusHere ? 1 : 0]);
  }
}
// avenue trees along campus roads
for (const r of roads) {
  if (r.c > 4) continue;
  const half = r.w / 2 + 3.2;
  for (let i = 0; i < r.v.length - 1; i++) {
    const ax = rv[r.v[i] * 2], az = rv[r.v[i] * 2 + 1], bx = rv[r.v[i + 1] * 2], bz = rv[r.v[i + 1] * 2 + 1];
    const len = Math.hypot(bx - ax, bz - az); if (len < 1) continue;
    const nx = -(bz - az) / len, nz = (bx - ax) / len;
    for (let d = 4; d < len; d += 11) {
      const px = ax + ((bx - ax) * d) / len, pz = az + ((bz - az) * d) / len;
      if (!inCampus(px, pz)) continue;
      for (const sgn of [-1, 1]) {
        const tx = px + nx * half * sgn, tz = pz + nz * half * sgn;
        if (rnd() < 0.8 && !blocked(tx, tz, 1.2)) trees.push([tx, tz, rnd() < 0.7 ? 1 : 0, 0.95 + rnd() * 0.5, 1]);
      }
    }
  }
}
// shuffle so any prefix is an even sample (used for lower detail levels)
for (let i = trees.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [trees[i], trees[j]] = [trees[j], trees[i]]; }
const MAX_TREES = 50000;
if (trees.length > MAX_TREES) trees.length = MAX_TREES;
const treeBuf = new Int16Array(trees.length * 3);
trees.forEach((t, i) => {
  treeBuf[i * 3] = Math.round(t[0] * 10); treeBuf[i * 3 + 1] = Math.round(t[1] * 10);
  const sc = Math.max(0, Math.min(63, Math.round((t[3] - 0.6) / 0.02)));
  treeBuf[i * 3 + 2] = (t[4] << 9) | (t[2] << 6) | sc;
});

// deer: herds in the Black Buck Habitat and campus woods
const deer = [];
const habitat = named.find((nm) => /black buck/i.test(nm.n));
const herdCentres = [];
if (habitat) herdCentres.push([habitat.x, habitat.z, 60, 26]);
for (const a of areaPolys.wood) { const c = centroid(a.ring); if (inCampus(c[0], c[1]) && herdCentres.length < 9) herdCentres.push([c[0], c[1], 35, 8]); }
for (const [cx, cz, rad, count] of herdCentres) {
  let tries = 0, made = 0;
  while (made < count && tries++ < 400) {
    const x = cx + (rnd() * 2 - 1) * rad, z = cz + (rnd() * 2 - 1) * rad;
    if (!inCampus(x, z) || blocked(x, z, 1)) continue;
    deer.push([r1(x), r1(z), Math.round(rnd() * 628) / 100, rnd() < 0.3 ? 1 : 0]); made++;
  }
}

/* ---------------- write ---------------- */
const out = {
  meta: {
    source: 'OpenStreetMap contributors (ODbL)', fetched: raw.osm3s && raw.osm3s.timestamp_osm_base,
    origin: ORIGIN, kx: KX, kz: KZ, bounds: [r1(minX), r1(minZ), r1(maxX), r1(maxZ)],
  },
  campus: flat(campus),
  buildings, areas, rv, roads, waterways, walls, named, pois, deer,
  trees: Buffer.from(treeBuf.buffer).toString('base64'),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`Wrote ${path.relative(ROOT, OUT)} (${kb} KB): ${buildings.length} buildings (${buildings.filter((b) => b.c).length} on campus), ${roads.length} roads, ${Object.values(areas).reduce((s, a) => s + a.length, 0)} areas, ${trees.length} trees, ${deer.length} deer, ${named.length} named places, ${pois.length} points`);
