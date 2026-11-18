import * as THREE from 'three';
import type { LocationId } from '../../types/studyverse';

export interface BuildingMeshResult {
  group: THREE.Group;
  hitTargets: THREE.Object3D[];
  locationId: LocationId;
}

/**
 * Creates the 7 distinct architectural buildings and landmarks for Studyverse.
 * Each building has recognizable proportions and custom architectural detailing.
 */
export function createCampusBuildings(): {
  buildingsGroup: THREE.Group;
  clickableMap: Map<THREE.Object3D, LocationId>;
} {
  const buildingsGroup = new THREE.Group();
  buildingsGroup.name = 'campus-buildings';
  const clickableMap = new Map<THREE.Object3D, LocationId>();

  // Shared reusable materials
  const stoneWhiteMat = new THREE.MeshLambertMaterial({ color: '#f0ece1' });
  const sandstoneMat = new THREE.MeshLambertMaterial({ color: '#dfd3c3' });
  const terracottaMat = new THREE.MeshLambertMaterial({ color: '#b26543' });
  const glassMat = new THREE.MeshLambertMaterial({ color: '#7eaac4', transparent: true, opacity: 0.85 });
  const darkTrimMat = new THREE.MeshLambertMaterial({ color: '#2b3832' });
  const woodMat = new THREE.MeshLambertMaterial({ color: '#6e4a2d' });
  const foliageMat = new THREE.MeshLambertMaterial({ color: '#387346' });
  const foliageDarkMat = new THREE.MeshLambertMaterial({ color: '#285834' });
  const stoneGreyMat = new THREE.MeshLambertMaterial({ color: '#9da5a0' });
  const roofDarkMat = new THREE.MeshLambertMaterial({ color: '#4a534f' });
  const goldAccentMat = new THREE.MeshLambertMaterial({ color: '#d4af37' });

  // Helper to register clickable mesh
  const registerClickable = (mesh: THREE.Object3D, id: LocationId) => {
    clickableMap.set(mesh, id);
  };

  // Helper to create invisible, generous hit colliders for 100% reliable clicks & fast raycasting
  const createCollider = (geo: THREE.BufferGeometry, pos: [number, number, number], id: LocationId) => {
    const colMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const colMesh = new THREE.Mesh(geo, colMat);
    colMesh.position.set(pos[0], pos[1], pos[2]);
    registerClickable(colMesh, id);
    buildingsGroup.add(colMesh);
  };

  // =========================================================================
  // 1. GAJENDRA CIRCLE (GC) — [0, 0, 0]
  // Central Roundabout Landmark with Monumental Elephant Statue & Gardens
  // =========================================================================
  const gcGroup = new THREE.Group();
  gcGroup.position.set(0, 0, 0);

  // Stepped circular stone pedestal
  const gcPlinthBottom = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.4, 32), sandstoneMat);
  gcPlinthBottom.position.y = 0.2;
  registerClickable(gcPlinthBottom, 'gc');
  gcGroup.add(gcPlinthBottom);

  const gcPlinthMid = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.35, 32), stoneWhiteMat);
  gcPlinthMid.position.y = 0.55;
  registerClickable(gcPlinthMid, 'gc');
  gcGroup.add(gcPlinthMid);

  const gcPlinthTop = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.5, 32), stoneGreyMat);
  gcPlinthTop.position.y = 0.95;
  registerClickable(gcPlinthTop, 'gc');
  gcGroup.add(gcPlinthTop);

  // Central Stone Elephant Statue
  const elephantGroup = new THREE.Group();
  elephantGroup.position.set(0, 1.2, 0);

  // Body
  const elBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 2.2), stoneGreyMat);
  elBody.position.y = 0.8;
  registerClickable(elBody, 'gc');
  elephantGroup.add(elBody);

  // Head
  const elHead = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), stoneGreyMat);
  elHead.position.set(0, 1.3, 1.3);
  registerClickable(elHead, 'gc');
  elephantGroup.add(elHead);

  // Trunk curved upward
  const elTrunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.9, 10), stoneGreyMat);
  elTrunk1.position.set(0, 0.8, 1.9);
  elTrunk1.rotation.x = Math.PI / 4;
  registerClickable(elTrunk1, 'gc');
  elephantGroup.add(elTrunk1);

  const elTrunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.6, 10), stoneGreyMat);
  elTrunk2.position.set(0, 1.2, 2.3);
  elTrunk2.rotation.x = -Math.PI / 5;
  registerClickable(elTrunk2, 'gc');
  elephantGroup.add(elTrunk2);

  // Ears
  const elEarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.6), stoneGreyMat);
  elEarLeft.position.set(-0.65, 1.3, 1.1);
  registerClickable(elEarLeft, 'gc');
  elephantGroup.add(elEarLeft);

  const elEarRight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.6), stoneGreyMat);
  elEarRight.position.set(0.65, 1.3, 1.1);
  registerClickable(elEarRight, 'gc');
  elephantGroup.add(elEarRight);

  // Four sturdy legs
  const legGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.9, 10);
  [[-0.5, 0.45, 0.7], [0.5, 0.45, 0.7], [-0.5, 0.45, -0.7], [0.5, 0.45, -0.7]].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, stoneGreyMat);
    leg.position.set(lx, ly, lz);
    registerClickable(leg, 'gc');
    elephantGroup.add(leg);
  });
  gcGroup.add(elephantGroup);

  // Circular Flowering Garden Ring around Elephant
  const flowerBedGeo = new THREE.RingGeometry(2.8, 3.8, 32);
  const flowerBedMat = new THREE.MeshLambertMaterial({ color: '#568b61' });
  const flowerBed = new THREE.Mesh(flowerBedGeo, flowerBedMat);
  flowerBed.rotation.x = -Math.PI / 2;
  flowerBed.position.y = 0.56;
  gcGroup.add(flowerBed);

  // Perimeter Stone Benches at GC
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
    const bx = Math.sin(a) * 4.6;
    const bz = Math.cos(a) * 4.6;
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.4), woodMat);
    bench.position.set(bx, 0.38, bz);
    bench.rotation.y = a + Math.PI / 2;
    registerClickable(bench, 'gc');
    gcGroup.add(bench);
  }
  buildingsGroup.add(gcGroup);

  // =========================================================================
  // 2. CENTRAL LIBRARY — [28, 0, -32]
  // 2-Story Neoclassical Academic Building with Portico, Pillars & Glass
  // =========================================================================
  const libGroup = new THREE.Group();
  libGroup.position.set(28, 0, -32);
  libGroup.rotation.y = -0.3;

  // Foundation Plinth & Steps
  const libBase = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 12), sandstoneMat);
  libBase.position.y = 0.3;
  registerClickable(libBase, 'library');
  libGroup.add(libBase);

  // Main 2-Story Building Structure
  const libMainBody = new THREE.Mesh(new THREE.BoxGeometry(16, 5.2, 10), stoneWhiteMat);
  libMainBody.position.y = 3.2;
  registerClickable(libMainBody, 'library');
  libGroup.add(libMainBody);

  // Front Expansive Glass Curtain Windows (Ground & 1st Floor)
  const libGlass = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 4.2), glassMat);
  libGlass.position.set(0, 3.2, 5.02);
  registerClickable(libGlass, 'library');
  libGroup.add(libGlass);

  // Entrance Pillars / Portico (4 Classical Columns)
  const colGeo = new THREE.CylinderGeometry(0.3, 0.35, 4.8, 12);
  [-4.5, -1.5, 1.5, 4.5].forEach((px) => {
    const col = new THREE.Mesh(colGeo, stoneWhiteMat);
    col.position.set(px, 3.0, 5.6);
    registerClickable(col, 'library');
    libGroup.add(col);
  });

  // Classical Portico Entablature & Pediment (Triangle Roof Accent)
  const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(11, 0.6, 2.0), sandstoneMat);
  porticoRoof.position.set(0, 5.6, 5.6);
  registerClickable(porticoRoof, 'library');
  libGroup.add(porticoRoof);

  // Rooftop Parapet & Central Skylight / Clerestory
  const libRoofParapet = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.4, 10.4), darkTrimMat);
  libRoofParapet.position.y = 6.0;
  registerClickable(libRoofParapet, 'library');
  libGroup.add(libRoofParapet);

  const skylight = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 5), glassMat);
  skylight.position.set(0, 6.6, 0);
  registerClickable(skylight, 'library');
  libGroup.add(skylight);

  // Library Front Entrance Stepped Stairs
  const libStairs = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.3, 2.5), sandstoneMat);
  libStairs.position.set(0, 0.15, 6.2);
  registerClickable(libStairs, 'library');
  libGroup.add(libStairs);

  buildingsGroup.add(libGroup);

  // =========================================================================
  // 3. LECTURE HALL COMPLEX (LHC) — [-34, 0, -30]
  // Multi-Tiered Terraced Modern Academic Complex with Brick & Sandstone
  // =========================================================================
  const lhcGroup = new THREE.Group();
  lhcGroup.position.set(-34, 0, -30);
  lhcGroup.rotation.y = 0.25;

  // Ground Plinth
  const lhcBase = new THREE.Mesh(new THREE.BoxGeometry(19, 0.5, 14), sandstoneMat);
  lhcBase.position.y = 0.25;
  registerClickable(lhcBase, 'lhc');
  lhcGroup.add(lhcBase);

  // Main Tier 1 Block (Terracotta Brick Exterior)
  const lhcTier1 = new THREE.Mesh(new THREE.BoxGeometry(17, 3.4, 12), terracottaMat);
  lhcTier1.position.y = 2.2;
  registerClickable(lhcTier1, 'lhc');
  lhcGroup.add(lhcTier1);

  // Upper Tier 2 Stepped Back Volume (Cream Sandstone)
  const lhcTier2 = new THREE.Mesh(new THREE.BoxGeometry(14, 2.8, 9), stoneWhiteMat);
  lhcTier2.position.set(0, 5.2, -1.0);
  registerClickable(lhcTier2, 'lhc');
  lhcGroup.add(lhcTier2);

  // Upper Tier 3 Rooftop Mechanical / Lecture Auditorium Arch
  const lhcTier3 = new THREE.Mesh(new THREE.BoxGeometry(10, 1.4, 6), darkTrimMat);
  lhcTier3.position.set(0, 7.1, -1.5);
  registerClickable(lhcTier3, 'lhc');
  lhcGroup.add(lhcTier3);

  // Tier 1 Ribbon Windows
  const lhcWinFront = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.2), glassMat);
  lhcWinFront.position.set(0, 2.6, 6.02);
  registerClickable(lhcWinFront, 'lhc');
  lhcGroup.add(lhcWinFront);

  // Tier 2 Windows
  const lhcWinUpper = new THREE.Mesh(new THREE.PlaneGeometry(11, 1.1), glassMat);
  lhcWinUpper.position.set(0, 5.2, 3.52);
  registerClickable(lhcWinUpper, 'lhc');
  lhcGroup.add(lhcWinUpper);

  // Wide Entrance Amphitheatre Steps
  const lhcStairs1 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 2.0), sandstoneMat);
  lhcStairs1.position.set(0, 0.12, 6.8);
  registerClickable(lhcStairs1, 'lhc');
  lhcGroup.add(lhcStairs1);

  buildingsGroup.add(lhcGroup);

  // =========================================================================
  // 4. BANYAN TREE STUDY GROVE — [-32, 0, 8]
  // Majestic Sprawling Banyan Tree with Aerial Roots, Pergola & Study Stools
  // =========================================================================
  const banyanGroup = new THREE.Group();
  banyanGroup.position.set(-32, 0, 8);
  banyanGroup.rotation.y = 0.1;

  // Circular Raised Stone Plinth
  const banyanPlinthMesh = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9.0, 0.35, 32), sandstoneMat);
  banyanPlinthMesh.position.y = 0.18;
  registerClickable(banyanPlinthMesh, 'banyan');
  banyanGroup.add(banyanPlinthMesh);

  // Central Ancient Banyan Trunk (Sculpted organic mass)
  const trunkCenter = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 4.5, 12), woodMat);
  trunkCenter.position.y = 2.4;
  registerClickable(trunkCenter, 'banyan');
  banyanGroup.add(trunkCenter);

  // Massive Spreading Leafy Canopy (Multi-layered faceted organic volumes)
  const canopyLow = new THREE.Mesh(new THREE.DodecahedronGeometry(5.2, 1), foliageMat);
  canopyLow.position.set(0, 5.5, 0);
  canopyLow.scale.set(1.4, 0.75, 1.3);
  registerClickable(canopyLow, 'banyan');
  banyanGroup.add(canopyLow);

  const canopyHigh = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 1), foliageDarkMat);
  canopyHigh.position.set(0, 7.2, 0);
  canopyHigh.scale.set(1.2, 0.8, 1.1);
  registerClickable(canopyHigh, 'banyan');
  banyanGroup.add(canopyHigh);

  // Hanging Aerial Prop Roots reaching the lawn
  const rootGeo = new THREE.CylinderGeometry(0.12, 0.16, 4.2, 8);
  [
    [-3.5, 2.2, 2.5],
    [3.2, 2.2, 2.8],
    [-2.8, 2.2, -3.2],
    [3.5, 2.2, -2.5],
    [-4.5, 2.2, 0],
    [4.6, 2.2, 0],
  ].forEach(([rx, ry, rz]) => {
    const root = new THREE.Mesh(rootGeo, woodMat);
    root.position.set(rx, ry, rz);
    registerClickable(root, 'banyan');
    banyanGroup.add(root);
  });

  // Timber Study Pergola Structure in foreground
  const pergolaRoof = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 4.0), woodMat);
  pergolaRoof.position.set(0, 3.2, 4.8);
  registerClickable(pergolaRoof, 'banyan');
  banyanGroup.add(pergolaRoof);

  // Pergola support posts
  const postGeo = new THREE.BoxGeometry(0.25, 3.0, 0.25);
  [[-3.0, 1.6, 3.0], [3.0, 1.6, 3.0], [-3.0, 1.6, 6.6], [3.0, 1.6, 6.6]].forEach(([px, py, pz]) => {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(px, py, pz);
    registerClickable(post, 'banyan');
    banyanGroup.add(post);
  });

  // Timber round study tables & stools under pergola
  const tableGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
  const table1 = new THREE.Mesh(tableGeo, woodMat);
  table1.position.set(-1.6, 0.9, 4.8);
  registerClickable(table1, 'banyan');
  banyanGroup.add(table1);

  const table2 = new THREE.Mesh(tableGeo, woodMat);
  table2.position.set(1.6, 0.9, 4.8);
  registerClickable(table2, 'banyan');
  banyanGroup.add(table2);

  buildingsGroup.add(banyanGroup);

  // =========================================================================
  // 5. OPEN AIR THEATRE (OAT) — [36, 0, -12]
  // Semicircular Curved Tiered Stone Amphitheatre & Central Pavilion
  // =========================================================================
  const oatGroup = new THREE.Group();
  oatGroup.position.set(36, 0, -12);
  oatGroup.rotation.y = -0.35;

  // 5 Concentric Stepped Semicircular Stone Tiers
  const tierRadii = [3.2, 4.4, 5.6, 6.8, 8.0];
  tierRadii.forEach((r, idx) => {
    const tierGeo = new THREE.RingGeometry(r, r + 1.0, 24, 1, Math.PI * 0.1, Math.PI * 0.8);
    const tierMesh = new THREE.Mesh(tierGeo, sandstoneMat);
    tierMesh.rotation.x = -Math.PI / 2;
    tierMesh.position.y = 0.05 + idx * 0.35;
    registerClickable(tierMesh, 'oat');
    oatGroup.add(tierMesh);

    // Vertical step risers
    const riserGeo = new THREE.CylinderGeometry(r + 1.0, r + 1.0, 0.35, 24, 1, true, Math.PI * 0.1, Math.PI * 0.8);
    const riserMesh = new THREE.Mesh(riserGeo, darkTrimMat);
    riserMesh.position.y = (idx + 0.5) * 0.35;
    registerClickable(riserMesh, 'oat');
    oatGroup.add(riserMesh);
  });

  // Central Circular Performance Stage
  const stageMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.7, 0.3, 24), stoneWhiteMat);
  stageMesh.position.set(0, 0.15, 0);
  registerClickable(stageMesh, 'oat');
  oatGroup.add(stageMesh);

  // Back Stage Shell / Pavilion
  const shellBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.8, 1.0), stoneWhiteMat);
  shellBase.position.set(0, 1.4, -2.6);
  registerClickable(shellBase, 'oat');
  oatGroup.add(shellBase);

  const shellRoof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.4, 6), roofDarkMat);
  shellRoof.position.set(0, 3.4, -2.6);
  registerClickable(shellRoof, 'oat');
  oatGroup.add(shellRoof);

  buildingsGroup.add(oatGroup);

  // =========================================================================
  // 6. CAMPUS CAFÉ (HIMALAYA) — [-28, 0, 36]
  // Modern Pavilion Café with Awning, Glass Windows & Outdoor Umbrellas
  // =========================================================================
  const cafeGroup = new THREE.Group();
  cafeGroup.position.set(-28, 0, 36);
  cafeGroup.rotation.y = 0.2;

  // Foundation & Patio
  const cafeBase = new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 11), sandstoneMat);
  cafeBase.position.y = 0.2;
  registerClickable(cafeBase, 'cafe');
  cafeGroup.add(cafeBase);

  // Main Café Pavilion Building
  const cafeBody = new THREE.Mesh(new THREE.BoxGeometry(13, 3.8, 8), stoneWhiteMat);
  cafeBody.position.set(0, 2.1, -1.0);
  registerClickable(cafeBody, 'cafe');
  cafeGroup.add(cafeBody);

  // Front Glass Windows & French Doors
  const cafeGlass = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.4), glassMat);
  cafeGlass.position.set(0, 2.0, 3.02);
  registerClickable(cafeGlass, 'cafe');
  cafeGroup.add(cafeGlass);

  // Striped Fabric Entrance Canopy / Awning
  const awningMat = new THREE.MeshLambertMaterial({ color: '#b45309' });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 2.2), awningMat);
  awning.position.set(0, 3.4, 3.9);
  awning.rotation.x = 0.2;
  registerClickable(awning, 'cafe');
  cafeGroup.add(awning);

  // Flat Overhanging Cedar Roof
  const cafeRoof = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 9), darkTrimMat);
  cafeRoof.position.set(0, 4.1, -1.0);
  registerClickable(cafeRoof, 'cafe');
  cafeGroup.add(cafeRoof);

  // Outdoor Dining Parasols & Tables on Patio
  const umbrellaMat = new THREE.MeshLambertMaterial({ color: '#fef3c7' });
  [[-3.8, 3.8], [3.8, 3.8]].forEach(([ux, uz]) => {
    // Parasol pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), darkTrimMat);
    pole.position.set(ux, 1.2, uz);
    cafeGroup.add(pole);

    // Parasol cone
    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.6, 10), umbrellaMat);
    umbrella.position.set(ux, 2.4, uz);
    registerClickable(umbrella, 'cafe');
    cafeGroup.add(umbrella);

    // Round table
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 12), woodMat);
    table.position.set(ux, 0.85, uz);
    registerClickable(table, 'cafe');
    cafeGroup.add(table);
  });

  buildingsGroup.add(cafeGroup);

  // =========================================================================
  // 7. SANGAM GARDENS & DEER TRAIL — [32, 0, 34]
  // Octagonal Wooden Gazebo with Pagoda Roof, Flower Beds & Chital Deer
  // =========================================================================
  const sangamGroup = new THREE.Group();
  sangamGroup.position.set(32, 0, 34);
  sangamGroup.rotation.y = -0.2;

  // Stepped Octagonal Stone Podium
  const sangamBase = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.45, 8), sandstoneMat);
  sangamBase.position.y = 0.22;
  registerClickable(sangamBase, 'park');
  sangamGroup.add(sangamBase);

  // 8 Timber Support Pillars
  const sPillarGeo = new THREE.CylinderGeometry(0.18, 0.22, 3.2, 8);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const px = Math.sin(angle) * 3.8;
    const pz = Math.cos(angle) * 3.8;
    const pillar = new THREE.Mesh(sPillarGeo, woodMat);
    pillar.position.set(px, 1.8, pz);
    registerClickable(pillar, 'park');
    sangamGroup.add(pillar);
  }

  // Octagonal Terracotta Pagoda Roof
  const sangamRoof = new THREE.Mesh(new THREE.ConeGeometry(5.0, 2.4, 8), terracottaMat);
  sangamRoof.position.set(0, 4.4, 0);
  registerClickable(sangamRoof, 'park');
  sangamGroup.add(sangamRoof);

  // Roof Gold Finial
  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, 0.8, 8), goldAccentMat);
  finial.position.set(0, 5.8, 0);
  sangamGroup.add(finial);

  // Concentric Flowerbeds & Botanical Shrubberies
  const flowerMat = new THREE.MeshLambertMaterial({ color: '#e06d88' });
  for (let f = 0; f < 6; f++) {
    const fa = (f * Math.PI) / 3;
    const fx = Math.sin(fa) * 7.5;
    const fz = Math.cos(fa) * 7.5;
    const bed = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), flowerMat);
    bed.position.set(fx, 0.4, fz);
    bed.scale.set(1.2, 0.6, 1.2);
    sangamGroup.add(bed);
  }

  // Low-Poly Chital Deer Figure grazing nearby
  const deerMat = new THREE.MeshLambertMaterial({ color: '#b87c4c' });
  const deerGroup = new THREE.Group();
  deerGroup.position.set(6.5, 0, -4.5);
  deerGroup.rotation.y = 0.8;

  const deerBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 1.1), deerMat);
  deerBody.position.y = 0.85;
  deerGroup.add(deerBody);

  const deerNeck = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.3), deerMat);
  deerNeck.position.set(0, 1.25, 0.4);
  deerNeck.rotation.x = -0.3;
  deerGroup.add(deerNeck);

  const deerHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.45), deerMat);
  deerHead.position.set(0, 1.5, 0.55);
  deerGroup.add(deerHead);

  sangamGroup.add(deerGroup);
  buildingsGroup.add(sangamGroup);

  // =========================================================================
  // 8. GENEROUS INVISIBLE COLLIDERS FOR FAST RAYCASTING & 100% RELIABLE CLICKS
  // Raycaster checks only these 7 simple bounding volumes instead of 300+ meshes!
  // =========================================================================
  createCollider(new THREE.CylinderGeometry(9.5, 9.5, 6, 16), [0, 3, 0], 'gc');
  createCollider(new THREE.BoxGeometry(22, 10, 16), [28, 5, -32], 'library');
  createCollider(new THREE.BoxGeometry(24, 10, 18), [-34, 5, -30], 'lhc');
  createCollider(new THREE.CylinderGeometry(12, 12, 11, 16), [-32, 5.5, 8], 'banyan');
  createCollider(new THREE.CylinderGeometry(12, 12, 7, 16), [36, 3.5, -12], 'oat');
  createCollider(new THREE.BoxGeometry(20, 8, 16), [-28, 4, 36], 'cafe');
  createCollider(new THREE.CylinderGeometry(11, 11, 8, 16), [32, 4, 34], 'park');

  return { buildingsGroup, clickableMap };
}
