import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SkyEnv } from '../sky';
import { buildRoom, type RoomBuild } from './rooms';

export type RoomTime = 'day' | 'sunset' | 'night';
const HOURS: Record<RoomTime, number> = { day: 12.2, sunset: 17.3, night: 20.5 };

export interface Projected {
  x: number;
  y: number;
  /** distance from the camera in metres */
  dist: number;
  visible: boolean;
}

/** Renders one study room in 3D with the same sky, light and tone as the 3D campus. */
export class RoomStage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(46, 1, 0.1, 4000);
  readonly controls: OrbitControls;
  readonly room: RoomBuild;
  private sky: SkyEnv;
  private raf = 0;
  private container: HTMLElement;
  private v = new THREE.Vector3();
  private night = 0;
  private flight: { fromPos: THREE.Vector3; fromTarget: THREE.Vector3; toPos: THREE.Vector3; toTarget: THREE.Vector3; t: number } | null = null;
  onFrame: (() => void) | null = null;

  constructor(container: HTMLElement, locationId: string) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.sky = new SkyEnv(this.scene);
    this.sky.sun.shadow.mapSize.set(2048, 2048);
    this.room = buildRoom(locationId);
    this.scene.add(this.room.group);
    if (this.room.indoor) {
      // soft fill so the room reads well away from the windows
      this.scene.add(new THREE.AmbientLight(0xfff4e6, 0.55));
    }

    const c = new OrbitControls(this.camera, this.renderer.domElement);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = 2.5;
    c.maxDistance = this.room.maxDistance;
    c.maxPolarAngle = 1.5;
    c.minPolarAngle = 0.25;
    c.rotateSpeed = 0.6;
    c.screenSpacePanning = true;
    c.addEventListener('start', () => { this.flight = null; });
    this.controls = c;
    this.resetView(true);

    this.resize();
    window.addEventListener('resize', this.resize);
    this.loop();
  }

  private resize = (): void => {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the whole room in frame on tall, narrow screens
    this.camera.fov = w / h < 1 ? 62 : 46;
    this.camera.updateProjectionMatrix();
  };

  setTime(t: RoomTime): void {
    this.sky.setHour(HOURS[t] ?? 12.2);
    this.night = this.sky.nightF;
    const interior = this.room.indoor ? 0.6 + this.night * 1.6 : this.night * 1.2;
    for (const l of this.room.lights) l.intensity = interior * 18;
    for (const m of this.room.glow) m.emissiveIntensity = 0.25 + this.night * 1.8;
  }

  resetView(instant = false): void {
    const { pos, target } = this.room.view;
    const toPos = new THREE.Vector3(...pos), toTarget = new THREE.Vector3(...target);
    if (instant) {
      this.camera.position.copy(toPos);
      this.controls.target.copy(toTarget);
      this.controls.update();
      return;
    }
    this.flight = { fromPos: this.camera.position.clone(), fromTarget: this.controls.target.clone(), toPos, toTarget, t: 0 };
  }

  zoom(factor: number): void {
    const off = this.camera.position.clone().sub(this.controls.target);
    const len = THREE.MathUtils.clamp(off.length() * factor, this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(off.setLength(len));
  }

  /** Screen position of a seat anchor, in CSS pixels relative to the container. */
  project(seatId: string, out: Projected): boolean {
    const a = this.room.anchors.get(seatId);
    if (!a) return false;
    this.v.copy(a).project(this.camera);
    const w = this.container.clientWidth, h = this.container.clientHeight;
    out.x = (this.v.x * 0.5 + 0.5) * w;
    out.y = (-this.v.y * 0.5 + 0.5) * h;
    out.dist = this.camera.position.distanceTo(a);
    out.visible = this.v.z < 1 && this.v.x > -1.2 && this.v.x < 1.2 && this.v.y > -1.3 && this.v.y < 1.3;
    return true;
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(1, f.t + 1 / 50);
      const e = f.t < 0.5 ? 2 * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 2) / 2;
      this.camera.position.lerpVectors(f.fromPos, f.toPos, e);
      this.controls.target.lerpVectors(f.fromTarget, f.toTarget, e);
      if (f.t >= 1) this.flight = null;
    }
    this.controls.update();
    // keep the camera inside the room (or above the ground outdoors)
    const b = this.room.bounds, p = this.camera.position;
    p.set(THREE.MathUtils.clamp(p.x, b.x[0], b.x[1]), THREE.MathUtils.clamp(p.y, b.y[0], b.y[1]), THREE.MathUtils.clamp(p.z, b.z[0], b.z[1]));
    this.sky.follow(this.camera, this.controls.target, 30, 26);
    this.renderer.toneMappingExposure = this.sky.exposure * (this.room.indoor ? 1.05 : 1);
    this.onFrame?.();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const x of mats) {
        for (const v of Object.values(x)) if (v instanceof THREE.Texture) v.dispose();
        x.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
