import './style.css';
import * as THREE from 'three';
import { loadCampus, pointInRing, ringBox, ringCentroid, toLatLon, type CampusData } from './data';
import { SkyEnv } from './sky';
import { buildBuildings, buildDeer, buildGround, buildLamps, buildRoads, buildTrees, type Buildings, type Trees, type Lamps, type Deer } from './world';
import { buildLandmarks, CATEGORIES, CATEGORY_COLOR, CATEGORY_LABEL, type Landmarks, type Place } from './landmarks';
import { SATELLITE, applySatelliteUVs, loadSatellite, pickZoom, sharpenWith, type Satellite } from './satellite';
import { createSatDetail, type DetailLevel, type SatDetail } from './satDetail';
import { MAIN_GATE, SHOW_IITM_SEAL, mainGateSign } from './gate';
import { RoadGraph, RouteView, Traffic } from './routes';
import { LabelLayer, type LabelMode } from './labels';
import { CameraRig } from './controls';
import { createCleanStyle, type CleanStyle } from './clean';

/* ------------------------------------------------------------------ */
/* DOM                                                                 */
/* ------------------------------------------------------------------ */

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'), stage = $('stage');
const inFrame = window.parent && window.parent !== window;
const post = (msg: Record<string, unknown>): void => { if (inFrame) window.parent.postMessage(msg, '*'); };
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
if (inFrame) app.classList.add('embed');
const nextFrame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));

function progress(f: number, text: string): void {
  $('ldBar').style.width = Math.round(f * 100) + '%';
  $('ldTxt').textContent = text;
}

/* ------------------------------------------------------------------ */
/* renderer and scene                                                  */
/* ------------------------------------------------------------------ */

let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch {
  progress(0, '');
  $('ldTxt').classList.add('err');
  $('ldTxt').textContent = 'This browser could not start 3D graphics (WebGL). Try another browser, or use the 2D map.';
  throw new Error('WebGL unavailable');
}
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 1, 22000);
const sky = new SkyEnv(scene);

