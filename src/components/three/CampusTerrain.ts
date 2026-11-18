import * as THREE from 'three';

/**
 * Creates the spacious campus terrain plane and surrounding landscaped berms.
 * Footprint: 200x200 units, providing expansive breathing room and open green spaces.
 */
export function createCampusTerrain(): THREE.Group {
  const terrainGroup = new THREE.Group();
  terrainGroup.name = 'campus-terrain';

  // 1. Primary Campus Lawn Surface (Polished soft green)
  const lawnMat = new THREE.MeshLambertMaterial({
    color: '#84be91',
  });

  const lawnGeo = new THREE.PlaneGeometry(200, 200, 32, 32);
  const lawnMesh = new THREE.Mesh(lawnGeo, lawnMat);
  lawnMesh.rotation.x = -Math.PI / 2;
  lawnMesh.position.y = 0;
  lawnMesh.receiveShadow = true;
  terrainGroup.add(lawnMesh);

  // 2. Inner Campus Meadow (Warmer central lawn around academic sector)
  const meadowMat = new THREE.MeshLambertMaterial({
    color: '#8ec99b',
  });
  const meadowGeo = new THREE.PlaneGeometry(120, 120);
  const meadowMesh = new THREE.Mesh(meadowGeo, meadowMat);
  meadowMesh.rotation.x = -Math.PI / 2;
  meadowMesh.position.y = 0.005;
  meadowMesh.receiveShadow = true;
  terrainGroup.add(meadowMesh);

  // 3. Gentle Landscape Berms / Perimeter Low-Poly Hills
  // Adds depth inspired by IIIT Kottayam's topography without cluttering the center
  const hillMat = new THREE.MeshLambertMaterial({ color: '#6fa57d' });

  const hillConfigs = [
    // North boundary rolling mounds (Behind Library & LHC)
    { x: -55, z: -65, rx: 22, rz: 16, h: 5.5 },
    { x: 0, z: -72, rx: 28, rz: 18, h: 6.8 },
    { x: 55, z: -65, rx: 24, rz: 16, h: 5.2 },
    // East boundary mounds (Behind OAT amphitheatre)
    { x: 72, z: -20, rx: 18, rz: 32, h: 4.8 },
    { x: 70, z: 40, rx: 20, rz: 28, h: 4.2 },
    // West boundary mounds (Behind Banyan & LHC)
    { x: -70, z: -25, rx: 20, rz: 30, h: 5.0 },
    { x: -68, z: 35, rx: 18, rz: 26, h: 4.5 },
    // South boundary mounds
    { x: -50, z: 70, rx: 22, rz: 16, h: 3.8 },
    { x: 50, z: 70, rx: 22, rz: 16, h: 3.8 },
  ];

  hillConfigs.forEach(({ x, z, rx, rz, h }) => {
    const hillGeo = new THREE.ConeGeometry(rx, h, 7);
    const hillMesh = new THREE.Mesh(hillGeo, hillMat);
    hillMesh.scale.set(1, 1, rz / rx);
    hillMesh.position.set(x, h / 2 - 0.5, z);
    hillMesh.receiveShadow = true;
    terrainGroup.add(hillMesh);
  });

  return terrainGroup;
}

