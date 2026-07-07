import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { applyCamera, actEnv, envelope, printProgress, ramp } from './cameraPath';
import { createTicketTexture, TicketTexture } from './ticketTexture';
import { ACT_IDS } from './content';

export interface ProgressRef {
  t: number;
}

const CREAM = '#F1E9DC';
const WINE = '#7A2E2E';
const BRASS = '#B8863B';
const CHAR = '#2A241E';

const ASSET = (name: string) => `/landing/${name}`;

// Ribbon: the ticket unspooling toward the kitchen pass along a sagging curve.
function makeRibbonGeometry() {
  const geo = new THREE.PlaneGeometry(0.55, 5.5, 1, 80);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const s = (y + 2.75) / 5.5; // 0 at ticket bottom → 1 at the pass
    pos.setXYZ(i, x, -0.78 + 0.7 * s * s - 0.25 * Math.sin(s * Math.PI), -0.06 - s * 4.1);
  }
  geo.computeVertexNormals();
  return geo;
}

function setGroupOpacity(group: THREE.Group | null, v: number) {
  if (!group) return;
  group.visible = v > 0.001;
  group.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (mat) (mat as THREE.MeshStandardMaterial).opacity = v;
  });
}

// Dashboard bars for the Capabilities act — "a complete revenue layer".
const BAR_HEIGHTS = [0.45, 0.8, 0.6, 1.15, 0.95, 1.5, 1.25];

// The ticket travels with the story — one waypoint per act (hero excluded via
// its enter fade). It holds position through most of an act, then glides to
// the next waypoint over the act's final stretch.
const TICKET_PATH = [
  new THREE.Vector3(0, 0.1, 0), // hero (invisible)
  new THREE.Vector3(0, 0, 0), // problem — on the abandoned table
  new THREE.Vector3(0, 0, 0), // solution — printing beside the guest
  new THREE.Vector3(-1.15, 0.4, -3.6), // how — riding to the pass
  new THREE.Vector3(-1.1, 1.05, -6.05), // capabilities — floating above the ledger bars
  new THREE.Vector3(0, 0, 0), // cta — back on the table, fully printed
];

// Backdrop plate placement per act: hero/problem/solution behind the ticket,
// how behind the pass, caps/traction/cta further down the travel path.
const PLATE_POS: [number, number, number][] = [
  [0, 0.4, -12], // hero — no plate rendered; the DOM <video> shows through the transparent canvas
  [0, 0.4, -12.2],
  [0, 0.4, -12.4],
  [0, 0.6, -12.6],
  [0.4, 0.8, -12.8],
  [3.2, 0.4, -13], // cta — shifted to sit under the camera's off-centre look-at
];

// Plate sizes matched to each act's camera distance so the 16:9 media is
// never magnified far past the frustum (over-zoom = visible pixel break-up).
// CTA is oversized because its camera looks well off-plate-centre (see
// PLATE_POS[5]); the extra width keeps the frame full at wide viewports.
const PLATE_SIZE: [number, number][] = [
  [26, 14.6],
  [26, 14.6],
  [26, 14.6],
  [24, 13.5],
  [19, 10.7],
  [40, 17],
];