function resize(): void {
  const w = stage.clientWidth || window.innerWidth, h = stage.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */

let data: CampusData;
let buildings: Buildings;
let trees: Trees;
let lamps: Lamps;
let deer: Deer;
let marks: Landmarks;
let graph: RoadGraph;
let traffic: Traffic;
let labels: LabelLayer;
let rig: CameraRig;
const route = new RouteView();
scene.add(route.group);
let counts: Record<string, number> = {};
let current: Place | null = null;
let hour = 15.5;
let ready = false;
let inCampus: (x: number, z: number) => boolean = () => false;
let groundGroup: THREE.Group;
let roadsGroup: THREE.Group;
let sat: Satellite | null = null;
/** closer imagery tiles loaded around the view */
let satDetail: SatDetail | null = null;
let detailLevel: DetailLevel = 'high';
/** sat: real imagery; map: the drawn map; clean: the drawn map in bright flat colours (clean.ts) */
let groundStyle: 'sat' | 'map' | 'clean' = 'sat';
let clean: CleanStyle;
let roadLines = false;
let roofMapMat: THREE.Material | null = null;
let roofSatMat: THREE.MeshStandardMaterial | null = null;
let labelMode: LabelMode = 'all';
let treeDensity = 1;
const highlight = new THREE.Group();
scene.add(highlight);

/* ------------------------------------------------------------------ */
/* load and build                                                      */
/* ------------------------------------------------------------------ */

/** Build-step timings in ms, readable from the console as campusTimings. */
const timings: Record<string, number> = {};
(window as unknown as { campusTimings: Record<string, number> }).campusTimings = timings;
let tMark = performance.now();
function lap(name: string): void { const n = performance.now(); timings[name] = Math.round(n - tMark); tMark = n; }

async function init(): Promise<void> {
  progress(0.02, 'Fetching the map…');
  const url = new URL('data/iitm-campus.json', document.baseURI).href;
  data = await loadCampus(url, (f) => progress(0.05 + f * 0.4, 'Fetching the map… ' + Math.round(f * 100) + '%'));
  lap('fetch');
  const campusBox = ringBox(data.campus);
  inCampus = (x, z) => x >= campusBox[0] && x <= campusBox[2] && z >= campusBox[1] && z <= campusBox[3] && pointInRing(x, z, data.campus);

  progress(0.5, 'Laying out the ground and roads…');
  await nextFrame();
  // keep the Main Gate plaza free of the boundary wall
  const gateSign = mainGateSign(data);
  const ground = buildGround(data, gateSign ? [{ ...gateSign, r: MAIN_GATE.clearRadius }] : []);
  groundGroup = ground.group;
  scene.add(ground.group);
  roadsGroup = buildRoads(data);
  scene.add(roadsGroup);
  lap('ground+roads');

  progress(0.62, `Raising ${data.buildings.length.toLocaleString('en-IN')} buildings from their footprints…`);
  await nextFrame();
  buildings = buildBuildings(data, () => false);
  scene.add(buildings.group);
  lap('buildings');

  progress(0.74, 'Placing the landmarks…');
  await nextFrame();
  marks = buildLandmarks(data, inCampus, buildings.boxes);
  scene.add(marks.group);
  lap('landmarks');

  progress(0.8, 'Planting the campus forest…');
  await nextFrame();
  trees = buildTrees(data, marks.excluded);
  scene.add(trees.group);
  clean = createCleanStyle({ ground: groundGroup, roads: roadsGroup, buildings: buildings.group, trees: trees.group });
  const roofMesh = buildings.pickables.find((m) => m.name === 'b-roofs');
  if (roofMesh) roofMapMat = roofMesh.material as THREE.Material;
  lap('trees');
  deer = buildDeer(data);
  scene.add(deer.mesh);
  lamps = buildLamps(data, inCampus);
  scene.add(lamps.group);
  lap('deer+lamps');

  progress(0.9, 'Starting the campus buses…');
  await nextFrame();
  graph = new RoadGraph(data);
  const gate = marks.byId.get('gate');
  const cafe = marks.byId.get('study-cafe');
  let busPts: number[] | null = null;
  if (gate && cafe) {
    const a = graph.nearest(gate.x, gate.z), b = graph.nearest(cafe.x, cafe.z);
    const p = graph.path(a, b);
    if (p) busPts = graph.points(p);
  }
  traffic = new Traffic(data, graph, busPts);
  scene.add(traffic.group);
  lap('graph+traffic');

  buildWalkGrid();
  setupUi();
  rig = new CameraRig(camera, renderer.domElement, data.meta.bounds, walkBlocked);
  rig.onUserMove = () => { hideHint(); if (tourI >= 0 && !rig.flying) tourStop(); };
  rig.setView({ x: 330, z: 40, dist: 3300, polar: 0.98, azimuth: 2.55 });
  setHour(hour);
  setDetail('auto');
  lap('ui');

  progress(1, 'Switching on the lights…');
  await nextFrame();
  lap('first frames');
  ready = true;
  $('loader').classList.add('done');
  setTimeout(() => $('loader').remove(), 900);
  riseStart = performance.now();
  // gentle opening move toward the heart of the campus
  rig.flyTo({ x: 120, z: 170, dist: 1500, polar: 0.92, azimuth: 2.75, duration: 3.2 });
  setTimeout(hideHint, 9000);
  post({ type: 'SAHEJ_3D_READY' });
  startSatellite();
}

/* ------------------------------------------------------------------ */
/* satellite imagery                                                   */
/* ------------------------------------------------------------------ */

/** the main campus, [x0, z0, x1, z1] in metres: academic zone, hostels, Gajendra Circle and the residential area */
const SAT_CORE: [number, number, number, number] = [-650, -880, 820, 920];

function startSatellite(): void {
  const budget = autoLevel === 'high' ? 11e6 : autoLevel === 'med' ? 4e6 : 1.2e6;
  const zoom = pickZoom(data, renderer.capabilities.maxTextureSize, budget);
  const credit = $('satCredit');
  credit.textContent = 'Loading satellite imagery…';
  sat = loadSatellite(data, zoom, (f) => { if (f < 1) credit.textContent = `Loading satellite imagery… ${Math.round(f * 100)}%`; }, renderer.capabilities.getMaxAnisotropy());
  sat.ground.renderOrder = -1;
  scene.add(sat.ground);
  const roofs = buildings.pickables.find((m) => m.name === 'b-roofs');
  if (roofs) {
    applySatelliteUVs(roofs.geometry, sat);
    if (!roofMapMat) roofMapMat = roofs.material as THREE.Material;
    roofSatMat = new THREE.MeshStandardMaterial({ map: sat.texture, roughness: 0.92 });
  }
  // closer tiles around wherever you look, loaded as you move, like online maps
  satDetail = createSatDetail(data, renderer.capabilities.getMaxAnisotropy());
  satDetail.setLevel(detailLevel);
  scene.add(satDetail.group);
  // a sharper image of the main campus (every study spot is in it) for roofs and ground at any distance
  if (autoLevel === 'high' && renderer.capabilities.maxTextureSize >= 4096) {
    const core = loadSatellite(data, 18, () => {}, renderer.capabilities.getMaxAnisotropy(), SAT_CORE);
    core.ground.geometry.dispose();
    (core.ground.material as THREE.Material).dispose();
    core.done.then((share) => {
      // switch over only once it has loaded, so no part of the campus goes blank meanwhile
      if (share < 0.9 || !sat) { core.texture.dispose(); return; }
      if (roofSatMat) sharpenWith(roofSatMat, core);
      sharpenWith(sat.ground.material as THREE.MeshLambertMaterial, core);
    });
  }
  applyGroundStyle();
  sat.done.then((share) => {
    if (share < 0.3) {
      credit.textContent = '';
      $('satNote').textContent = 'Satellite imagery could not be loaded, so the map style is shown. Check your connection and reload to try again.';
      if (groundStyle === 'sat') groundStyle = 'map';
      applyGroundStyle();
      return;
    }
    credit.textContent = SATELLITE.attribution;
    $('satNote').textContent = share < 1 ? 'Some imagery tiles did not load; those patches stay plain.' : '';
  });
}

/** Satellite: real imagery on the ground and roofs. Map: the drawn ground, water and roads.
 *  Clean: the drawn map in bright, flat colours (see clean.ts). */
function applyGroundStyle(): void {
  const useSat = groundStyle === 'sat' && !!sat;
  const useClean = groundStyle === 'clean';
  if (sat) sat.ground.visible = useSat;
  for (const o of groundGroup.children) {
    if (o.name === 'campus-lawn' || o.name === 'water' || o.name === 'pitch-lines' || o.name.startsWith('area-')) o.visible = !useSat;
  }
  roadsGroup.visible = !useSat || roadLines;
  satDetail?.setEnabled(useSat);
  clean.set(useClean);
  const roofs = buildings.pickables.find((m) => m.name === 'b-roofs');
  if (roofs && roofMapMat) roofs.material = useSat && roofSatMat ? roofSatMat : useClean ? clean.roofMaterial : roofMapMat;
  // the imagery already shows the real canopy, so the 3D trees are darker and sparser over it
  trees.setTint(useSat ? 0.74 : 1);
  trees.setDensity(treeDensity * treeShare());
  const shown = useSat ? 'sat' : useClean ? 'clean' : 'map';
  document.querySelectorAll<HTMLButtonElement>('[data-ground]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ground === shown)));
  // the Layers button shows the map type in use
  $('layersThumb').className = `mt-thumb mt-${shown}`;
  $('tRoads').setAttribute('aria-pressed', String(roadsGroup.visible));
  $('satCredit').hidden = !useSat;
  // the Clean style lifts the daylight a little
  setHour(hour);
}

/** share of the trees drawn for the current ground style */
function treeShare(): number {
  if (groundStyle === 'sat' && sat) return 0.45;
  return groundStyle === 'clean' ? clean.treeShare : 1;
}

/* walking-mode collision against building footprints */
const walkGrid = new Map<string, number[]>();
function buildWalkGrid(): void {
  buildings.boxes.forEach((b, i) => {
    for (let gx = Math.floor(b[0] / 50); gx <= Math.floor(b[2] / 50); gx++) for (let gz = Math.floor(b[1] / 50); gz <= Math.floor(b[3] / 50); gz++) {
      const k = gx + ',' + gz;
      let l = walkGrid.get(k);
      if (!l) walkGrid.set(k, (l = []));
      l.push(i);
    }
  });
}
function walkBlocked(x: number, z: number): boolean {
  const l = walkGrid.get(Math.floor(x / 50) + ',' + Math.floor(z / 50));
  if (!l) return false;
  for (const i of l) {
    const b = buildings.boxes[i];
    if (x > b[0] && x < b[2] && z > b[1] && z < b[3] && pointInRing(x, z, data.buildings[i].p)) {
      const holes = data.buildings[i].o;
      if (!holes || !holes.some((h) => pointInRing(x, z, h))) return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* places                                                              */
/* ------------------------------------------------------------------ */

const KIND_NAME = ['Academic building', 'Hostel block', 'Staff housing', 'Campus building', 'Building', 'Office building', 'Temple', 'Shed'];
function placeForBuilding(i: number): Place {
  const known = marks.byBuilding.get(i);
  if (known) return known;
  const b = data.buildings[i];
  const c = ringCentroid(b.p);
  const box = buildings.boxes[i];
  const inside = !!b.c;
  const name = KIND_NAME[b.k] || 'Building';
  return {
    id: 'b-' + i, name, tag: inside ? 'On campus' : 'Outside campus', kind: 'building', x: c.x, z: c.z, h: b.h, building: i,
    radius: Math.max(16, Math.hypot(box[2] - box[0], box[3] - box[1]) / 2), floors: b.f, floorsFromMap: !!b.l, outside: !inside,
    text: inside ? 'A building on the IIT Madras campus that has no name on the map yet.' : 'A building in the city outside the campus wall.',
  };
}

const fmtDist = (m: number): string => (m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m / 10) * 10 + ' m');

function setHighlight(p: Place | null): void {
  for (const c of [...highlight.children]) { highlight.remove(c); (c as THREE.Mesh).geometry?.dispose(); }
  if (!p || p.building === undefined) return;
  const b = data.buildings[p.building];
  const shape = new THREE.Shape();
  shape.moveTo(b.p[0], b.p[1]);
  for (let i = 2; i < b.p.length; i += 2) shape.lineTo(b.p[i], b.p[i + 1]);
  for (const h of b.o || []) {
    const path = new THREE.Path();
    path.moveTo(h[0], h[1]);
    for (let i = 2; i < h.length; i += 2) path.lineTo(h[i], h[i + 1]);
    shape.holes.push(path);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: b.h + 1.2, bevelEnabled: false });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, b.h + 1.2, 0);
  const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x2fd3b0, transparent: true, opacity: 0.22, depthWrite: false }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: 0x14b89a }));
  fill.renderOrder = 6;
  highlight.add(fill, edges);
}

