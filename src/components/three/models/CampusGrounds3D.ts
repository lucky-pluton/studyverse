import * as THREE from 'three';

export function createCampusGrounds3D(): THREE.Group {
  const grounds = new THREE.Group();
  grounds.name = 'campus-grounds';

  // 1. Lush Green Terrain Plane
  const grassMat = new THREE.MeshLambertMaterial({ color: '#7cb58a' });
  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const ground = new THREE.Mesh(groundGeo, grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  grounds.add(ground);

  // 2. Asphalt Roads (Crossroad with Roundabout Center)
  const asphaltMat = new THREE.MeshLambertMaterial({ color: '#4f5c56' });
  const markingMat = new THREE.MeshLambertMaterial({ color: '#f5f7f6' });

  // North-South Road (Delhi Avenue)
  const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 70), asphaltMat);
  nsRoad.rotation.x = -Math.PI / 2;
  nsRoad.position.y = 0.02;
  nsRoad.receiveShadow = true;
  grounds.add(nsRoad);

  // East-West Road (Bonn Avenue)
  const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(70, 4.2), asphaltMat);
  ewRoad.rotation.x = -Math.PI / 2;
  ewRoad.position.y = 0.02;
  ewRoad.receiveShadow = true;
  grounds.add(ewRoad);

  // White Road Markings / Center Lines
  for (let z = -32; z <= 32; z += 4) {
    if (Math.abs(z) > 4.5) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 2.0), markingMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.03, z);
      grounds.add(line);
    }
  }

  for (let x = -32; x <= 32; x += 4) {
    if (Math.abs(x) > 4.5) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.18), markingMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.03, 0);
      grounds.add(line);
    }
  }

  // Crosswalks around roundabout
  const crosswalkPositions = [
    { x: 0, z: -5.5, rot: 0 },
    { x: 0, z: 5.5, rot: 0 },
    { x: -5.5, z: 0, rot: Math.PI / 2 },
    { x: 5.5, z: 0, rot: Math.PI / 2 },
  ];

  crosswalkPositions.forEach(({ x, z, rot }) => {
    for (let s = -1.6; s <= 1.6; s += 0.5) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 1.2), markingMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.rotation.z = rot;
      if (rot === 0) {
        stripe.position.set(s, 0.03, z);
      } else {
        stripe.position.set(x, 0.03, s);
      }
      grounds.add(stripe);
    }
  });

  // 3. Low-Poly Trees along pathways
  const treeColors = ['#4d8a5c', '#3d784a', '#5a9e69', '#63a874'];
  const treeBarkMat = new THREE.MeshLambertMaterial({ color: '#5b4533' });

  const treePositions = [
    // Around Library
    [-9, -16], [4, -16], [-10, -21], [5, -21],
    // Around LHC
    [-23, -12], [-14, -15], [-22, -6],
    // Around Banyan Grove
    [-15, -4], [-6, -4], [-14, 2],
    // Around OAT
    [11, -12], [22, -10], [13, -4], [21, -4],
    // Around Café
    [-21, 12], [-11, 15], [-20, 18],
    // Around Sangam Gardens
    [9, 10], [19, 10], [9, 16], [18, 17],
    // Roadside Raintrees
    [-2.8, -10], [2.8, -10], [-2.8, 10], [2.8, 10],
    [-10, -2.8], [-10, 2.8], [10, -2.8], [10, 2.8],
  ];

  treePositions.forEach(([tx, tz], idx) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 0, tz);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 6), treeBarkMat);
    trunk.position.y = 0.8;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const color = treeColors[idx % treeColors.length];
    const foliageMat = new THREE.MeshLambertMaterial({ color });

    // Puffy Low-Poly Crown
    const crown1 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 7, 6), foliageMat);
    crown1.position.y = 1.9;
    crown1.castShadow = true;
    treeGroup.add(crown1);

    const crown2 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 5), foliageMat);
    crown2.position.set(0.2, 2.3, -0.1);
    treeGroup.add(crown2);

    grounds.add(treeGroup);
  });

  // 4. Peaceful Spotted Chital Deer Models
  const deerPositions = [
    { x: -7, z: -10, rot: 0.4 },
    { x: 8, z: -6, rot: -0.6 },
    { x: -5, z: 9, rot: 1.2 },
    { x: 6, z: 7, rot: -1.0 },
  ];

  const deerMat = new THREE.MeshLambertMaterial({ color: '#b97a4a' });
  const deerSpotMat = new THREE.MeshLambertMaterial({ color: '#f5eee6' });

  deerPositions.forEach(({ x, z, rot }) => {
    const deer = new THREE.Group();
    deer.position.set(x, 0, z);
    deer.rotation.y = rot;

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.7), deerMat);
    body.position.y = 0.55;
    deer.add(body);

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.16), deerMat);
    neck.position.set(0, 0.75, 0.3);
    neck.rotation.x = -Math.PI / 6;
    deer.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.24), deerMat);
    head.position.set(0, 0.95, 0.4);
    deer.add(head);

    // White belly spot
    const spot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.5), deerSpotMat);
    spot.position.set(0, 0.38, 0);
    deer.add(spot);

    // 4 slender legs
    const legGeo = new THREE.BoxGeometry(0.06, 0.45, 0.06);
    const legOffsets = [
      [-0.12, -0.25],
      [0.12, -0.25],
      [-0.12, 0.25],
      [0.12, 0.25],
    ];
    legOffsets.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, deerMat);
      leg.position.set(lx, 0.22, lz);
      deer.add(leg);
    });

    grounds.add(deer);
  });

  return grounds;
}

