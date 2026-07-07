import * as THREE from 'three';
import { ACT_COUNT } from './content';

// Everything in the scene is a pure function of scroll progress t ∈ [0,1],
// so scrolling up reverses the animation exactly.

export function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(v: number) {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
}

// 0→1 across [a,b]
export function ramp(t: number, a: number, b: number) {
  return smoothstep((t - a) / (b - a));
}

// Bell envelope: fades in over [a,b], holds, fades out over [c,d]
export function envelope(t: number, a: number, b: number, c: number, d: number) {
  return ramp(t, a, b) * (1 - ramp(t, c, d));
}

// Visibility envelope for act i (of ACT_COUNT scroll-equal sections).
export function actEnv(t: number, i: number) {
  const a = i / ACT_COUNT;
  const b = (i + 1) / ACT_COUNT;
  if (i === 0) return 1 - ramp(t, b - 0.03, b + 0.05);
  if (i === ACT_COUNT - 1) return ramp(t, a - 0.05, a + 0.03);
  return envelope(t, a - 0.05, a + 0.03, b - 0.03, b + 0.05);
}

// Camera keyframes, one per act (ticket at origin, facing +z).
const POSITIONS = [
  new THREE.Vector3(0, 0.1, 2.7), // hero — ticket framed right of the copy
  new THREE.Vector3(1.5, 0.55, 2.4), // problem — pulled back, ticket alone
  new THREE.Vector3(-1.35, 0.35, 2.0), // solution — orbit to the other side
  new THREE.Vector3(0.35, 0.25, -2.4), // how — travelling toward the pass
  new THREE.Vector3(2.1, 1.3, -5.2), // capabilities — above the dashboard bars
  new THREE.Vector3(0, 0.35, 3.5), // cta — full pull-back, ticket legible
];

const LOOKATS = [
  new THREE.Vector3(-0.72, 0.1, 0), // ticket right of the hero copy
  new THREE.Vector3(1.55, 0.2, 0), // ticket grazes the left edge; problem copy centre
  new THREE.Vector3(0.8, 0.1, 0), // ticket left, solution copy right
  new THREE.Vector3(0, 0.3, -4.5),
  new THREE.Vector3(0.4, 0.6, -6.5),
  new THREE.Vector3(0.9, 0.2, 0), // ticket left of the centred CTA copy
];

const FOVS = [38, 44, 42, 52, 48, 40];

const posCurve = new THREE.CatmullRomCurve3(POSITIONS, false, 'centripetal');
const lookCurve = new THREE.CatmullRomCurve3(LOOKATS, false, 'centripetal');

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

export function applyCamera(camera: THREE.PerspectiveCamera, t: number) {
  const tt = clamp01(t);
  posCurve.getPoint(tt, _pos);
  lookCurve.getPoint(tt, _look);
  const segs = FOVS.length - 1;
  const seg = Math.min(segs - 1, Math.floor(tt * segs));
  const f = tt * segs - seg;
  const fov = FOVS[seg] + (FOVS[seg + 1] - FOVS[seg]) * smoothstep(f);
  camera.position.copy(_pos);
  camera.lookAt(_look);
  if (Math.abs(camera.fov - fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}

// Print reveal: first lines print in the hero, ticket fully printed by ~0.85.
export function printProgress(t: number) {
  return clamp01(0.25 * ramp(t, 0.01, 0.11) + 0.75 * ramp(t, 0.14, 0.85));
}