function flyToPlace(p: Place): void {
  const dist = p.kind === 'district' ? 1600 : p.kind === 'road' ? 520 : THREE.MathUtils.clamp(p.radius * 3.4 + p.h * 2, 110, 950);
  rig.flyTo({ x: p.x, z: p.z, y: Math.min(p.h * 0.4, 10), dist, polar: p.kind === 'district' ? 0.95 : 0.88 });
}

function select(p: Place, fly = true): void {
  if (tourI >= 0 && !tourSelecting) tourStop();
  if (rig.walking && fly) setWalk(false);
  current = p;
  labels.setSelected(p.id);
  setHighlight(p);
  renderInfo();
  document.querySelectorAll<HTMLButtonElement>('.spot').forEach((s) => s.setAttribute('aria-pressed', String(s.dataset.id === p.id)));
  markDirectory(p.id);
  showInDock(p);
  if (fly) flyToPlace(p);
}

function clearSelection(): void {
  current = null;
  markDirectory(null);
  labels.setSelected(null);
  setHighlight(null);
  $('info').hidden = true;
  document.querySelectorAll<HTMLButtonElement>('.spot').forEach((s) => s.setAttribute('aria-pressed', 'false'));
}

function renderInfo(): void {
  const p = current;
  const info = $('info');
  if (!p) { info.hidden = true; return; }
  closePanels();
  // just the name and where it is, with the actions; no description, to keep the map uncluttered
  const ll = toLatLon(data, p.x, p.z);
  let study = '';
  if (p.kind === 'study' && p.studyId) {
    const n = counts[p.studyId] || 0;
    study = `<div class="live"><i></i>${n > 0 ? `${n} studying now` : 'No one studying yet'}</div>
      <div class="acts"><button class="btn btn-primary enter" type="button" data-act="enter">Enter <span aria-hidden="true">&rarr;</span></button></div>`;
  }
  const canRoute = p.kind !== 'district' && p.id !== 'gate';
  info.innerHTML = `
    <button class="btn close" type="button" data-act="close" aria-label="Close">&times;</button>
    <h2>${p.icon ? `<span class="ic" aria-hidden="true">${p.icon}</span>` : ''}${esc(p.name)}</h2>
    <div class="ll">${ll.lat.toFixed(4)}° N, ${ll.lon.toFixed(4)}° E</div>
    ${study}
    <div class="acts">
      ${canRoute ? '<button class="btn btn-ghost btn-sm" type="button" data-act="route" title="Walking route from the Main Gate">Directions</button>' : ''}
      ${p.kind !== 'district' ? '<button class="btn btn-ghost btn-sm" type="button" data-act="walk">Street view</button>' : ''}
    </div>`;
  info.hidden = false;
}

$('info').addEventListener('click', (e) => {
  const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
  if (!act || !current) return;
  if (act === 'close') clearSelection();
  else if (act === 'enter' && current.studyId) {
    if (inFrame) post({ type: 'SAHEJ_ENTER_LOCATION', locationId: current.studyId });
    else alert('Open Sahej-Shala to enter this study room.');
  } else if (act === 'route') {
    openPanel('routePanel');
    ($('rFrom') as HTMLSelectElement).value = 'gate';
    ($('rTo') as HTMLSelectElement).value = current.id;
    showRoute();
  } else if (act === 'walk') {
    const p = current;
    const back = p.radius + 12;
    setWalk(true, { x: p.x, z: p.z + back, heading: 0 });
  }
});

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */

const PANELS = ['layersPanel', 'aboutPanel', 'routePanel'];
const PANEL_BTN: Record<string, string> = { layersPanel: 'btnLayers', aboutPanel: 'btnAbout', routePanel: 'btnRoute' };
function closePanels(except?: string): void {
  for (const id of PANELS) {
    if (id === except) continue;
    $(id).hidden = true;
    $(PANEL_BTN[id]).setAttribute('aria-pressed', 'false');
  }
}
function openPanel(id: string): void {
  closePanels(id);
  $('info').hidden = true;
  $(id).hidden = false;
  $(PANEL_BTN[id]).setAttribute('aria-pressed', 'true');
}
function togglePanel(id: string): void {
  if ($(id).hidden) openPanel(id);
  else { closePanels(); if (current) $('info').hidden = false; }
}
function closeLayers(): void {
  if (!$('layersPanel').hidden) togglePanel('layersPanel');
}

let hintGone = false;
function hideHint(): void {
  if (hintGone) return;
  hintGone = true;
  $('hint').classList.add('gone');
}

function toggle(id: string, fn: (on: boolean) => void): void {
  const b = $(id);
  b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    fn(on);
  });
}

