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

// Desktop framing offsets the look-at so DOM copy has room beside the 3D
// subject; on a portrait viewport there's no room, so this blends the
// offset back toward centre as aspect narrows.
const ASPECT_WIDE = 1.15; // side-by-side desktop framing still valid
const ASPECT_NARROW = 0.75; // fully stacked mobile framing

export function portraitBlend(aspect: number): number {
  return smoothstep((ASPECT_WIDE - aspect) / (ASPECT_WIDE - ASPECT_NARROW));
}

const posCurve = new THREE.CatmullRomCurve3(POSITIONS, false, 'centripetal');
const lookCurve = new THREE.CatmullRomCurve3(LOOKATS, false, 'centripetal');

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

export function applyCamera(camera: THREE.PerspectiveCamera, t: number) {
  const tt = clamp01(t);
  posCurve.getPoint(tt, _pos);
  lookCurve.getPoint(tt, _look);
  _look.x *= 1 - portraitBlend(camera.aspect);
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

// Discrete per-act pose (for backdrop plates, which aren't continuously
// interpolated like the scroll-driven camera curve).
export function actPose(i: number, aspect: number) {
  const blend = portraitBlend(aspect);
  const look = LOOKATS[i].clone();
  look.x *= 1 - blend;
  return { pos: POSITIONS[i], look, fov: FOVS[i] };
}

const OVERSCAN = 1.04;

const _planeNormal = new THREE.Vector3(0, 0, 1);
const _quat = new THREE.Quaternion();

// Size, position + orient a backdrop plate so it exactly fills the camera
// frustum at depthZ, for the current viewport aspect — replaces hand-tuned
// PLATE_SIZE magic numbers (and the coverage-gap bug class they caused).
// Several acts look at the plate off-axis (e.g. CTA), so the plate must be
// rotated to face the camera along its view ray — otherwise the frustum
// cross-section is a skewed trapezoid, not the axis-aligned rectangle the
// size formula assumes.
export function plateTransform(i: number, aspect: number, depthZ: number) {
  const { pos, look, fov } = actPose(i, aspect);
  const dir = look.clone().sub(pos).normalize();
  const dz = Math.abs(dir.z) < 1e-4 ? 1e-4 : dir.z;
  const d = (depthZ - pos.z) / dz;
  const center = pos.clone().addScaledVector(dir, d);
  const height = 2 * d * Math.tan((fov * Math.PI) / 360) * OVERSCAN;
  const width = height * aspect * OVERSCAN;
  _quat.setFromUnitVectors(_planeNormal, dir.clone().negate());
  return {
    position: [center.x, center.y, center.z] as [number, number, number],
    size: [width, height] as [number, number],
    quaternion: [_quat.x, _quat.y, _quat.z, _quat.w] as [number, number, number, number],
  };
}
