import * as THREE from 'three';
import type { LocationId } from '../../../types/studyverse';

export function createBuilding3D(locationId: LocationId): THREE.Group {
  const building = new THREE.Group();
  building.name = `building-${locationId}`;

  switch (locationId) {
    case 'library':
      return createLibrary3D();
    case 'lhc':
      return createLhc3D();
    case 'banyan':
      return createBanyan3D();
    case 'oat':
      return createOat3D();
    case 'cafe':
      return createCafe3D();
    case 'park':
      return createSangam3D();
    case 'gc':
      return createGajendraCircle3D();
    default:
      return createGenericBuilding3D();
  }
}

// 1. Central Library (Classical Modern Sandstone Academic Block)
function createLibrary3D(): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshLambertMaterial({ color: '#f3ece2' });
  const baseMat = new THREE.MeshLambertMaterial({ color: '#dfd2c4' });
  const roofMat = new THREE.MeshLambertMaterial({ color: '#5a6d63' });
  const glassMat = new THREE.MeshLambertMaterial({ color: '#a8d5e5', transparent: true, opacity: 0.85 });
  const pillarMat = new THREE.MeshLambertMaterial({ color: '#faf6f0' });

  // Plinth/Steps Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 5.5), baseMat);
  base.position.y = 0.2;
  base.receiveShadow = true;
  group.add(base);

  // Main Building Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.8, 4.4), stoneMat);
  body.position.y = 1.8;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Large Front Glass Facade
  const glass = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.0, 0.1), glassMat);
  glass.position.set(0, 1.8, 2.22);
  group.add(glass);

  // Front Colonnade Pillars
  for (let i = -2; i <= 2; i++) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.4, 8), pillarMat);
    pillar.position.set(i * 1.0, 1.6, 2.35);
    pillar.castShadow = true;
    group.add(pillar);
  }

  // Roof Pediment / Parapet
  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.35, 4.8), roofMat);
  roof.position.y = 3.35;
  roof.castShadow = true;
  group.add(roof);

  const pediment = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 0.3), pillarMat);
  pediment.position.set(0, 3.6, 2.3);
  group.add(pediment);

  return group;
}

// 2. Lecture Hall Complex (Stepped Amphitheatre Classrooms & CRC Block)
function createLhc3D(): THREE.Group {
  const group = new THREE.Group();

  const brickMat = new THREE.MeshLambertMaterial({ color: '#d99873' });
  const concreteMat = new THREE.MeshLambertMaterial({ color: '#f5eee6' });
  const glassMat = new THREE.MeshLambertMaterial({ color: '#b2d9ea' });
  const roofMat = new THREE.MeshLambertMaterial({ color: '#7a8b82' });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.3, 5), concreteMat);
  base.position.y = 0.15;
  group.add(base);

  // Main Stepped Block
  const block1 = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.4, 4.2), brickMat);
  block1.position.y = 1.5;
  block1.castShadow = true;
  group.add(block1);

  // Upper Lecture Tier
  const block2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.2, 3.2), concreteMat);
  block2.position.set(0, 3.1, -0.4);
  block2.castShadow = true;
  group.add(block2);

  // Strip Windows
  const win1 = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.8, 0.1), glassMat);
  win1.position.set(0, 1.8, 2.12);
  group.add(win1);

  // Roof Slabs
  const roof1 = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.25, 4.5), roofMat);
  roof1.position.y = 2.75;
  group.add(roof1);

  return group;
}