const ORDER: Record<string, number> = { study: 0, major: 1, soon: 2, hostel: 3, area: 4, building: 5, minor: 6, poi: 7, road: 8, district: 9 };

function setupUi(): void {
  const onCampus = data.buildings.filter((b) => b.c).length;
  $('aboutStats').textContent = `${data.buildings.length.toLocaleString('en-IN')} buildings (${onCampus} inside the campus wall), ${data.roads.length.toLocaleString('en-IN')} roads and paths. Map data downloaded ${data.meta.fetched ? data.meta.fetched.slice(0, 10) : ''}.`;

  labels = new LabelLayer($('labels'), marks.places, (p) => select(p));
  labels.setCounts(counts);

  // map tools: the compass, and the Layers popup that holds everything else
  $('btnCompass').addEventListener('click', () => rig.faceNorth());
  let lastLabelMode: LabelMode = 'all';
  const setLabelMode = (m: LabelMode): void => {
    labelMode = m;
    labels.mode = m;
    if (m !== 'off') lastLabelMode = m;
    $('btnLabels').setAttribute('aria-pressed', String(m !== 'off'));
    document.querySelectorAll<HTMLButtonElement>('[data-labels]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.labels === m)));
  };
  $('btnLabels').addEventListener('click', () => setLabelMode(labelMode === 'off' ? lastLabelMode : 'off'));
  setupMapFilter();
  document.querySelectorAll<HTMLButtonElement>('[data-labels]').forEach((b) => b.addEventListener('click', () => setLabelMode(b.dataset.labels as LabelMode)));
  setLabelMode('all');
  // one click on a map type changes the whole map
  document.querySelectorAll<HTMLButtonElement>('[data-ground]').forEach((b) => b.addEventListener('click', () => {
    groundStyle = b.dataset.ground as typeof groundStyle;
    applyGroundStyle();
  }));
  // road lines always show in the map style; over satellite imagery they are optional
  $('tRoads').addEventListener('click', () => { if (groundStyle === 'sat' && sat) { roadLines = !roadLines; applyGroundStyle(); } });
  toggle('tTrees', (on) => { trees.group.visible = on; });
  $('btnDir').addEventListener('click', () => { closeLayers(); toggleDirectory(); });
  $('dirClose').addEventListener('click', () => toggleDirectory(false));
  $('btnLayers').addEventListener('click', () => togglePanel('layersPanel'));
  $('layersClose').addEventListener('click', () => closeLayers());
  // a press on the map closes the Layers popup, as in Google Maps
  $('stage').addEventListener('pointerdown', () => closeLayers());
  $('btnAbout').addEventListener('click', () => togglePanel('aboutPanel'));
  $('aboutClose').addEventListener('click', () => togglePanel('aboutPanel'));
  const closeRoute = (): void => { closePanels(); route.clear(); $('rInfo').textContent = ''; if (current) $('info').hidden = false; };
  $('btnRoute').addEventListener('click', () => {
    if ($('routePanel').hidden) openPanel('routePanel');
    else closeRoute();
  });
  $('routeClose').addEventListener('click', closeRoute);
  $('btnWalk').addEventListener('click', () => { closeLayers(); setWalk(!rig.walking); });
  $('padExit').addEventListener('click', () => setWalk(false));
  $('btnTour').addEventListener('click', () => (tourI >= 0 ? tourStop() : tourStart()));
  $('tourNext').addEventListener('click', () => tourGo(tourI + 1));
  $('tourPrev').addEventListener('click', () => tourGo(tourI - 1));
  $('tourEnd').addEventListener('click', () => tourStop());

  // layers
  toggle('tTraffic', (on) => { traffic.group.visible = on; });
  toggle('tLamps', (on) => { lamps.group.visible = on; });
  toggle('tDeer', (on) => { deer.mesh.visible = on; });
  toggle('tMarkers', (on) => { for (const m of marks.markers) { m.ring.visible = on; m.beam.visible = on; } });
  toggle('tShadows', (on) => { sky.sun.castShadow = on; });
  toggle('tSpin', (on) => { rig.controls.autoRotate = on; });
  ($('detail') as HTMLSelectElement).addEventListener('change', (e) => setDetail((e.target as HTMLSelectElement).value));
  const emblemFile = $('emblemFile') as HTMLInputElement;
  emblemFile.addEventListener('change', () => {
    const f = emblemFile.files && emblemFile.files[0];
    if (!f || !marks.emblem) return;
    const rd = new FileReader();
    rd.onload = () => { const img = new Image(); img.onload = () => marks.emblem!.setImage(img); img.src = String(rd.result); };
    rd.readAsDataURL(f);
  });
  $('emblemReset').addEventListener('click', () => { marks.emblem?.reset(); emblemFile.value = ''; });
  if (SHOW_IITM_SEAL) {
    // the seal is on: name it in the panel and show its credit under About
    $('emblemLabel').textContent = 'Main Gate emblem (shows the IIT Madras seal by default)';
    $('emblemReset').textContent = 'Use the IIT Madras seal';
    $('sealNote').hidden = false;
  }

  // time of day
  const tod = $('tod') as HTMLInputElement;
  tod.addEventListener('input', () => setHour(parseFloat(tod.value)));
  $('presets').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-h]');
    if (!b) return;
    if (b.dataset.h === 'now') {
      const d = new Date();
      setHour((d.getUTCHours() + d.getUTCMinutes() / 60 + 5.5) % 24);
    } else setHour(parseFloat(b.dataset.h!));
  });

  // route selects
  const routable = marks.places.filter((p) => p.kind !== 'district' && p.kind !== 'road' && p.kind !== 'poi' && !(p.kind === 'building' && p.outside))
    .sort((a, b) => (ORDER[a.kind] - ORDER[b.kind]) || a.name.localeCompare(b.name));
  for (const sel of [$('rFrom'), $('rTo')] as HTMLSelectElement[]) {
    let grp: HTMLOptGroupElement | null = null, last = '';
    for (const p of routable) {
      const g = p.kind === 'study' ? 'Study spots' : p.kind === 'major' ? 'Landmarks' : p.kind === 'hostel' ? 'Hostels' : 'Other places';
      if (g !== last) { grp = document.createElement('optgroup'); grp.label = g; sel.appendChild(grp); last = g; }
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      grp!.appendChild(o);
    }
  }
  ($('rFrom') as HTMLSelectElement).value = 'gate';
  ($('rTo') as HTMLSelectElement).value = 'study-library';
  $('rGo').addEventListener('click', showRoute);
  $('rSwap').addEventListener('click', () => {
    const a = $('rFrom') as HTMLSelectElement, b = $('rTo') as HTMLSelectElement;
    [a.value, b.value] = [b.value, a.value];
  });
  $('rClear').addEventListener('click', () => { route.clear(); $('rInfo').textContent = ''; });

  setupSearch();
  setupDirectory();
  setupDock();
  setupPointer();
  setupKeys();
}

