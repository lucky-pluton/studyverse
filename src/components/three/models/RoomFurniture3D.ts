import * as THREE from 'three';
import type { LocationId } from '../../../types/studyverse';
import { ROOM_3D_CONFIGS } from '../../../constants/threeDCoordinates';

export function createRoomFurniture3D(locationId: LocationId): THREE.Group {
  const room = new THREE.Group();
  room.name = `room-furniture-${locationId}`;

  const config = ROOM_3D_CONFIGS[locationId];
  if (!config) return room;

  // 1. Base Floor & Walls
  const floorGeo = new THREE.PlaneGeometry(config.floorDimensions[0], config.floorDimensions[1]);
  const floorMat = getFloorMaterial(locationId);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  // 2. Specific Architecture & Furniture
  switch (locationId) {
    case 'library':
      buildLibraryInterior(room);
      break;
    case 'lhc':
      buildLhcInterior(room);
      break;
    case 'banyan':
      buildBanyanInterior(room);
      break;
    case 'oat':
      buildOatInterior(room);
      break;
    case 'cafe':
      buildCafeInterior(room);
      break;
    case 'park':
      buildSangamInterior(room);
      break;
    case 'gc':
      buildGajendraCircleInterior(room);
      break;
  }

  // 3. Render Empty Chairs/Benches for defined seats
  const chairMat = new THREE.MeshLambertMaterial({ color: '#3b82f6' }); // Blue student chairs
  const woodChairMat = new THREE.MeshLambertMaterial({ color: '#8c5835' });
  const stoneBenchMat = new THREE.MeshLambertMaterial({ color: '#cfc6b8' });

  config.seats.forEach((seat) => {
    const seatMeshGroup = new THREE.Group();
    seatMeshGroup.position.set(seat.position[0], 0, seat.position[2]);
    seatMeshGroup.rotation.y = seat.rotationY;
    seatMeshGroup.name = `chair-${seat.id}`;

    if (seat.type === 'chair') {
      // Seat cushion
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.65), chairMat);
      cushion.position.y = 0.45;
      cushion.castShadow = true;
      seatMeshGroup.add(cushion);

      // Backrest
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.08), chairMat);
      backrest.position.set(0, 0.72, -0.28);
      backrest.castShadow = true;
      seatMeshGroup.add(backrest);

      // 4 legs
      const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6);
      const legMat = new THREE.MeshLambertMaterial({ color: '#2d3748' });
      [[-0.28, -0.25], [0.28, -0.25], [-0.28, 0.25], [0.28, 0.25]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.22, lz);
        seatMeshGroup.add(leg);
      });
    } else if (seat.type === 'bench') {
      // Wooden or Stone Bench
      const benchTop = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.08, 0.55),
        locationId === 'park' || locationId === 'gc' ? stoneBenchMat : woodChairMat
      );
      benchTop.position.y = 0.45;
      benchTop.castShadow = true;
      seatMeshGroup.add(benchTop);

      // Bench Back
      const benchBack = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.45, 0.06),
        locationId === 'park' || locationId === 'gc' ? stoneBenchMat : woodChairMat
      );
      benchBack.position.set(0, 0.7, -0.24);
      seatMeshGroup.add(benchBack);

      // Supports
      const supGeo = new THREE.BoxGeometry(0.12, 0.45, 0.5);
      [-0.55, 0.55].forEach((sx) => {
        const sup = new THREE.Mesh(supGeo, stoneBenchMat);
        sup.position.set(sx, 0.22, 0);
        seatMeshGroup.add(sup);
      });
    } else if (seat.type === 'tier') {
      // Tier Stone Step Spot Marker
      const stepMarker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.06, 12),
        stoneBenchMat
      );
      stepMarker.position.y = 0.03;
      seatMeshGroup.add(stepMarker);
    }

    room.add(seatMeshGroup);
  });

  return room;
}