function Scene({ progress }: { progress: React.RefObject<ProgressRef> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  const textures = useTexture([
    ...ACT_IDS.map((id) => ASSET(`bg-${id}.webp`)),
    ASSET('brass.webp'),
    ASSET('paper.webp'),
  ]);
  const plates = textures.slice(0, ACT_IDS.length);
  const brassTex = textures[ACT_IDS.length];
  const paperTex = textures[ACT_IDS.length + 1];
  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
    });
  }, [textures]);

  // Receipt canvas texture — created once fonts + paper scan are ready.
  const [ticket, setTicket] = useState<TicketTexture | null>(null);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.src = ASSET('paper.webp');
    Promise.all([
      new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      }),
      document.fonts.load('500 19px "IBM Plex Mono"'),
      document.fonts.load('700 24px "IBM Plex Mono"'),
    ]).then(() => {
      if (alive) setTicket(createTicketTexture(img.complete && img.naturalWidth ? img : null));
    });
    return () => {
      alive = false;
    };
  }, []);

  const ribbonGeo = useMemo(makeRibbonGeometry, []);

  const plateMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const passGroup = useRef<THREE.Group>(null);
  const barsGroup = useRef<THREE.Group>(null);
  const ribbonMat = useRef<THREE.MeshStandardMaterial>(null);
  const ticketMat = useRef<THREE.MeshBasicMaterial>(null);
  const kitchenLight = useRef<THREE.PointLight>(null);
  const barsLight = useRef<THREE.PointLight>(null);
  const keyLight = useRef<THREE.DirectionalLight>(null);
  const ticketGroup = useRef<THREE.Group>(null);
  const barRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const t = progress.current.t;
    applyCamera(camera, t);
    ticket?.draw(printProgress(t));

    for (let i = 0; i < ACT_IDS.length; i++) {
      const m = plateMats.current[i];
      if (m) m.opacity = actEnv(t, i);
    }

    const envHow = actEnv(t, 3);
    const envCaps = actEnv(t, 4);

    setGroupOpacity(passGroup.current, envHow);
    setGroupOpacity(barsGroup.current, envCaps);
    if (ribbonMat.current) ribbonMat.current.opacity = 0.85 * envelope(t, 0.36, 0.46, 0.5, 0.58);

    if (kitchenLight.current) kitchenLight.current.intensity = envHow * 6;
    if (barsLight.current) barsLight.current.intensity = envCaps * 4;
    if (keyLight.current) keyLight.current.intensity = 1.1 + ramp(t, 0.86, 0.97) * 0.9;

    if (ticketGroup.current) {
      // ticket is absent over the hero video, prints into existence in scene 2,
      // and is put away again before the closing CTA scene (kept plate-free)
      const acts = TICKET_PATH.length;
      const enter = ramp(t, 1 / acts - 0.05, 1 / acts + 0.04);
      const exit = 1 - ramp(t, (acts - 1) / acts - 0.05, (acts - 1) / acts + 0.02);
      const visibility = enter * exit;
      ticketGroup.current.visible = visibility > 0.001;
      ticketGroup.current.scale.setScalar(0.55 + 0.35 * visibility);
      if (ticketMat.current) ticketMat.current.opacity = visibility * 0.92;

      // hold through most of each act, glide to the next waypoint at its tail
      const seg = Math.min(acts - 2, Math.floor(t * acts));
      const frac = t * acts - seg;
      const glide = ramp(frac, 0.62, 1);
      ticketGroup.current.position.lerpVectors(TICKET_PATH[seg], TICKET_PATH[seg + 1], glide);

      // always face the viewer, with a gentle presentation sway
      ticketGroup.current.lookAt(camera.position);
      ticketGroup.current.rotateY(0.22 * Math.sin(t * Math.PI * 2));
    }

    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      const grow = ramp(t, 4 / ACT_IDS.length - 0.03 + i * 0.012, 4 / ACT_IDS.length + 0.08 + i * 0.012);
      const h = Math.max(0.001, BAR_HEIGHTS[i] * grow);
      bar.scale.y = h;
      bar.position.y = h / 2;
    });
  });

  return (
    <>
      <ambientLight intensity={0.35} color={CREAM} />
      <directionalLight ref={keyLight} position={[2.5, 3, 4]} intensity={1.1} color={'#F5E3C4'} />
      <pointLight ref={kitchenLight} position={[0, 1.7, -4.1]} color={BRASS} intensity={0} distance={7} />
      <pointLight ref={barsLight} position={[1.6, 2.2, -6]} color={'#C99A5B'} intensity={0} distance={8} />

      {/* Higgsfield backdrop plates — one per act (hero act uses the DOM video) */}
      {ACT_IDS.map((id, i) =>
        i === 0 ? null : (
          <mesh key={id} position={PLATE_POS[i]}>
            <planeGeometry args={PLATE_SIZE[i]} />
            <meshBasicMaterial
              ref={(m) => {
                plateMats.current[i] = m;
              }}
              map={plates[i]}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        ),
      )}

      {/* The ticket — the film's protagonist */}
      <group ref={ticketGroup}>
        {/* unlit so the paper always reads cream against bright plates */}
        <mesh>
          <planeGeometry args={[1, 1.4]} />
          {ticket ? (
            <meshBasicMaterial
              key="ticket-printed"
              ref={ticketMat}
              map={ticket.texture}
              color={'#E9DCC4'}
              transparent
              side={THREE.DoubleSide}
            />
          ) : (
            <meshBasicMaterial
              key="ticket-blank"
              ref={ticketMat}
              color={'#D9C9A9'}
              transparent
              side={THREE.DoubleSide}
            />
          )}
        </mesh>
      </group>

      {/* unspooling paper trail from the table toward the pass */}
      <mesh geometry={ribbonGeo}>
        <meshStandardMaterial
          ref={ribbonMat}
          map={paperTex}
          color={'#DCCBAA'}
          roughness={0.9}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* How-it-works act — kitchen pass: rail + hanging chits */}
      <group ref={passGroup} position={[0, 0, -4.5]} visible={false}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[3.4, 0.04, 0.04]} />
          <meshStandardMaterial color={CHAR} metalness={0.7} roughness={0.35} transparent opacity={0} />
        </mesh>
        {[-1.3, -0.65, 0, 0.65, 1.3].map((x, i) => (
          <mesh key={i} position={[x, 0.9, 0]} rotation={[0, 0, (i - 2) * 0.04]}>
            <planeGeometry args={[0.38, 0.52]} />
            <meshStandardMaterial
              map={paperTex}
              color={'#DCCBAA'}
              roughness={0.9}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Capabilities act — the ticket's numbers rise as a revenue dashboard */}
      <group ref={barsGroup} position={[0, 0, -6.5]} visible={false}>
        <mesh position={[0.55, -0.02, 0]}>
          <boxGeometry args={[2.6, 0.03, 0.5]} />
          <meshStandardMaterial color={WINE} roughness={0.5} transparent opacity={0} />
        </mesh>
        {BAR_HEIGHTS.map((_, i) => (
          <mesh
            key={i}
            ref={(m) => {
              barRefs.current[i] = m;
            }}
            position={[-0.5 + i * 0.35, 0.001, 0]}
            scale={[1, 0.001, 1]}
          >
            <boxGeometry args={[0.2, 1, 0.2]} />
            <meshStandardMaterial
              map={brassTex}
              color={i % 3 === 2 ? WINE : BRASS}
              metalness={0.6}
              roughness={0.4}
              transparent
              opacity={0}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function Experience({ progress }: { progress: React.RefObject<ProgressRef> }) {
  return (
    <div className="dyn-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 38, near: 0.1, far: 60, position: [0, 0, 1.7] }}
      >
        <Suspense fallback={null}>
          <Scene progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