function updateSpotCounts(): void {
  document.querySelectorAll<HTMLButtonElement>('.spot').forEach((b) => {
    const el = b.querySelector<HTMLElement>('.n');
    if (!el) return;
    const p = marks.byId.get(b.dataset.id!);
    const n = p && p.studyId ? counts[p.studyId] || 0 : 0;
    el.hidden = n <= 0;
    el.textContent = String(n);
  });
}

function showRoute(): void {
  const a = marks.byId.get(($('rFrom') as HTMLSelectElement).value), b = marks.byId.get(($('rTo') as HTMLSelectElement).value);
  const info = $('rInfo');
  if (!a || !b || a === b) { info.textContent = 'Pick two different places.'; return; }
  if (rig.walking) setWalk(false);
  tourStop();
  const va = graph.nearest(a.x, a.z), vb = graph.nearest(b.x, b.z);
  const path = graph.path(va, vb);
  if (!path) { info.textContent = 'No walking route found between these two.'; return; }
  const pts = graph.points(path);
  const m = route.show(pts, a, b);
  info.innerHTML = `<b>${fmtDist(m)}</b> on foot, about <b>${Math.max(1, Math.round(m / 80))} min</b> at a steady walk.`;
  let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
  for (let i = 0; i < pts.length; i += 2) { minx = Math.min(minx, pts[i]); maxx = Math.max(maxx, pts[i]); minz = Math.min(minz, pts[i + 1]); maxz = Math.max(maxz, pts[i + 1]); }
  rig.flyTo({ x: (minx + maxx) / 2, z: (minz + maxz) / 2, dist: THREE.MathUtils.clamp(Math.max(maxx - minx, maxz - minz) * 1.5 + 150, 220, 4200), polar: 0.75 });
}

/* search */
function setupSearch(): void {
  const q = $('q') as HTMLInputElement, res = $('qres');
  let hits: Place[] = [], act = 0;
  const draw = (): void => {
    res.innerHTML = '';
    if (!q.value.trim()) { res.hidden = true; return; }
    if (!hits.length) { res.innerHTML = '<div class="empty">No place by that name on the map.</div>'; res.hidden = false; return; }
    hits.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = i === act ? 'act' : '';
      b.innerHTML = `<span>${p.icon ? p.icon + ' ' : ''}${esc(p.name)}</span><small>${esc(p.kind === 'study' ? 'Study spot' : p.tag)}</small>`;
      b.addEventListener('click', () => { select(p); q.value = ''; res.hidden = true; q.blur(); });
      res.appendChild(b);
    });
    res.hidden = false;
  };
  q.addEventListener('input', () => {
    const s = q.value.trim().toLowerCase();
    act = 0;
    if (!s) { hits = []; draw(); return; }
    const words = s.split(/\s+/);
    hits = marks.places
      .filter((p) => p.id !== 'gc-name' && words.every((w) => (p.name + ' ' + p.tag).toLowerCase().includes(w)))
      .sort((a, b) => {
        const sa = a.name.toLowerCase().startsWith(s) ? 0 : 1, sb = b.name.toLowerCase().startsWith(s) ? 0 : 1;
        return sa - sb || ORDER[a.kind] - ORDER[b.kind] || a.name.length - b.name.length;
      })
      .slice(0, 9);
    draw();
  });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { act = Math.min(hits.length - 1, act + 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { act = Math.max(0, act - 1); draw(); e.preventDefault(); }
    else if (e.key === 'Enter' && hits[act]) { select(hits[act]); q.value = ''; res.hidden = true; q.blur(); }
    else if (e.key === 'Escape') { q.value = ''; res.hidden = true; q.blur(); }
  });
  document.addEventListener('pointerdown', (e) => { if (!(e.target as HTMLElement).closest('.search')) res.hidden = true; });
}

/* picking and hover */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pickAt(cx: number, cy: number): Place | null {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const targets: THREE.Object3D[] = [...marks.pickTargets.map((t) => t.obj), ...buildings.pickables];
  const hits = ray.intersectObjects(targets, true);
  for (const h of hits) {
    let o: THREE.Object3D | null = h.object;
    while (o) {
      const t = marks.pickTargets.find((pt) => pt.obj === o);
      if (t) return t.place;
      o = o.parent;
    }
    const owners = buildings.triOwner.get(h.object as THREE.Mesh);
    if (owners && h.faceIndex != null) {
      const bi = owners[h.faceIndex];
      if (bi >= 0) return placeForBuilding(bi);
    }
  }
  return null;
}