function getFloorMaterial(locationId: LocationId): THREE.Material {
  switch (locationId) {
    case 'library':
      return new THREE.MeshLambertMaterial({ color: '#f5eee6' }); // Polished cream oak
    case 'lhc':
      return new THREE.MeshLambertMaterial({ color: '#ece4db' }); // Parquet lecture floor
    case 'banyan':
      return new THREE.MeshLambertMaterial({ color: '#7cb58a' }); // Green grass grove
    case 'oat':
      return new THREE.MeshLambertMaterial({ color: '#d8cfc4' }); // Paved amphitheatre stone
    case 'cafe':
      return new THREE.MeshLambertMaterial({ color: '#f3ece2' }); // Warm café tile
    case 'park':
      return new THREE.MeshLambertMaterial({ color: '#6fa57d' }); // Botanical garden turf
    case 'gc':
      return new THREE.MeshLambertMaterial({ color: '#5b6b63' }); // Roundabout asphalt & stone
    default:
      return new THREE.MeshLambertMaterial({ color: '#eee' });
  }
}

// 1. Library Interior Builder
function buildLibraryInterior(room: THREE.Group) {
  const woodMat = new THREE.MeshLambertMaterial({ color: '#8b5a36' });
  const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#475569'];
  const glassMat = new THREE.MeshLambertMaterial({ color: '#bae6fd', transparent: true, opacity: 0.75 });
  const lampMat = new THREE.MeshLambertMaterial({ color: '#15803d' });

  // Back Wall with Grand Windows
  const wallMat = new THREE.MeshLambertMaterial({ color: '#f7f3ec' });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 0.4), wallMat);
  backWall.position.set(0, 3.5, -10);
  room.add(backWall);

  const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 0.1), glassMat);
  windowMesh.position.set(0, 4.0, -9.75);
  room.add(windowMesh);

  // Bookshelves along back window base
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(14, 1.6, 0.7), woodMat);
  shelf.position.set(0, 0.8, -9.3);
  shelf.castShadow = true;
  room.add(shelf);

  // Side Bookshelves
  [-11, 11].forEach((sideX) => {
    const sideShelf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5.0, 14), woodMat);
    sideShelf.position.set(sideX, 2.5, -2);
    sideShelf.castShadow = true;
    room.add(sideShelf);

    // Books rows
    for (let r = 1; r <= 3; r++) {
      for (let b = -5; b <= 5; b += 0.8) {
        const bookMat = new THREE.MeshLambertMaterial({
          color: bookColors[Math.abs(Math.floor(b * 3)) % bookColors.length],
        });
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.2), bookMat);
        book.position.set(sideX > 0 ? sideX - 0.2 : sideX + 0.2, r * 1.2, b);
        room.add(book);
      }
    }
  });

  // Study Tables (West & East Desks)
  [[-5, 5.8], [5, 5.8], [-5, 1.8], [5, 1.8], [-5, -2.2], [5, -2.2]].forEach(([tx, tz]) => {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.72, 1.2), woodMat);
    desk.position.set(tx, 0.36, tz);
    desk.castShadow = true;
    room.add(desk);

    // Banker's Lamp
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.16), lampMat);
    lamp.position.set(tx, 0.82, tz);
    room.add(lamp);
  });
}

// 2. Lecture Hall Complex Interior Builder
function buildLhcInterior(room: THREE.Group) {
  const woodMat = new THREE.MeshLambertMaterial({ color: '#9c6644' });
  const boardMat = new THREE.MeshLambertMaterial({ color: '#1b4332' }); // Chalkboard green
  const wallMat = new THREE.MeshLambertMaterial({ color: '#fcf6ef' });

  // Front Wall & Teaching Platform
  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(24, 8, 0.4), wallMat);
  frontWall.position.set(0, 4, -9.8);
  room.add(frontWall);

  const chalkboard = new THREE.Mesh(new THREE.BoxGeometry(12, 3.2, 0.1), boardMat);
  chalkboard.position.set(0, 4.2, -9.5);
  room.add(chalkboard);

  // Stage Platform
  const stage = new THREE.Mesh(new THREE.BoxGeometry(16, 0.45, 3.5), woodMat);
  stage.position.set(0, 0.22, -7.5);
  stage.receiveShadow = true;
  room.add(stage);

  // Podium
  const podium = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.6), woodMat);
  podium.position.set(-2, 0.95, -7.0);
  room.add(podium);

  // Tiered Rows Desks
  const rows = [
    { z: 5.0, y: 0.7, len: 16 },
    { z: 2.0, y: 1.4, len: 17 },
    { z: -1.0, y: 2.1, len: 15 },
  ];

  rows.forEach(({ z, y, len }) => {
    // Left Desk
    const deskL = new THREE.Mesh(new THREE.BoxGeometry(len / 2 - 1, 0.7, 0.7), woodMat);
    deskL.position.set(-len / 4 - 0.5, y, z);
    deskL.castShadow = true;
    room.add(deskL);

    // Right Desk
    const deskR = new THREE.Mesh(new THREE.BoxGeometry(len / 2 - 1, 0.7, 0.7), woodMat);
    deskR.position.set(len / 4 + 0.5, y, z);
    deskR.castShadow = true;
    room.add(deskR);
  });
}