// 3. Ancient Banyan Tree Grove (Majestic Canopy, Sprawling Trunk & Pergola)
function createBanyan3D(): THREE.Group {
  const group = new THREE.Group();

  const barkMat = new THREE.MeshLambertMaterial({ color: '#5a4635' });
  const leafMat1 = new THREE.MeshLambertMaterial({ color: '#3d784a' });
  const leafMat2 = new THREE.MeshLambertMaterial({ color: '#4d8a5a' });
  const plinthMat = new THREE.MeshLambertMaterial({ color: '#cfc4b6' });

  // Stone Circular Plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.35, 16), plinthMat);
  plinth.position.y = 0.17;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Central Trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 2.8, 8), barkMat);
  trunk.position.y = 1.6;
  trunk.castShadow = true;
  group.add(trunk);

  // Aerial Prop Roots
  const rootAngles = [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6];
  rootAngles.forEach((angle) => {
    const rx = Math.cos(angle) * 1.5;
    const rz = Math.sin(angle) * 1.5;
    const root = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 6), barkMat);
    root.position.set(rx, 1.1, rz);
    root.rotation.z = (Math.random() - 0.5) * 0.2;
    group.add(root);
  });

  // Massive Sprawling Leaf Canopies
  const canopy1 = new THREE.Mesh(new THREE.SphereGeometry(2.4, 10, 8), leafMat1);
  canopy1.position.set(0, 3.2, 0);
  canopy1.scale.set(1.4, 0.6, 1.3);
  canopy1.castShadow = true;
  group.add(canopy1);

  const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 7), leafMat2);
  canopy2.position.set(-1.2, 3.0, 0.8);
  canopy2.scale.set(1.2, 0.55, 1.2);
  group.add(canopy2);

  const canopy3 = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 7), leafMat2);
  canopy3.position.set(1.2, 3.1, -0.6);
  canopy3.scale.set(1.2, 0.55, 1.2);
  group.add(canopy3);

  return group;
}

// 4. Open Air Theatre (Semicircular Stone Amphitheatre Bowl)
function createOat3D(): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshLambertMaterial({ color: '#c9beb0' });
  const stageMat = new THREE.MeshLambertMaterial({ color: '#ecd5b8' });
  const canopyMat = new THREE.MeshLambertMaterial({ color: '#fefefe' });

  // Base Ground Depression / Rim
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.2, 20), stoneMat);
  rim.position.y = 0.1;
  group.add(rim);

  // Concentric Semicircular Seating Tiers
  for (let tier = 1; tier <= 3; tier++) {
    const tierRadius = 2.0 + tier * 0.65;
    const tierHeight = 0.28;
    const tierGeo = new THREE.CylinderGeometry(
      tierRadius,
      tierRadius + 0.45,
      tierHeight,
      16,
      1,
      false,
      Math.PI * 0.75,
      Math.PI * 1.5
    );
    const tierMesh = new THREE.Mesh(tierGeo, stoneMat);
    tierMesh.position.y = 0.1 + tier * 0.25;
    tierMesh.castShadow = true;
    group.add(tierMesh);
  }

  // Central Stage Plinth
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.4, 16), stageMat);
  stage.position.set(0, 0.25, -1.2);
  group.add(stage);

  // Canopy Roof Shelter over Stage
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.8, 6), canopyMat);
  roof.position.set(0, 2.2, -1.2);
  roof.castShadow = true;
  group.add(roof);

  // Posts
  for (let a = 0; a < 3; a++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6), stoneMat);
    const px = Math.cos((a * Math.PI * 2) / 3) * 1.0;
    const pz = -1.2 + Math.sin((a * Math.PI * 2) / 3) * 1.0;
    post.position.set(px, 1.1, pz);
    group.add(post);
  }

  return group;
}

// 5. Campus Café (Himalaya Cafeteria with Terraced Awnings)
function createCafe3D(): THREE.Group {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshLambertMaterial({ color: '#fdf6ee' });
  const woodMat = new THREE.MeshLambertMaterial({ color: '#8c5835' });
  const awningMat = new THREE.MeshLambertMaterial({ color: '#c4683a' });
  const glassMat = new THREE.MeshLambertMaterial({ color: '#a5d6eb', transparent: true, opacity: 0.85 });
  const patioMat = new THREE.MeshLambertMaterial({ color: '#d9cdbd' });

  // Outdoor Terrace Base
  const patio = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.2, 5.2), patioMat);
  patio.position.y = 0.1;
  patio.receiveShadow = true;
  group.add(patio);

  // Café Building Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.2, 3.4), wallMat);
  body.position.set(0, 1.2, -0.6);
  body.castShadow = true;
  group.add(body);

  // Glass Front
  const glass = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.5, 0.1), glassMat);
  glass.position.set(0, 1.15, 1.12);
  group.add(glass);

  // Striped Awning
  const awning = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.15, 1.2), awningMat);
  awning.position.set(0, 2.1, 1.5);
  awning.rotation.x = 0.25;
  awning.castShadow = true;
  group.add(awning);

  // Café Umbrella on Terrace
  const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), woodMat);
  umbrellaPole.position.set(1.8, 0.9, 1.4);
  group.add(umbrellaPole);

  const umbrellaTop = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.35, 8), awningMat);
  umbrellaTop.position.set(1.8, 1.8, 1.4);
  group.add(umbrellaTop);

  return group;
}

