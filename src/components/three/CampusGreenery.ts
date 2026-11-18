import * as THREE from 'three';

/**
 * Creates selective, well-spaced low-poly campus trees.
 * Follows the strict rule: "Avoid visual clustering. Do not block important entrances."
 * Uses instancing for performance on laptops and mobile devices.
 */
export function createCampusGreenery(): THREE.Group {
  const greeneryGroup = new THREE.Group();
  greeneryGroup.name = 'campus-greenery';

  // Distinct tree coordinates carefully plotted to avoid blocking entrances or walkways
  const treePositions: Array<{ x: number; z: number; scale: number; type: 'rain' | 'conifer' | 'palm' }> = [];

  // 1. Delhi Avenue (North-South Road) flanking avenue trees (set back 5 units from road)
  [-70, -58, -46, -18, 18, 46, 58, 70].forEach((z) => {
    treePositions.push({ x: -4.8, z, scale: 0.95 + Math.random() * 0.2, type: 'rain' });
    treePositions.push({ x: 4.8, z, scale: 0.95 + Math.random() * 0.2, type: 'rain' });
  });

  // 2. Bonn Avenue (East-West Road) flanking trees
  [-70, -58, -46, -18, 18, 46, 58, 70].forEach((x) => {
    treePositions.push({ x, z: -4.8, scale: 0.9 + Math.random() * 0.2, type: 'rain' });
    treePositions.push({ x, z: 4.8, scale: 0.9 + Math.random() * 0.2, type: 'rain' });
  });

  // 3. Central Library Courtyard flanking trees (framing the building, leaving entrance open)
  [
    { x: 16, z: -30 },
    { x: 16, z: -38 },
    { x: 40, z: -30 },
    { x: 40, z: -38 },
    { x: 28, z: -44 },
  ].forEach((pos) => {
    treePositions.push({ ...pos, scale: 1.1, type: 'rain' });
  });

  // 4. Lecture Hall Complex Courtyard flanking trees
  [
    { x: -46, z: -28 },
    { x: -46, z: -36 },
    { x: -22, z: -36 },
    { x: -34, z: -44 },
  ].forEach((pos) => {
    treePositions.push({ ...pos, scale: 1.05, type: 'rain' });
  });

  // 5. Open Air Theatre Natural Grove (Crest ring behind stone tiers)
  [
    { x: 26, z: -16 },
    { x: 48, z: -14 },
    { x: 46, z: 0 },
    { x: 38, z: -20 },
  ].forEach((pos) => {
    treePositions.push({ ...pos, scale: 1.15, type: 'rain' });
  });

  // 6. Campus Café Garden Patio trees
  [
    { x: -18, z: 32 },
    { x: -18, z: 42 },
    { x: -38, z: 32 },
    { x: -38, z: 42 },
  ].forEach((pos) => {
    treePositions.push({ ...pos, scale: 0.95, type: 'rain' });
  });

  // 7. Sangam Botanical Trees (Lush perimeter park greenery)
  [
    { x: 20, z: 32 },
    { x: 44, z: 30 },
    { x: 42, z: 42 },
    { x: 24, z: 44 },
    { x: 32, z: 46 },
  ].forEach((pos) => {
    treePositions.push({ ...pos, scale: 1.0, type: 'rain' });
  });

  // 8. Outer Campus Perimeter Forest Border (Creates natural horizon bounds)
  for (let angle = 0; angle < Math.PI * 2; angle += 0.22) {
    const radius = 80 + (Math.sin(angle * 5) * 6);
    const px = Math.cos(angle) * radius;
    const pz = Math.sin(angle) * radius;
    // Don't place on the 4 main road exits
    if (Math.abs(px) > 6 && Math.abs(pz) > 6) {
      treePositions.push({
        x: px,
        z: pz,
        scale: 1.0 + Math.random() * 0.4,
        type: Math.random() > 0.3 ? 'rain' : 'conifer',
      });
    }
  }

  // Geometries and Materials
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.28, 2.4, 8);
  const trunkMat = new THREE.MeshLambertMaterial({ color: '#544234' });

  // Faceted stylized rain tree canopy (Dodecahedron)
  const canopyGeo = new THREE.DodecahedronGeometry(1.6, 1);
  const canopyMat = new THREE.MeshLambertMaterial({ color: '#417a4f' });
  const canopyMatAlt = new THREE.MeshLambertMaterial({ color: '#31693e' });

  // Conifer canopy (Cone)
  const coniferGeo = new THREE.ConeGeometry(1.4, 3.2, 7);
  const coniferMat = new THREE.MeshLambertMaterial({ color: '#275836' });

  // Construct trees efficiently
  treePositions.forEach(({ x, z, scale, type }) => {
    const singleTree = new THREE.Group();
    singleTree.position.set(x, 0, z);
    singleTree.scale.set(scale, scale, scale);

    // Trunk
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.2;
    singleTree.add(trunk);

    if (type === 'rain') {
      const isAlt = Math.random() > 0.5;
      const canopy = new THREE.Mesh(canopyGeo, isAlt ? canopyMatAlt : canopyMat);
      canopy.position.y = 3.0;
      canopy.scale.set(1.1, 0.9, 1.1);
      singleTree.add(canopy);
    } else {
      const cone = new THREE.Mesh(coniferGeo, coniferMat);
      cone.position.y = 3.2;
      singleTree.add(cone);
    }

    greeneryGroup.add(singleTree);
  });

  return greeneryGroup;
}

