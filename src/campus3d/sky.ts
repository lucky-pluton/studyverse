import * as THREE from 'three';

/** Sun position for Chennai (13.0° N) on the given day, as a unit vector (x east, y up, z south). */
export function sunDirection(hour: number, dayOfYear: number): { dir: THREE.Vector3; altitude: number } {
  const lat = THREE.MathUtils.degToRad(13.0);
  const decl = THREE.MathUtils.degToRad(-23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10)));
  const H = THREE.MathUtils.degToRad((hour - 12) * 15);
  const alt = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H));
  const azSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat));
  const az = azSouth + Math.PI; // clockwise from north
  const dir = new THREE.Vector3(Math.cos(alt) * Math.sin(az), Math.sin(alt), -Math.cos(alt) * Math.cos(az));
  return { dir: dir.normalize(), altitude: THREE.MathUtils.radToDeg(alt) };
}

interface Key {
  alt: number;
  top: number;
  horizon: number;
  sun: number;
  sunI: number;
  hemiSky: number;
  hemiGround: number;
  hemiI: number;
  exposure: number;
}

/* Colour keys by sun altitude in degrees. */
const KEYS: Key[] = [
  { alt: -18, top: 0x070c1c, horizon: 0x18223e, sun: 0xa9bcff, sunI: 0.45, hemiSky: 0x5668a3, hemiGround: 0x232a3c, hemiI: 0.75, exposure: 1.18 },
  { alt: -8, top: 0x111a38, horizon: 0x2f3557, sun: 0xa9bcff, sunI: 0.45, hemiSky: 0x6070a8, hemiGround: 0x2a3042, hemiI: 0.78, exposure: 1.15 },
  { alt: -2, top: 0x2c3a6b, horizon: 0xd98a6a, sun: 0xff9a5c, sunI: 0.45, hemiSky: 0x9a8fb8, hemiGround: 0x4a4538, hemiI: 0.75, exposure: 1.0 },
  { alt: 4, top: 0x5d7fb5, horizon: 0xf2ad74, sun: 0xffa762, sunI: 1.5, hemiSky: 0xd6c3b4, hemiGround: 0x6a6448, hemiI: 0.95, exposure: 0.95 },
  { alt: 14, top: 0x6f9fd0, horizon: 0xe9dcc8, sun: 0xffe2b8, sunI: 2.4, hemiSky: 0xdbe6ef, hemiGround: 0x7d7a58, hemiI: 1.05, exposure: 0.92 },
  { alt: 35, top: 0x5f9ad2, horizon: 0xd8e6ee, sun: 0xfff6e6, sunI: 2.9, hemiSky: 0xe4eef5, hemiGround: 0x82805c, hemiI: 1.1, exposure: 0.9 },
  { alt: 90, top: 0x5592cd, horizon: 0xd3e3ec, sun: 0xffffff, sunI: 3.1, hemiSky: 0xe8f1f7, hemiGround: 0x86845f, hemiI: 1.12, exposure: 0.88 },
];

function lerpKey(alt: number): { k: Key; t: number; a: Key; b: Key } {
  let i = 0;
  while (i < KEYS.length - 2 && alt > KEYS[i + 1].alt) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = THREE.MathUtils.clamp((alt - a.alt) / (b.alt - a.alt), 0, 1);
  return { k: a, t, a, b };
}

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();
function mix(a: number, b: number, t: number, out: THREE.Color): THREE.Color {
  tmpA.setHex(a);
  tmpB.setHex(b);
  return out.copy(tmpA).lerp(tmpB, t);
}

export class SkyEnv {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly dome: THREE.Mesh;
  readonly stars: THREE.Points;
  readonly fog: THREE.Fog;
  /** 0 by day, 1 at full night. */
  nightF = 0;
  sunAltitude = 45;
  readonly sunDir = new THREE.Vector3(0, 1, 0);
  readonly lightDir = new THREE.Vector3(0, 1, 0);
  exposure = 0.9;
  private uniforms: Record<string, THREE.IUniform>;
  private dayOfYear: number;