function setupPointer(): void {
  const tip = $('tip');
  let down: { x: number; y: number; t: number; btn: number } | null = null;
  let lastHover = 0;
  let lookFrom: { x: number; y: number } | null = null;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), btn: e.button };
    stage.classList.add('drag');
    tip.hidden = true;
    if (rig.walking) { lookFrom = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); }
    hideHint();
  });
  el.addEventListener('pointermove', (e) => {
    if (rig.walking && lookFrom) {
      rig.look(e.clientX - lookFrom.x, e.clientY - lookFrom.y);
      lookFrom = { x: e.clientX, y: e.clientY };
      return;
    }
    if (down || e.pointerType !== 'mouse') return;
    const now = performance.now();
    if (now - lastHover < 90) return;
    lastHover = now;
    const p = pickAt(e.clientX, e.clientY);
    stage.classList.toggle('hover', !!p);
    if (p) {
      tip.textContent = p.name;
      tip.hidden = false;
      tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 12}px)`;
    } else tip.hidden = true;
  });
  el.addEventListener('pointerleave', () => { tip.hidden = true; stage.classList.remove('hover'); });
  const up = (e: PointerEvent): void => {
    stage.classList.remove('drag');
    lookFrom = null;
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 600;
    const btn = down.btn;
    down = null;
    if (moved < 6 && quick && btn === 0 && e.type === 'pointerup') {
      const p = pickAt(e.clientX, e.clientY);
      if (p) select(p, !rig.walking);
      else if (!rig.walking) clearSelection();
    }
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => { if (rig.walking) { e.preventDefault(); rig.walkStep(-e.deltaY * 0.02, 0); } }, { passive: false });
  el.addEventListener('contextmenu', (e) => e.preventDefault());

  // walking pad for touch screens
  for (const [id, key] of [['padW', 'w'], ['padA', 'a'], ['padS', 's'], ['padD', 'd']]) {
    const b = $(id);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); keys.add(key); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => keys.delete(key));
  }
}

/* keyboard */
const keys = new Set<string>();
function setupKeys(): void {
  window.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement).tagName;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ($('q') as HTMLInputElement).focus(); return; }
    if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
    if (e.key === '/') { e.preventDefault(); ($('q') as HTMLInputElement).focus(); return; }
    if (e.key === 'Escape') {
      if (rig.walking) setWalk(false);
      else if (current) clearSelection();
      closePanels();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
      keys.add(k);
      if (k !== 'shift') { e.preventDefault(); hideHint(); }
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
}

/* walking mode */
function setWalk(on: boolean, at?: { x: number; z: number; heading?: number }): void {
  if (on) tourStop();
  rig.setWalking(on, at);
  $('btnWalk').setAttribute('aria-pressed', String(rig.walking));
  $('walkpad').hidden = !rig.walking;
  camera.near = rig.walking ? 0.1 : 1;
  camera.updateProjectionMatrix();
}

/* time of day */
function setHour(h: number): void {
  hour = ((h % 24) + 24) % 24;
  ($('tod') as HTMLInputElement).value = String(hour);
  sky.setHour(hour);
  if (groundStyle === 'clean') {
    // brighter, flatter daylight for the Clean style
    const day = 1 - sky.nightF;
    sky.hemi.intensity *= 1 + 0.25 * day;
    sky.exposure += 0.06 * day;
  }
  const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 60);
  $('clock').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} IST`;
  document.querySelectorAll<HTMLButtonElement>('#presets [data-h]').forEach((b) => {
    const v = b.dataset.h === 'now' ? NaN : parseFloat(b.dataset.h!);
    b.setAttribute('aria-pressed', String(Math.abs(v - hour) < 0.2));
  });
  const night = sky.nightF;
  app.dataset.mode = night > 0.55 ? 'night' : 'day';
  if (!ready) return;
  for (const m of buildings.litMaterials) m.emissiveIntensity = night * 1.35;
  lamps.setNight(night);
}

/* detail levels */
let detailMode = 'auto';
let autoLevel: 'low' | 'med' | 'high' = 'high';
function setDetail(mode: string): void {
  detailMode = mode;
  if (mode === 'auto') {
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    autoLevel = small ? 'med' : 'high';
  }
  applyDetail(mode === 'auto' ? autoLevel : (mode as 'low' | 'med' | 'high'));
}
function applyDetail(level: 'low' | 'med' | 'high'): void {
  detailLevel = level;
  satDetail?.setLevel(level);
  const cfg = { low: { pr: 1, sh: 1024, tr: 0.3 }, med: { pr: 1.5, sh: 2048, tr: 0.6 }, high: { pr: 2, sh: 2048, tr: 1 } }[level];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.pr));
  if (sky.sun.shadow.mapSize.x !== cfg.sh) {
    sky.sun.shadow.mapSize.set(cfg.sh, cfg.sh);
    sky.sun.shadow.map?.dispose();
    sky.sun.shadow.map = null;
  }
  treeDensity = cfg.tr;
  trees.setDensity(cfg.tr * treeShare());
  resize();
}

/* guided tour */
const TOUR: (string | RegExp)[] = ['gate', 'study-gc', /^Administration Building$/, 'study-library', 'study-lhc', 'study-oat', 'soon-sac', 'stadium', 'study-cafe', 'study-park', 'study-banyan', /^IIT Lake$/, /^IITM Research Park$/];
let tourI = -1, tourTimer = 0, tourSelecting = false;
function tourPlaces(): Place[] {
  return TOUR.map((t) => (typeof t === 'string' ? marks.byId.get(t) : marks.places.find((p) => t.test(p.name)))).filter((p): p is Place => !!p);
}
function tourGo(i: number): void {
  const list = tourPlaces();
  if (!list.length) return;
  tourI = (i + list.length) % list.length;
  tourSelecting = true;
  select(list[tourI]);
  tourSelecting = false;
  rig.controls.autoRotate = true;
  $('tourText').textContent = `Tour · stop ${tourI + 1} of ${list.length} · ${list[tourI].name}`;
  clearTimeout(tourTimer);
  tourTimer = window.setTimeout(() => tourGo(tourI + 1), 9000);
}
function tourStart(): void {
  if (rig.walking) setWalk(false);
  route.clear();
  closePanels();
  $('tourbar').hidden = false;
  $('btnTour').setAttribute('aria-pressed', 'true');
  tourGo(0);
}
function tourStop(): void {
  if (tourI < 0) return;
  clearTimeout(tourTimer);
  tourI = -1;
  $('tourbar').hidden = true;
  $('btnTour').setAttribute('aria-pressed', 'false');
  rig.controls.autoRotate = $('tSpin').getAttribute('aria-pressed') === 'true';
}

/* ------------------------------------------------------------------ */
/* building directory with category tabs                               */
/* ------------------------------------------------------------------ */

let dirTab = 'all';
let dirPlaces: Place[] = [];
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

function setupDirectory(): void {
  dirPlaces = marks.places
    .filter((p) => p.cat && p.kind !== 'poi' && p.kind !== 'road' && p.kind !== 'district')
    .sort((a, b) => (a.cat === 'study' ? 0 : 1) - (b.cat === 'study' ? 0 : 1) || collator.compare(a.name, b.name));
  const onCampus = dirPlaces.filter((p) => p.cat !== 'out').length;
  $('dirCount').textContent = `· ${onCampus} places on campus`;
  const tabs = $('dirTabs');
  for (const c of CATEGORIES) {
    const n = c.id === 'all' ? dirPlaces.length : dirPlaces.filter((p) => p.cat === c.id).length;
    if (!n) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dir-tab';
    b.id = 'dirtab-' + c.id;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(c.id === dirTab));
    b.setAttribute('aria-controls', 'dirList');
    b.tabIndex = c.id === dirTab ? 0 : -1;
    b.dataset.tab = c.id;
    b.style.setProperty('--c', c.color);
    b.innerHTML = `${c.id === 'all' ? '' : '<i aria-hidden="true"></i>'}${esc(c.label)} <b>${n}</b>`;
    b.addEventListener('click', () => setDirTab(c.id));
    tabs.appendChild(b);
  }
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const all = [...tabs.querySelectorAll<HTMLButtonElement>('.dir-tab')];
    const i = all.findIndex((b) => b.dataset.tab === dirTab);
    const next = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
    setDirTab(next.dataset.tab!);
    next.focus();
    e.preventDefault();
  });
  $('dirList').setAttribute('aria-labelledby', 'dirtab-' + dirTab);
  ($('dirFilter') as HTMLInputElement).addEventListener('input', renderDirectory);
  renderDirectory();
}