// 3. Banyan Tree Grove Interior Builder
function buildBanyanInterior(room: THREE.Group) {
  const barkMat = new THREE.MeshLambertMaterial({ color: '#4a3728' });
  const leafMat = new THREE.MeshLambertMaterial({ color: '#2d6a4f' });
  const pergolaWood = new THREE.MeshLambertMaterial({ color: '#7f4f24' });
  const tableMat = new THREE.MeshLambertMaterial({ color: '#936639' });

  // Giant Central Banyan Tree in Background
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.8, 5.0, 10), barkMat);
  trunk.position.set(0, 2.5, -6.5);
  trunk.castShadow = true;
  room.add(trunk);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(6.5, 12, 8), leafMat);
  canopy.position.set(0, 6.5, -6.0);
  canopy.scale.set(1.6, 0.45, 1.4);
  canopy.castShadow = true;
  room.add(canopy);

  // Wooden Pergola Roof Structure Overhead
  for (let s = -8; s <= 8; s += 2.0) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(18, 0.15, 0.25), pergolaWood);
    slat.position.set(0, 4.2, s);
    room.add(slat);
  }

  // Round Wooden Study Tables
  [[-5, 5], [5, 5], [-4, 1], [4, 1]].forEach(([tx, tz]) => {
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 16), tableMat);
    tableTop.position.set(tx, 0.72, tz);
    tableTop.castShadow = true;
    room.add(tableTop);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.72, 8), tableMat);
    leg.position.set(tx, 0.36, tz);
    room.add(leg);
  });
}

// 4. Open Air Theatre Interior Builder
function buildOatInterior(room: THREE.Group) {
  const stoneMat = new THREE.MeshLambertMaterial({ color: '#b8afa4' });
  const stageMat = new THREE.MeshLambertMaterial({ color: '#ecd5b8' });
  const lanternMat = new THREE.MeshLambertMaterial({ color: '#fef08a' });

  // Stage in front
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.5, 20), stageMat);
  stage.position.set(0, 0.25, -5.5);
  stage.receiveShadow = true;
  room.add(stage);

  // Concentric Semicircular Tiered Terraces
  const tiers = [
    { r: 5.5, y: 0.3, w: 0.9 },
    { r: 7.2, y: 0.8, w: 1.0 },
    { r: 9.0, y: 1.4, w: 1.1 },
  ];

  tiers.forEach(({ r, y, w }) => {
    const tierMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r + w, 0.35, 24, 1, false, Math.PI * 0.7, Math.PI * 1.6),
      stoneMat
    );
    tierMesh.position.y = y;
    tierMesh.castShadow = true;
    tierMesh.receiveShadow = true;
    room.add(tierMesh);
  });

  // Festival Overhead Lanterns
  for (let l = -6; l <= 6; l += 3) {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), lanternMat);
    lantern.position.set(l, 4.5, -1);
    room.add(lantern);
  }
}

