import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface CameraTransitionTarget {
  position: THREE.Vector3;
  target: THREE.Vector3;
  duration: number; // in seconds
}

export class CampusCameraController {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private transition: {
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startTime: number;
    duration: number;
    active: boolean;
  } | null = null;

  // Default Isometric Overview Camera Position & Target
  public static readonly DEFAULT_POSITION = new THREE.Vector3(42, 48, 52);
  public static readonly DEFAULT_TARGET = new THREE.Vector3(0, 1.5, 0);

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.camera.position.copy(CampusCameraController.DEFAULT_POSITION);

    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Sensible exploration boundaries (prevent clipping into terrain or losing campus)
    this.controls.minDistance = 14;
    this.controls.maxDistance = 110;
    this.controls.minPolarAngle = Math.PI / 8; // Prevent looking strictly top-down
    this.controls.maxPolarAngle = Math.PI / 2.22; // Prevent camera going underground
    this.controls.target.copy(CampusCameraController.DEFAULT_TARGET);
  }

  public getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Resets camera to the default campus overview
   */
  public resetToOverview(duration = 1.0) {
    this.flyTo(CampusCameraController.DEFAULT_POSITION, CampusCameraController.DEFAULT_TARGET, duration);
  }

  /**
   * Focuses camera smoothly onto a specific building location
   */
  public focusBuilding(buildingPos: [number, number, number], offset = { x: 14, y: 12, z: 16 }, duration = 1.2) {
    const target = new THREE.Vector3(buildingPos[0], buildingPos[1] + 1.8, buildingPos[2]);
    const position = new THREE.Vector3(
      buildingPos[0] + offset.x,
      buildingPos[1] + offset.y,
      buildingPos[2] + offset.z
    );
    this.flyTo(position, target, duration);
  }

  /**
   * Smoothly interpolates camera position and target over time
   */
  public flyTo(endPos: THREE.Vector3, endTarget: THREE.Vector3, duration = 1.0) {
    this.transition = {
      startPos: this.camera.position.clone(),
      endPos: endPos.clone(),
      startTarget: this.controls.target.clone(),
      endTarget: endTarget.clone(),
      startTime: performance.now(),
      duration: duration * 1000,
      active: true,
    };
  }

  /**
   * Updates camera animation on every frame
   */
  public update() {
    if (this.transition && this.transition.active) {
      const elapsed = performance.now() - this.transition.startTime;
      const progress = Math.min(1.0, elapsed / this.transition.duration);

      // Smooth ease-in-out cubic
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(this.transition.startPos, this.transition.endPos, ease);
      this.controls.target.lerpVectors(this.transition.startTarget, this.transition.endTarget, ease);

      if (progress >= 1.0) {
        this.transition.active = false;
        this.transition = null;
      }
    }

    this.controls.update();
  }

  public dispose() {
    this.controls.dispose();
  }
}

