import * as THREE from 'three';

/**
 * Creates the campus road network, central roundabout, and pedestrian pathways.
 * Roads naturally connect every destination with generous open plazas between them.
 */
export function createCampusRoads(): THREE.Group {
  const roadsGroup = new THREE.Group();
  roadsGroup.name = 'campus-roads';

  const asphaltMat = new THREE.MeshLambertMaterial({ color: '#525e58' });
  const curbMat = new THREE.MeshLambertMaterial({ color: '#ced6d1' });
  const markingMat = new THREE.MeshLambertMaterial({ color: '#f8faf9' });
  const stonePavingMat = new THREE.MeshLambertMaterial({ color: '#d9d3c7' });
  const sandstoneMat = new THREE.MeshLambertMaterial({ color: '#e8ded0' });

  // 1. North-South Main Spine (Delhi Avenue) — 5.4 units wide, 180 units long
  const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 180), asphaltMat);
  nsRoad.rotation.x = -Math.PI / 2;
  nsRoad.position.set(0, 0.02, 0);
  nsRoad.receiveShadow = true;
  roadsGroup.add(nsRoad);

  // NS Curbs
  const nsCurbWest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 180), curbMat);
  nsCurbWest.position.set(-2.85, 0.04, 0);
  roadsGroup.add(nsCurbWest);

  const nsCurbEast = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 180), curbMat);
  nsCurbEast.position.set(2.85, 0.04, 0);
  roadsGroup.add(nsCurbEast);

  // 2. East-West Main Spine (Bonn Avenue) — 5.4 units wide, 180 units long
  const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(180, 5.4), asphaltMat);
  ewRoad.rotation.x = -Math.PI / 2;
  ewRoad.position.set(0, 0.02, 0);
  ewRoad.receiveShadow = true;
  roadsGroup.add(ewRoad);

  // EW Curbs
  const ewCurbNorth = new THREE.Mesh(new THREE.BoxGeometry(180, 0.08, 0.3), curbMat);
  ewCurbNorth.position.set(0, 0.04, -2.85);
  roadsGroup.add(ewCurbNorth);

  const ewCurbSouth = new THREE.Mesh(new THREE.BoxGeometry(180, 0.08, 0.3), curbMat);
  ewCurbSouth.position.set(0, 0.04, 2.85);
  roadsGroup.add(ewCurbSouth);

  // 3. Gajendra Circle Roundabout Ring
  // Inner radius: 6.2, Outer radius: 11.8 (width 5.6)
  const ringGeo = new THREE.RingGeometry(6.2, 11.8, 48);
  const ringMesh = new THREE.Mesh(ringGeo, asphaltMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.set(0, 0.025, 0);
  ringMesh.receiveShadow = true;
  roadsGroup.add(ringMesh);

  // Roundabout Inner Curb Ring
  const innerCurbGeo = new THREE.RingGeometry(6.0, 6.25, 48);
  const innerCurb = new THREE.Mesh(innerCurbGeo, curbMat);
  innerCurb.rotation.x = -Math.PI / 2;
  innerCurb.position.set(0, 0.035, 0);
  roadsGroup.add(innerCurb);

  // Roundabout Outer Curb Ring
  const outerCurbGeo = new THREE.RingGeometry(11.75, 12.0, 48);
  const outerCurb = new THREE.Mesh(outerCurbGeo, curbMat);
  outerCurb.rotation.x = -Math.PI / 2;
  outerCurb.position.set(0, 0.035, 0);
  roadsGroup.add(outerCurb);

  // 4. Center Dashed Lane Markings
  // North and South lane dashes (avoiding the roundabout radius 12)
  for (let z = -85; z <= 85; z += 4.5) {
    if (Math.abs(z) > 12.5) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 2.4), markingMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.03, z);
      roadsGroup.add(dash);
    }
  }

  // East and West lane dashes
  for (let x = -85; x <= 85; x += 4.5) {
    if (Math.abs(x) > 12.5) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.2), markingMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.03, 0);
      roadsGroup.add(dash);
    }
  }

  // 5. Pedestrian Crosswalks at Roundabout Entrances
  const crosswalks = [
    { x: 0, z: -13.5, rot: 0 },
    { x: 0, z: 13.5, rot: 0 },
    { x: -13.5, z: 0, rot: Math.PI / 2 },
    { x: 13.5, z: 0, rot: Math.PI / 2 },
  ];

  crosswalks.forEach(({ x, z, rot }) => {
    for (let s = -2.2; s <= 2.2; s += 0.55) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 1.4), markingMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.rotation.z = rot;
      if (rot === 0) {
        stripe.position.set(s, 0.032, z);
      } else {
        stripe.position.set(x, 0.032, s);
      }
      roadsGroup.add(stripe);
    }
  });

  // 6. Connected Pedestrian Walkways & Entrance Plazas
  // A. Central Library Promenade (From East-West road to Library entrance at [28, 0, -32])
  // Pathway segment 1: North branch from EW road at x = 28
  const libWalkway1 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 30), stonePavingMat);
  libWalkway1.rotation.x = -Math.PI / 2;
  libWalkway1.position.set(28, 0.015, -16);
  libWalkway1.receiveShadow = true;
  roadsGroup.add(libWalkway1);

  // Library Front Courtyard Plaza
  const libPlaza = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), sandstoneMat);
  libPlaza.rotation.x = -Math.PI / 2;
  libPlaza.position.set(28, 0.018, -32);
  libPlaza.receiveShadow = true;
  roadsGroup.add(libPlaza);

  // B. Lecture Hall Complex Promenade (From EW road to LHC at [-34, 0, -30])
  const lhcWalkway = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 28), stonePavingMat);
  lhcWalkway.rotation.x = -Math.PI / 2;
  lhcWalkway.position.set(-34, 0.015, -15);
  lhcWalkway.receiveShadow = true;
  roadsGroup.add(lhcWalkway);

  // LHC Forecourt Plaza
  const lhcPlaza = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), sandstoneMat);
  lhcPlaza.rotation.x = -Math.PI / 2;
  lhcPlaza.position.set(-34, 0.018, -30);
  lhcPlaza.receiveShadow = true;
  roadsGroup.add(lhcPlaza);

  // C. Banyan Tree Grove Garden Path (Branching from West road into [-32, 0, 8])
  const banyanPath = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.8), stonePavingMat);
  banyanPath.rotation.x = -Math.PI / 2;
  banyanPath.position.set(-22, 0.015, 6);
  banyanPath.receiveShadow = true;
  roadsGroup.add(banyanPath);

  // Banyan Circular Plinth Paving
  const banyanPlinth = new THREE.Mesh(new THREE.CircleGeometry(11, 32), sandstoneMat);
  banyanPlinth.rotation.x = -Math.PI / 2;
  banyanPlinth.position.set(-32, 0.018, 8);
  banyanPlinth.receiveShadow = true;
  roadsGroup.add(banyanPlinth);

  // D. Open Air Theatre Terrace Path (From East road to OAT at [36, 0, -12])
  const oatPath = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.6), stonePavingMat);
  oatPath.rotation.x = -Math.PI / 2;
  oatPath.position.set(28, 0.015, -8);
  oatPath.receiveShadow = true;
  roadsGroup.add(oatPath);

  // OAT Circular Amphitheatre Base Paving (Radius 10.5 to cleanly avoid the main road)
  const oatBase = new THREE.Mesh(new THREE.CircleGeometry(10.5, 36), sandstoneMat);
  oatBase.rotation.x = -Math.PI / 2;
  oatBase.position.set(36, 0.018, -12);
  oatBase.receiveShadow = true;
  roadsGroup.add(oatBase);

  // E. Campus Café Promenade (From South road to Café at [-28, 0, 36])
  const cafePath = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 26), stonePavingMat);
  cafePath.rotation.x = -Math.PI / 2;
  cafePath.position.set(-28, 0.015, 20);
  cafePath.receiveShadow = true;
  roadsGroup.add(cafePath);

  // Café Terrace Paving
  const cafePlaza = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), sandstoneMat);
  cafePlaza.rotation.x = -Math.PI / 2;
  cafePlaza.position.set(-28, 0.018, 36);
  cafePlaza.receiveShadow = true;
  roadsGroup.add(cafePlaza);

  // F. Sangam Gardens Promenade (From South road to Sangam at [32, 0, 34])
  const sangamPath = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 24), stonePavingMat);
  sangamPath.rotation.x = -Math.PI / 2;
  sangamPath.position.set(32, 0.015, 19);
  sangamPath.receiveShadow = true;
  roadsGroup.add(sangamPath);

  // Sangam Circular Garden Plaza
  const sangamPlaza = new THREE.Mesh(new THREE.CircleGeometry(12, 32), sandstoneMat);
  sangamPlaza.rotation.x = -Math.PI / 2;
  sangamPlaza.position.set(32, 0.018, 34);
  sangamPlaza.receiveShadow = true;
  roadsGroup.add(sangamPlaza);

  return roadsGroup;
}
