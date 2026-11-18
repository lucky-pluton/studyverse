import * as THREE from 'three';
import type { LocationId } from '../../types/studyverse';

export class BuildingInteractionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private camera: THREE.Camera;
  private clickableMap: Map<THREE.Object3D, LocationId>;
  private hoveredObject: THREE.Mesh | null = null;

  constructor(camera: THREE.Camera, clickableMap: Map<THREE.Object3D, LocationId>) {
    this.camera = camera;
    this.clickableMap = clickableMap;
  }

  /**
   * Performs raycasting against clickable building meshes
   */
  public checkIntersection(
    clientX: number,
    clientY: number,
    rect: DOMRect
  ): { locationId: LocationId | null; mesh: THREE.Object3D | null } {
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const objects = Array.from(this.clickableMap.keys());
    // Direct intersection without deep subtree traversal for max performance
    const intersects = this.raycaster.intersectObjects(objects, false);

    if (intersects.length > 0) {
      let hitObj: THREE.Object3D | null = intersects[0].object;
      while (hitObj && !this.clickableMap.has(hitObj)) {
        hitObj = hitObj.parent;
      }
      if (hitObj && this.clickableMap.has(hitObj)) {
        return {
          locationId: this.clickableMap.get(hitObj)!,
          mesh: hitObj,
        };
      }
    }

    return { locationId: null, mesh: null };
  }

  /**
   * Applies subtle hover highlight without visual noise
   */
  public applyHoverHighlight(mesh: THREE.Object3D | null) {
    if (this.hoveredObject === mesh) return;

    // Reset previous
    if (this.hoveredObject && this.hoveredObject.material && 'emissive' in this.hoveredObject.material) {
      (this.hoveredObject.material as THREE.MeshLambertMaterial).emissive.setHex(0x000000);
    }

    if (mesh && mesh instanceof THREE.Mesh && mesh.material && 'emissive' in mesh.material) {
      this.hoveredObject = mesh;
      (mesh.material as THREE.MeshLambertMaterial).emissive.setHex(0x183824); // Subtle IITM emerald accent
    } else {
      this.hoveredObject = null;
    }
  }

  public clearHover() {
    if (this.hoveredObject && this.hoveredObject.material && 'emissive' in this.hoveredObject.material) {
      (this.hoveredObject.material as THREE.MeshLambertMaterial).emissive.setHex(0x000000);
    }
    this.hoveredObject = null;
  }
}
