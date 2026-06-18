"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Center,
  Bounds,
  Html,
  useProgress,
  ContactShadows,
  Environment,
  Lightformer,
  Sparkles,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useReducedMotion, type MotionValue } from "motion/react";
import * as THREE from "three";

const MODEL = "/model/robot.glb";
const DRACO = "/draco/"; // locally hosted decoder — no CDN dependency
useGLTF.preload(MODEL, DRACO);

export interface Callout {
  label: string;
  anchor: [number, number, number];
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-border border-t-red" />
        <span className="text-xs font-medium text-dim">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

function Robot({
  progress,
  reduce,
  callouts,
  activeStep,
}: {
  progress?: MotionValue<number>;
  reduce: boolean;
  callouts?: Callout[];
  activeStep?: number;
}) {
  const { scene } = useGLTF(MODEL, DRACO);
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    // Scroll-driven rotation: map progress 0..1 -> -0.5..0.5 rad, eased toward target.
    if (progress && !reduce) {
      const target = (progress.get() - 0.5) * 1.0;
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, target, 0.08);
    }
    // One-shot materialize scale-in over ~1.2s.
    if (!reduce) {
      if (start.current === null) start.current = state.clock.elapsedTime;
      const t = Math.min(1, (state.clock.elapsedTime - start.current) / 1.2);
      const e = 1 - Math.pow(1 - t, 3);
      g.scale.setScalar(0.92 + 0.08 * e);
    }
  });

  const active = typeof activeStep === "number" ? callouts?.[activeStep] : undefined;

  return (
    <group ref={group}>
      <primitive object={scene} />
      {active && (
        <Html position={active.anchor} center distanceFactor={6} zIndexRange={[20, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-[var(--radius-pill)] border border-border bg-card/95 px-3 py-1 text-[0.7rem] font-semibold text-ink shadow-[var(--shadow-md)]">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red align-middle" />
            {active.label}
          </div>
        </Html>
      )}
    </group>
  );
}

/** Thin emissive ring slowly orbiting the model — an "AR scan" motif. */
function HoloRing({ reduce }: { reduce: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current && !reduce) ref.current.rotation.z += delta * 0.25;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.4, 0, 0]}>
      <torusGeometry args={[1.7, 0.006, 16, 120]} />
      <meshBasicMaterial color="#5b8def" transparent opacity={0.5} toneMapped={false} />
    </mesh>
  );
}

export default function RobotViewer({
  progress,
  activeStep,
  callouts,
  effects = false,
}: {
  progress?: MotionValue<number>;
  activeStep?: number;
  callouts?: Callout[];
  effects?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const sparkleCount = effects ? 36 : 16;

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
    >
      {/* Soft studio lighting + brand-tinted rim lights */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      <pointLight position={[-3, 1, 3]} intensity={30} color="#f2555b" distance={14} />
      <pointLight position={[3, -1, -3]} intensity={30} color="#5b8def" distance={14} />

      <Environment environmentIntensity={0.35} resolution={256}>
        <Lightformer intensity={2} position={[3, 3, 2]} scale={4} color="#ffffff" />
        <Lightformer intensity={1.2} position={[-3, 1, 2]} scale={4} color="#dce6ff" />
      </Environment>

      <Suspense fallback={<Loader />}>
        <Bounds fit clip margin={1.1}>
          <Center>
            <Robot progress={progress} reduce={reduce} callouts={callouts} activeStep={activeStep} />
          </Center>
        </Bounds>
      </Suspense>

      <HoloRing reduce={reduce} />
      <Sparkles count={sparkleCount} scale={6} size={2} speed={reduce ? 0 : 0.3} color="#8aa6ef" opacity={0.6} />
      <ContactShadows position={[0, -1.4, 0]} opacity={0.35} scale={8} blur={2.5} far={3} />

      <OrbitControls
        makeDefault
        enablePan={false}
        autoRotate={!reduce && !progress}
        autoRotateSpeed={1.1}
        enableDamping
        dampingFactor={0.08}
        zoomSpeed={0.8}
      />

      {effects && !reduce && (
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  );
}
