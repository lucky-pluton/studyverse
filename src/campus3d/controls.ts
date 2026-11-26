import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';

export interface FlyOptions {
  x: number;
  z: number;
  y?: number;
  dist: number;
  polar?: number;
  azimuth?: number;
  duration?: number;
}

interface View { tx: number; ty: number; tz: number; r: number; phi: number; theta: number }

const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wrapAngle = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Map-style camera: drag to move, scroll or pinch to zoom toward the cursor, right-drag or
 * Ctrl-drag to turn, WASD to fly. Also runs smooth flights and a first-person walking mode.
 */
export class CameraRig {
  readonly controls: MapControls;
  readonly camera: THREE.PerspectiveCamera;
  walking = false;
  onUserMove: (() => void) | null = null;
  private flight: { from: View; to: View; t: number; dur: number } | null = null;
  private sph = new THREE.Spherical();
  private yaw = 0;
  private pitch = 0;
  private saved: View | null = null;
  private bounds: [number, number, number, number];
  private blocked: (x: number, z: number) => boolean;

  constructor(camera: THREE.PerspectiveCamera, dom: HTMLElement, bounds: [number, number, number, number], blocked: (x: number, z: number) => boolean) {
    this.camera = camera;
    this.bounds = bounds;
    this.blocked = blocked;
    const c = new MapControls(camera, dom);
    c.enableDamping = true;
    c.dampingFactor = 0.09;
    c.screenSpacePanning = false;
    c.zoomToCursor = true;
    c.minDistance = 14;
    c.maxDistance = 4600;
    c.maxPolarAngle = 1.38;
    c.minPolarAngle = 0.02;
    c.zoomSpeed = 1.1;
    c.rotateSpeed = 0.55;
    c.autoRotateSpeed = 0.6;
    c.addEventListener('start', () => {
      this.flight = null;
      this.onUserMove?.();
    });
    this.controls = c;
  }

  get target(): THREE.Vector3 { return this.controls.target; }
  get viewDist(): number { return this.walking ? 2 : this.camera.position.distanceTo(this.controls.target); }
  get azimuth(): number { return this.walking ? this.yaw : this.controls.getAzimuthalAngle(); }
  get flying(): boolean { return !!this.flight; }

  private current(): View {
    const off = this.camera.position.clone().sub(this.controls.target);
    this.sph.setFromVector3(off);
    return { tx: this.controls.target.x, ty: this.controls.target.y, tz: this.controls.target.z, r: this.sph.radius, phi: this.sph.phi, theta: this.sph.theta };
  }

  private apply(v: View): void {
    this.controls.target.set(v.tx, v.ty, v.tz);
    this.sph.set(v.r, v.phi, v.theta);
    this.camera.position.setFromSpherical(this.sph).add(this.controls.target);
    this.camera.lookAt(this.controls.target);
  }

  flyTo(o: FlyOptions): void {
    if (this.walking) this.setWalking(false);
    const from = this.current();
    const to: View = {
      tx: o.x, ty: o.y ?? 0, tz: o.z,
      r: THREE.MathUtils.clamp(o.dist, this.controls.minDistance, this.controls.maxDistance),
      phi: o.polar ?? THREE.MathUtils.clamp(from.phi, 0.6, 1.05),
      theta: o.azimuth ?? from.theta,
    };
    to.theta = from.theta + wrapAngle(to.theta - from.theta);
    const travel = Math.hypot(to.tx - from.tx, to.tz - from.tz);
    this.flight = { from, to, t: 0, dur: o.duration ?? THREE.MathUtils.clamp(0.9 + travel / 1400, 0.9, 2.6) };
  }

  setView(o: FlyOptions): void {
    this.flight = null;
    this.apply({ tx: o.x, ty: o.y ?? 0, tz: o.z, r: o.dist, phi: o.polar ?? 0.9, theta: o.azimuth ?? 0 });
    this.controls.update();
  }

  faceNorth(): void {
    const v = this.current();
    this.flyTo({ x: v.tx, z: v.tz, dist: v.r, polar: v.phi, azimuth: 0, duration: 0.8 });
  }

  /* -------- first-person walking -------- */

