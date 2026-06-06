"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Center,
  Bounds,
  Html,
  useProgress,
} from "@react-three/drei";
import { useReducedMotion } from "motion/react";

const MODEL = "/model/robot.glb";
const DRACO = "/draco/"; // locally hosted decoder — no CDN dependency

useGLTF.preload(MODEL, DRACO);

function Robot() {
  const { scene } = useGLTF(MODEL, DRACO);
  return <primitive object={scene} />;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--coral)]" />
        <span className="text-xs font-medium text-muted">
          {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

export default function RobotViewer() {
  const reduce = useReducedMotion();

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
    >
      {/* Soft studio lighting with brand-tinted rim lights */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      <pointLight position={[-3, 1, 3]} intensity={30} color="#fb5a78" distance={14} />
      <pointLight position={[3, -1, -3]} intensity={30} color="#8e8df5" distance={14} />

      <Suspense fallback={<Loader />}>
        {/* `fit` frames the model once on mount (after it loads, since Suspense
            wraps this). No `observe` — so manual orbit/zoom is never re-fitted.
            margin: higher = more zoomed out. */}
        <Bounds fit clip margin={1}>
          <Center>
            <Robot />
          </Center>
        </Bounds>
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        autoRotate={!reduce}
        autoRotateSpeed={1.1}
        enableDamping
        dampingFactor={0.08}
        zoomSpeed={0.8}
      />
    </Canvas>
  );
}