function setDirTab(id: string): void {
  dirTab = id;
  document.querySelectorAll<HTMLButtonElement>('.dir-tab').forEach((b) => {
    const on = b.dataset.tab === id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  $('dirList').setAttribute('aria-labelledby', 'dirtab-' + id);
  renderDirectory();
}

function renderDirectory(): void {
  const list = $('dirList');
  const q = ($('dirFilter') as HTMLInputElement).value.trim().toLowerCase();
  const items = dirPlaces.filter((p) => (dirTab === 'all' || p.cat === dirTab) && (!q || (p.name + ' ' + p.tag).toLowerCase().includes(q)));
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = '<div class="dir-empty">No buildings match in this tab.</div>';
    return;
  }
  const frag = document.createDocumentFragment();
  for (const p of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dir-item';
    b.dataset.id = p.id;
    if (current && current.id === p.id) b.setAttribute('aria-current', 'true');
    b.style.setProperty('--c', CATEGORY_COLOR[p.cat || 'oth'] || '#64748b');
    const bits = [p.cat === 'study' ? (p.kind === 'soon' ? 'Study spot, opening soon' : 'Study spot') : CATEGORY_LABEL[p.cat || 'oth']];
    if (p.floors) bits.push(`${p.floors} floor${p.floors === 1 ? '' : 's'}`);
    b.innerHTML = `<i aria-hidden="true"></i><span>${p.icon ? p.icon + ' ' : ''}${esc(p.name)}<small>${esc(bits.join(' · '))}</small></span>`;
    b.addEventListener('click', () => {
      select(p);
      if (window.innerWidth < 820) toggleDirectory(false);
    });
    frag.appendChild(b);
  }
  list.appendChild(frag);
}

function markDirectory(id: string | null): void {
  document.querySelectorAll<HTMLButtonElement>('.dir-item').forEach((b) => {
    const on = b.dataset.id === id;
    if (on) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
    if (on && !$('dirPanel').hidden) b.scrollIntoView({ block: 'nearest' });
  });
}

function toggleDirectory(open?: boolean): void {
  const panel = $('dirPanel');
  const show = open ?? panel.hidden === true;
  panel.hidden = !show;
  app.classList.toggle('dir-open', show);
  $('btnDir').setAttribute('aria-pressed', String(show));
  if (show) {
    const bottom = Math.round((document.querySelector('.card-title') as HTMLElement).getBoundingClientRect().bottom);
    panel.style.top = bottom + 10 + 'px';
    panel.style.maxHeight = `calc(100vh - ${bottom + 130}px)`;
    markDirectory(current ? current.id : null);
  }
}

/* ------------------------------------------------------------------ */
/* bottom bar: every place, one category tab at a time                 */
/* ------------------------------------------------------------------ */

let dockTab = 'study';

/** screen boxes of the visible panels, so place names don't hide underneath them */
function panelBoxes(): number[] {
  const out: number[] = [];
  for (const sel of ['.card-title', '.maptools', '#dock', '#readout', '#info', '#layersPanel', '#aboutPanel', '#routePanel']) {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el || el.hidden || el.offsetParent === null) continue;
    const r = el.getBoundingClientRect();
    out.push(r.left, r.top, r.right, r.bottom);
  }
  return out;
}

/** chips under the search that show just one kind of place on the map */
const MAP_FILTERS = ['all', 'study', 'aca', 'hos', 'food', 'spo', 'svc', 'lmk'];

function setupMapFilter(): void {
  const row = $('mapFilter');
  const chips: HTMLButtonElement[] = [];
  const apply = (id: string): void => {
    labels.filter = id === 'all' ? null : id;
    for (const c of chips) c.setAttribute('aria-pressed', String(c.dataset.cat === id));
  };
  for (const id of MAP_FILTERS) {
    const cat = CATEGORIES.find((c) => c.id === id);
    if (!cat) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.cat = id;
    b.title = id === 'all' ? 'Show every kind of place on the map' : `Show only ${cat.label.toLowerCase()} on the map`;
    b.innerHTML = id === 'all' ? 'All' : `<i aria-hidden="true"></i>${id === 'study' ? 'Study' : cat.label}`;
    if (id !== 'all') b.style.setProperty('--c', cat.color);
    b.addEventListener('click', () => apply(id));
    row.appendChild(b);
    chips.push(b);
  }
  apply('all');
}

function setupDock(): void {
  const tabs = $('dockTabs'), row = $('spots');
  for (const c of CATEGORIES) {
    if (c.id === 'all') continue;
    const n = dirPlaces.filter((p) => p.cat === c.id).length;
    if (!n) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dock-tab';
    b.id = 'docktab-' + c.id;
    b.dataset.tab = c.id;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(c.id === dockTab));
    b.setAttribute('aria-controls', 'spots');
    b.tabIndex = c.id === dockTab ? 0 : -1;
    b.style.setProperty('--c', c.color);
    b.innerHTML = `<i aria-hidden="true"></i>${esc(c.label)} <b>${n}</b>`;
    b.addEventListener('click', () => setDockTab(c.id));
    tabs.appendChild(b);
  }
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const all = [...tabs.querySelectorAll<HTMLButtonElement>('.dock-tab')];
    const i = all.findIndex((b) => b.dataset.tab === dockTab);
    const next = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
    setDockTab(next.dataset.tab!);
    next.focus();
    e.preventDefault();
  });
  $('dockPrev').addEventListener('click', () => row.scrollBy({ left: -row.clientWidth * 0.8 }));
  $('dockNext').addEventListener('click', () => row.scrollBy({ left: row.clientWidth * 0.8 }));
  // a mouse wheel scrolls these rows sideways
  for (const el of [row, tabs]) {
    el.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });
  }
  row.addEventListener('scroll', updateDockArrows);
  window.addEventListener('resize', updateDockArrows);
  renderDock();
}

