import * as THREE from 'three';
import type { StudentPresence } from '../../../types/studyverse';

/**
 * Creates a stylized, low-poly 3D student avatar seated at a desk or chair.
 */
export function createAvatar3D(
  student: StudentPresence,
  isCurrentUser: boolean = false
): THREE.Group {
  const group = new THREE.Group();
  group.name = `avatar-${student.sessionId}`;

  const skinTone = student.avatarConfig?.skinTone || '#f3c9aa';
  const hairColor = student.avatarConfig?.hairColor || '#4a2e1b';
  const clothingColor = student.avatarConfig?.clothingColor || (isCurrentUser ? '#2d5a43' : '#7c9a84');

  const skinMat = new THREE.MeshLambertMaterial({ color: skinTone });
  const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });
  const clothMat = new THREE.MeshLambertMaterial({ color: clothingColor });
  const darkPantsMat = new THREE.MeshLambertMaterial({ color: '#2f3b35' });
  const shoeMat = new THREE.MeshLambertMaterial({ color: '#1a1f1c' });
  const bookMat = new THREE.MeshLambertMaterial({ color: isCurrentUser ? '#d97706' : '#2563eb' });
  const pagesMat = new THREE.MeshLambertMaterial({ color: '#fefefe' });

  // 1. Torso (Sweater)
  const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.4);
  const torso = new THREE.Mesh(torsoGeo, clothMat);
  torso.position.y = 0.65;
  torso.castShadow = true;
  group.add(torso);

  // 2. Head
  const headGeo = new THREE.SphereGeometry(0.26, 12, 10);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.15;
  head.castShadow = true;
  group.add(head);

  // 3. Hair (Bun or Cap style)
  const hairGeo = new THREE.SphereGeometry(0.28, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 1.17;
  group.add(hair);

  if (student.avatarConfig?.hairStyle === 'messy-bun') {
    const bunGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const bun = new THREE.Mesh(bunGeo, hairMat);
    bun.position.set(0, 1.4, -0.12);
    group.add(bun);
  }

  // 4. Arms (Forward on desk)
  const armGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12);

  const leftArm = new THREE.Mesh(armGeo, clothMat);
  leftArm.position.set(-0.32, 0.55, 0.15);
  leftArm.rotation.x = Math.PI / 3;
  leftArm.rotation.z = -Math.PI / 12;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, clothMat);
  rightArm.position.set(0.32, 0.55, 0.15);
  rightArm.rotation.x = Math.PI / 3;
  rightArm.rotation.z = Math.PI / 12;
  group.add(rightArm);

  // Hands
  const handGeo = new THREE.SphereGeometry(0.07, 6, 6);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(-0.25, 0.42, 0.38);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.set(0.25, 0.42, 0.38);
  group.add(rightHand);

  // 5. Seated Legs (Bent forward 90 degrees)
  const upperLegGeo = new THREE.BoxGeometry(0.18, 0.45, 0.18);
  const lowerLegGeo = new THREE.BoxGeometry(0.16, 0.42, 0.16);

  // Left leg
  const leftUpperLeg = new THREE.Mesh(upperLegGeo, darkPantsMat);
  leftUpperLeg.position.set(-0.16, 0.32, 0.22);
  leftUpperLeg.rotation.x = Math.PI / 2;
  group.add(leftUpperLeg);

  const leftLowerLeg = new THREE.Mesh(lowerLegGeo, darkPantsMat);
  leftLowerLeg.position.set(-0.16, 0.1, 0.42);
  group.add(leftLowerLeg);

  // Right leg
  const rightUpperLeg = new THREE.Mesh(upperLegGeo, darkPantsMat);
  rightUpperLeg.position.set(0.16, 0.32, 0.22);
  rightUpperLeg.rotation.x = Math.PI / 2;
  group.add(rightUpperLeg);

  const rightLowerLeg = new THREE.Mesh(lowerLegGeo, darkPantsMat);
  rightLowerLeg.position.set(0.16, 0.1, 0.42);
  group.add(rightLowerLeg);

  // Shoes
  const shoeGeo = new THREE.BoxGeometry(0.16, 0.1, 0.24);
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(-0.16, -0.1, 0.46);
  group.add(leftShoe);

  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0.16, -0.1, 0.46);
  group.add(rightShoe);

  // 6. Study Book or Laptop
  const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.28), bookMat);
  bookCover.position.set(0, 0.42, 0.38);
  bookCover.rotation.x = -Math.PI / 16;
  group.add(bookCover);

  const bookPages = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.24), pagesMat);
  bookPages.position.set(0, 0.44, 0.38);
  bookPages.rotation.x = -Math.PI / 16;
  group.add(bookPages);

  // 7. Overhead Name Tag Canvas Sprite
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isCurrentUser ? 'rgba(45, 90, 67, 0.92)' : 'rgba(255, 255, 255, 0.92)';
    ctx.roundRect(10, 8, 236, 48, 16);
    ctx.fill();

    ctx.strokeStyle = isCurrentUser ? '#1e382b' : '#c8dcd3';
    ctx.lineWidth = 3;
    ctx.roundRect(10, 8, 236, 48, 16);
    ctx.stroke();

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = isCurrentUser ? '#ffffff' : '#1e382b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${student.name}${isCurrentUser ? ' (You)' : ''}`, 128, 32);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(0, 1.7, 0);
  sprite.scale.set(1.4, 0.35, 1);
  group.add(sprite);

  return group;
}