  constructor(scene: THREE.Scene) {
    const now = new Date();
    this.dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x777755, 1);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.6;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.uniforms = {
      topColor: { value: new THREE.Color() },
      horizonColor: { value: new THREE.Color() },
      sunColor: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      sunVis: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 sunColor; uniform vec3 sunDir; uniform float sunVis;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 col = mix(horizonColor, topColor, pow(h, 0.55));
          if (d.y < 0.0) col = mix(horizonColor, horizonColor * 0.82, min(-d.y * 6.0, 1.0));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          col += sunColor * (pow(s, 12.0) * 0.28 + pow(s, 600.0) * 2.4) * sunVis;
          col += sunColor * pow(1.0 - h, 6.0) * pow(s, 3.0) * 0.25 * sunVis;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mat);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -10;
    scene.add(this.dome);

    // stars for the night sky
    const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
    const pts: number[] = [];
    for (let i = 0; i < 900; i++) {
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, y = Math.abs(u) * 0.95 + 0.05;
      const r = Math.sqrt(1 - y * y);
      pts.push(Math.cos(th) * r, y, Math.sin(th) * r);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    this.stars.frustumCulled = false;
    this.stars.renderOrder = -9;
    scene.add(this.stars);

    this.fog = new THREE.Fog(0xd3e3ec, 1200, 7000);
    scene.fog = this.fog;
  }

  setHour(hour: number): void {
    const { dir, altitude } = sunDirection(hour, this.dayOfYear);
    this.sunDir.copy(dir);
    this.sunAltitude = altitude;
    const { a, b, t } = lerpKey(altitude);
    const c = new THREE.Color();
    (this.uniforms.topColor.value as THREE.Color).copy(mix(a.top, b.top, t, c));
    const horizon = mix(a.horizon, b.horizon, t, new THREE.Color());
    (this.uniforms.horizonColor.value as THREE.Color).copy(horizon);
    const sunCol = mix(a.sun, b.sun, t, new THREE.Color());
    (this.uniforms.sunColor.value as THREE.Color).copy(sunCol);
    (this.uniforms.sunDir.value as THREE.Vector3).copy(dir);
    this.uniforms.sunVis.value = THREE.MathUtils.smoothstep(altitude, -6, 2);

    this.nightF = 1 - THREE.MathUtils.smoothstep(altitude, -7, 3);
    // light comes from the sun by day and from a fixed high moon at night
    if (altitude > -1) this.lightDir.copy(dir).setY(Math.max(dir.y, 0.08)).normalize();
    else this.lightDir.set(-0.35, 0.82, 0.45).normalize();
    this.sun.color.copy(sunCol);
    this.sun.intensity = a.sunI + (b.sunI - a.sunI) * t;
    this.hemi.color.copy(mix(a.hemiSky, b.hemiSky, t, new THREE.Color()));
    this.hemi.groundColor.copy(mix(a.hemiGround, b.hemiGround, t, new THREE.Color()));
    this.hemi.intensity = a.hemiI + (b.hemiI - a.hemiI) * t;
    this.exposure = a.exposure + (b.exposure - a.exposure) * t;
    this.fog.color.copy(horizon);
    (this.stars.material as THREE.PointsMaterial).opacity = this.nightF * 0.85;
  }

  /** Keeps the sky centred on the camera and the shadow frustum around what the camera looks at. */
  follow(camera: THREE.PerspectiveCamera, target: THREE.Vector3, viewDist: number, minExt = 120): void {
    const r = camera.far * 0.9;
    this.dome.position.copy(camera.position);
    this.dome.scale.setScalar(r);
    this.stars.position.copy(camera.position);
    this.stars.scale.setScalar(r * 0.98);
    const ext = THREE.MathUtils.clamp(viewDist * 0.85, minExt, 1700);
    const cam = this.sun.shadow.camera;
    if (cam.right !== ext) {
      cam.left = -ext; cam.right = ext; cam.top = ext; cam.bottom = -ext;
      cam.near = 10; cam.far = ext * 4 + 1200;
      cam.updateProjectionMatrix();
    }
    // snap to shadow texels to stop shadow edges shimmering while panning
    const texel = (ext * 2) / this.sun.shadow.mapSize.x;
    const tx = Math.round(target.x / texel) * texel, tz = Math.round(target.z / texel) * texel;
    this.sun.target.position.set(tx, 0, tz);
    this.sun.position.set(tx, 0, tz).addScaledVector(this.lightDir, ext * 2 + Math.min(400, ext * 4));
    this.fog.near = 500 + viewDist * 0.7;
    this.fog.far = 3200 + viewDist * 1.6;
  }
}