function setDockTab(id: string): void {
  if (id === dockTab) return;
  dockTab = id;
  document.querySelectorAll<HTMLButtonElement>('.dock-tab').forEach((b) => {
    const on = b.dataset.tab === id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  $('spots').setAttribute('aria-labelledby', 'docktab-' + id);
  renderDock();
}

function renderDock(): void {
  const row = $('spots');
  row.innerHTML = '';
  row.scrollLeft = 0;
  const frag = document.createDocumentFragment();
  // study spots keep the app's own order, open ones before those opening soon; other tabs are A–Z
  const list = dockTab === 'study'
    ? [...marks.places.filter((q) => q.kind === 'study'), ...marks.places.filter((q) => q.kind === 'soon')]
    : dirPlaces.filter((q) => q.cat === dockTab);
  for (const p of list) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'spot';
    b.dataset.id = p.id;
    b.title = p.name;
    b.setAttribute('aria-pressed', String(!!current && current.id === p.id));
    if (p.kind === 'study') b.innerHTML = `<span aria-hidden="true">${p.icon || ''}</span><span>${esc(p.name)}</span><span class="n" hidden></span>`;
    else if (p.kind === 'soon') b.innerHTML = `<span>${esc(p.name)}</span><span class="soon">${esc(p.badge || 'Soon')}</span>`;
    else {
      b.style.setProperty('--c', CATEGORY_COLOR[p.cat || 'oth'] || '#64748b');
      b.innerHTML = `<i class="d" aria-hidden="true"></i><span>${esc(p.name)}</span>`;
    }
    b.addEventListener('click', () => select(p));
    frag.appendChild(b);
  }
  row.appendChild(frag);
  updateSpotCounts();
  requestAnimationFrame(() => {
    scrollDockToCurrent(false);
    updateDockArrows();
  });
}

function updateDockArrows(): void {
  const row = $('spots');
  ($('dockPrev') as HTMLButtonElement).disabled = row.scrollLeft <= 2;
  ($('dockNext') as HTMLButtonElement).disabled = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2;
}

function scrollDockToCurrent(smooth = true): void {
  if (!current) return;
  const row = $('spots');
  const chip = row.querySelector<HTMLElement>(`.spot[data-id="${CSS.escape(current.id)}"]`);
  if (!chip) return;
  const left = chip.offsetLeft - row.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
  row.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' });
}

/** Switches the bar to the place's category and scrolls its chip into view. */
function showInDock(p: Place): void {
  if (p.cat && p.cat !== dockTab && dirPlaces.includes(p)) setDockTab(p.cat);
  else requestAnimationFrame(() => scrollDockToCurrent());
}

/* ------------------------------------------------------------------ */
/* frame loop                                                          */
/* ------------------------------------------------------------------ */

let last = performance.now(), frameNo = 0, riseStart = 0;
let fpsT = 0, fpsN = 0, fpsChecks = 0;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateReadout(): void {
  const t = rig.walking ? camera.position : rig.target;
  let best: Place | null = null, bd = 260 * 260;
  for (const p of marks.places) {
    if (p.kind === 'district' || p.kind === 'road' || p.outside) continue;
    const d = (p.x - t.x) * (p.x - t.x) + (p.z - t.z) * (p.z - t.z);
    if (d < bd) { bd = d; best = p; }
  }
  // just the building's name and where it is
  $('where').textContent = best ? best.name : inCampus(t.x, t.z) ? 'IIT Madras campus' : 'Outside the campus';
  const ll = toLatLon(data, t.x, t.z);
  $('coords').textContent = `${ll.lat.toFixed(4)}° N, ${ll.lon.toFixed(4)}° E`;
}

function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!ready) { renderer.render(scene, camera); return; }
  frameNo++;

  rig.update(dt, keys);
  const viewDist = rig.viewDist;
  if (!rig.walking) {
    const near = THREE.MathUtils.clamp(viewDist * 0.012, 0.5, 25);
    if (Math.abs(camera.near - near) / camera.near > 0.15) { camera.near = near; camera.updateProjectionMatrix(); }
  }
  sky.follow(camera, rig.walking ? camera.position : rig.target, Math.max(60, viewDist));
  satDetail?.update(rig.walking ? camera.position : rig.target, camera.position, viewDist);
  renderer.toneMappingExposure = sky.exposure;

  if (!reduceMotion) {
    if (traffic.group.visible) traffic.update(dt);
    if (deer.mesh.visible) deer.update(dt);
    route.update(dt);
  }
  if (route.active) route.setResolution(stage.clientWidth, stage.clientHeight);
  marks.update(now / 1000, sky.nightF);
  if (riseStart) {
    const t = Math.min(1, (now - riseStart) / 1600);
    buildings.group.scale.y = reduceMotion ? 1 : 0.02 + 0.98 * (1 - Math.pow(1 - t, 3));
    if (t >= 1) riseStart = 0;
  }
  ($('needle') as HTMLElement).style.transform = `rotate(${(-rig.azimuth * 180) / Math.PI}deg)`;

  if (frameNo % 30 === 0) labels.setObstacles(panelBoxes());
  labels.update(camera, stage.clientWidth, stage.clientHeight, viewDist, rig.walking ? camera.position : rig.target);
  if (frameNo % 8 === 0) updateReadout();

  // auto detail: step down once or twice if the frame rate is low
  if (detailMode === 'auto' && fpsChecks < 2 && !document.hidden) {
    fpsT += dt; fpsN++;
    if (fpsT > 3) {
      const fps = fpsN / fpsT;
      fpsT = 0; fpsN = 0; fpsChecks++;
      if (fps < 32 && autoLevel !== 'low') { autoLevel = autoLevel === 'high' ? 'med' : 'low'; applyDetail(autoLevel); }
    }
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

/* ------------------------------------------------------------------ */
/* messages from the Sahej-Shala app                                   */
/* ------------------------------------------------------------------ */

const pending: MessageEvent[] = [];
function handleMessage(ev: MessageEvent): void {
  const d = ev.data;
  if (!d || typeof d !== 'object') return;
  if (d.type === 'SET_STUDENT_COUNTS') {
    counts = (d.counts as Record<string, number>) || {};
    if (!ready) return;
    labels.setCounts(counts);
    updateSpotCounts();
    if (current && current.kind === 'study') renderInfo();
    return;
  }
  if (!ready) { pending.push(ev); return; }
  if (d.type === 'SET_TIME_OF_DAY') {
    const map: Record<string, number> = { day: 12.2, sunset: 17.3, night: 20.5 };
    if (map[d.timeOfDay] !== undefined) setHour(map[d.timeOfDay]);
  } else if (d.type === 'FOCUS_LOCATION' && d.locationId) {
    const p = marks.byId.get('study-' + d.locationId) || marks.byId.get(d.locationId);
    if (p) select(p);
  }
}
window.addEventListener('message', handleMessage);

init()
  .then(() => { for (const ev of pending.splice(0)) handleMessage(ev); })
  .catch((err) => {
    console.error(err);
    $('ldTxt').classList.add('err');
    $('ldTxt').textContent = 'The campus map could not be loaded. Check your connection and reload, or use the 2D map.';
  });