// 5. Campus Café Interior Builder
function buildCafeInterior(room: THREE.Group) {
  const woodMat = new THREE.MeshLambertMaterial({ color: '#8c5835' });
  const tileMat = new THREE.MeshLambertMaterial({ color: '#fef3c7' });
  const counterMat = new THREE.MeshLambertMaterial({ color: '#52341b' });
  const menuMat = new THREE.MeshLambertMaterial({ color: '#1c1917' });

  // Back Espresso Counter & Coffee Bar
  const counter = new THREE.Mesh(new THREE.BoxGeometry(12, 1.1, 1.4), counterMat);
  counter.position.set(0, 0.55, -7.0);
  counter.castShadow = true;
  room.add(counter);

  // Blackboard Menu
  const menu = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.8, 0.08), menuMat);
  menu.position.set(0, 3.2, -9.8);
  room.add(menu);

  // Round Café Tables
  [[-5, 4.5], [5, 4.5], [-4, 0.5], [4, 0.5]].forEach(([tx, tz]) => {
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.08, 16), tileMat);
    table.position.set(tx, 0.72, tz);
    table.castShadow = true;
    room.add(table);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.72, 8), woodMat);
    leg.position.set(tx, 0.36, tz);
    room.add(leg);
  });
}

// 6. Sangam Gardens Interior Builder
function buildSangamInterior(room: THREE.Group) {
  const woodMat = new THREE.MeshLambertMaterial({ color: '#6f4e37' });
  const roofMat = new THREE.MeshLambertMaterial({ color: '#b95d36' });
  const pondMat = new THREE.MeshLambertMaterial({ color: '#38bdf8', transparent: true, opacity: 0.85 });
  const stoneMat = new THREE.MeshLambertMaterial({ color: '#c7beb1' });

  // Central Octagonal Gazebo Platform
  const gazeboPlinth = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.35, 8), stoneMat);
  gazeboPlinth.position.set(0, 0.18, 0);
  gazeboPlinth.receiveShadow = true;
  room.add(gazeboPlinth);

  // 8 Wooden Posts
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const px = Math.cos(angle) * 3.8;
    const pz = Math.sin(angle) * 3.8;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 6), woodMat);
    post.position.set(px, 1.7, pz);
    post.castShadow = true;
    room.add(post);
  }

  // Gazebo Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 8), roofMat);
  roof.position.set(0, 4.2, 0);
  roof.castShadow = true;
  room.add(roof);

  // Lotus Pond Basin in Front
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.25, 16), pondMat);
  pond.position.set(0, 0.12, 7.5);
  room.add(pond);
}

// 7. Gajendra Circle Interior Builder
function buildGajendraCircleInterior(room: THREE.Group) {
  const curbMat = new THREE.MeshLambertMaterial({ color: '#8b9b94' });
  const fountainMat = new THREE.MeshLambertMaterial({ color: '#e5ded5' });
  const waterMat = new THREE.MeshLambertMaterial({ color: '#38bdf8', transparent: true, opacity: 0.85 });
  const monumentMat = new THREE.MeshLambertMaterial({ color: '#64748b' });

  // Outer Circular Island
  const outerPlaza = new THREE.Mesh(new THREE.CylinderGeometry(9.0, 9.2, 0.25, 28), curbMat);
  outerPlaza.position.y = 0.12;
  outerPlaza.receiveShadow = true;
  room.add(outerPlaza);

  // Central Fountain Tier
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 0.6, 20), fountainMat);
  basin.position.y = 0.5;
  basin.castShadow = true;
  room.add(basin);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.45, 20), waterMat);
  water.position.y = 0.6;
  room.add(water);

  // Monument Pedestal & Elephant Statue
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 1.8), fountainMat);
  pedestal.position.y = 1.1;
  pedestal.castShadow = true;
  room.add(pedestal);

  const elephantBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.9), monumentMat);
  elephantBody.position.set(0, 1.9, 0);
  elephantBody.castShadow = true;
  room.add(elephantBody);

  const elephantHead = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), monumentMat);
  elephantHead.position.set(-0.8, 2.1, 0);
  room.add(elephantHead);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.7, 6), monumentMat);
  trunk.position.set(-1.15, 1.7, 0);
  trunk.rotation.z = Math.PI / 4;
  room.add(trunk);
}