// 6. Sangam Gardens (Botanical Pavilion Gazebo & Pathway)
function createSangam3D(): THREE.Group {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshLambertMaterial({ color: '#7a4e32' });
  const roofMat = new THREE.MeshLambertMaterial({ color: '#a35738' }); // Terracotta tiles
  const floorMat = new THREE.MeshLambertMaterial({ color: '#d8cfc4' });
  const flowerMat = new THREE.MeshLambertMaterial({ color: '#e06d75' });

  // Octagonal Plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.3, 8), floorMat);
  plinth.position.y = 0.15;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Wooden Posts (8 pillars)
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const px = Math.cos(angle) * 2.0;
    const pz = Math.sin(angle) * 2.0;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 6), woodMat);
    post.position.set(px, 1.2, pz);
    post.castShadow = true;
    group.add(post);
  }

  // Pagoda Shingled Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.2, 8), roofMat);
  roof.position.y = 2.7;
  roof.castShadow = true;
  group.add(roof);

  // Bordering Flower Beds
  for (let f = 0; f < 6; f++) {
    const fa = (f * Math.PI * 2) / 6;
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), flowerMat);
    flower.position.set(Math.cos(fa) * 2.9, 0.3, Math.sin(fa) * 2.9);
    group.add(flower);
  }

  return group;
}

// 7. Gajendra Circle (Central Campus Roundabout Fountain & Elephant Statue)
function createGajendraCircle3D(): THREE.Group {
  const group = new THREE.Group();

  const curbMat = new THREE.MeshLambertMaterial({ color: '#9aa8a1' });
  const grassMat = new THREE.MeshLambertMaterial({ color: '#689e75' });
  const waterMat = new THREE.MeshLambertMaterial({ color: '#70b9cc', transparent: true, opacity: 0.85 });
  const stoneMat = new THREE.MeshLambertMaterial({ color: '#e8ded0' });
  const elephantMat = new THREE.MeshLambertMaterial({ color: '#828e88' }); // Monument grey stone

  // Outer Roundabout Island
  const outerIsland = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.25, 24), curbMat);
  outerIsland.position.y = 0.12;
  group.add(outerIsland);

  const innerGrass = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.28, 24), grassMat);
  innerGrass.position.y = 0.16;
  innerGrass.receiveShadow = true;
  group.add(innerGrass);

  // Circular Fountain Basin
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.4, 20), stoneMat);
  basin.position.y = 0.4;
  group.add(basin);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.35, 20), waterMat);
  water.position.y = 0.45;
  group.add(water);

  // Pedestal for Elephant Statue
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.2), stoneMat);
  pedestal.position.y = 0.8;
  pedestal.castShadow = true;
  group.add(pedestal);

  // Stylized 3D Elephant Monument
  const elephantBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.65), elephantMat);
  elephantBody.position.set(0, 1.35, 0);
  elephantBody.castShadow = true;
  group.add(elephantBody);

  const elephantHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), elephantMat);
  elephantHead.position.set(-0.55, 1.45, 0);
  group.add(elephantHead);

  // Trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5, 6), elephantMat);
  trunk.position.set(-0.8, 1.2, 0);
  trunk.rotation.z = Math.PI / 4;
  group.add(trunk);

  // 4 Legs
  const legGeo = new THREE.BoxGeometry(0.18, 0.4, 0.18);
  const legPositions = [
    [-0.35, 0.95, -0.2],
    [-0.35, 0.95, 0.2],
    [0.35, 0.95, -0.2],
    [0.35, 0.95, 0.2],
  ];
  legPositions.forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, elephantMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  });

  return group;
}

function createGenericBuilding3D(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: '#dce5df' });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 3), mat);
  mesh.position.y = 1;
  group.add(mesh);
  return group;
}