  setWalking(on: boolean, at?: { x: number; z: number; heading?: number }): void {
    if (on === this.walking) return;
    this.flight = null;
    if (on) {
      this.saved = this.current();
      this.walking = true;
      this.controls.enabled = false;
      const x = at ? at.x : this.controls.target.x, z = at ? at.z : this.controls.target.z;
      this.yaw = at?.heading ?? this.controls.getAzimuthalAngle();
      this.pitch = 0.02;
      this.camera.position.set(x, 1.7, z);
      this.lookFromYaw();
    } else {
      this.walking = false;
      this.controls.enabled = true;
      const p = this.camera.position;
      const s = this.saved;
      this.apply({ tx: p.x, ty: 0, tz: p.z, r: s ? Math.min(s.r, 420) : 300, phi: s ? s.phi : 0.9, theta: this.yaw });
      this.controls.update();
    }
  }

  /** yaw 0 looks north (−z) */
  private lookFromYaw(): void {
    const d = new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
    this.camera.lookAt(this.camera.position.clone().add(d));
  }

  look(dx: number, dy: number): void {
    this.yaw -= dx * 0.004;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.003, -0.9, 0.9);
    this.lookFromYaw();
  }

  walkStep(forward: number, right: number): void {
    const p = this.camera.position;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const nx = p.x + fx * forward + -fz * right, nz = p.z + fz * forward + fx * right;
    if (!this.blocked(nx, nz)) p.set(nx, 1.7, nz);
    else if (!this.blocked(nx, p.z)) p.x = nx;
    else if (!this.blocked(p.x, nz)) p.z = nz;
    this.lookFromYaw();
  }

  /* -------- per frame -------- */

  update(dt: number, keys: Set<string>): void {
    const k = (name: string): number => (keys.has(name) ? 1 : 0);
    const fwd = k('w') + k('arrowup') - k('s') - k('arrowdown');
    const side = k('d') + k('arrowright') - k('a') - k('arrowleft');
    const turn = k('q') - k('e');
    if (this.walking) {
      const speed = keys.has('shift') ? 14 : 5.5;
      if (fwd || side) this.walkStep(fwd * speed * dt, side * speed * dt);
      if (turn) { this.yaw += turn * 1.4 * dt; this.lookFromYaw(); }
      return;
    }
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(1, f.t + dt / f.dur);
      const e = ease(f.t);
      const lerp = (a: number, b: number): number => a + (b - a) * e;
      // rise a little mid-flight on long hops so the camera does not skim the roofs
      const hop = Math.sin(Math.PI * e) * Math.min(600, Math.hypot(f.to.tx - f.from.tx, f.to.tz - f.from.tz) * 0.25);
      this.apply({ tx: lerp(f.from.tx, f.to.tx), ty: lerp(f.from.ty, f.to.ty), tz: lerp(f.from.tz, f.to.tz), r: lerp(f.from.r, f.to.r) + hop, phi: lerp(f.from.phi, f.to.phi), theta: lerp(f.from.theta, f.to.theta) });
      if (f.t >= 1) { this.flight = null; this.controls.update(); }
      return;
    }
    if (fwd || side || turn) {
      this.onUserMove?.();
      const az = this.controls.getAzimuthalAngle();
      const speed = Math.max(40, this.viewDist * 0.7) * dt * (keys.has('shift') ? 2.5 : 1);
      const fx = -Math.sin(az), fz = -Math.cos(az);
      const dx = (fx * fwd + -fz * side) * speed, dz = (fz * fwd + fx * side) * speed;
      this.controls.target.x += dx; this.controls.target.z += dz;
      this.camera.position.x += dx; this.camera.position.z += dz;
      if (turn) {
        const off = this.camera.position.clone().sub(this.controls.target);
        off.applyAxisAngle(new THREE.Vector3(0, 1, 0), turn * 1.2 * dt);
        this.camera.position.copy(this.controls.target).add(off);
      }
    }
    this.controls.update(dt);
    // keep the view over the mapped area
    const t = this.controls.target, b = this.bounds;
    const cx = THREE.MathUtils.clamp(t.x, b[0], b[2]), cz = THREE.MathUtils.clamp(t.z, b[1], b[3]);
    if (cx !== t.x || cz !== t.z) {
      this.camera.position.x += cx - t.x; this.camera.position.z += cz - t.z;
      t.x = cx; t.z = cz;
    }
  }
}
