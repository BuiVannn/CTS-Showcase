"use client";

import { Suspense, useRef, forwardRef, useImperativeHandle } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Preload the model for faster subsequent loads
useGLTF.preload("/model/robot.glb");

function Robot() {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF("/model/robot.glb");

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={gltf.scene}
        scale={35}
        position={[0, 0, 0]}
      />
    </group>
  );
}

function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.1
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#ed1c24" transparent opacity={0.3} />
    </mesh>
  );
}

/** Camera controller that exposes zoomIn/zoomOut to parent */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CameraController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={false}
      enablePan={true}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      autoRotate={false}
      dampingFactor={0.05}
      enableDamping
    />
  );
}

export interface RobotModelHandle {
  zoomIn: () => void;
  zoomOut: () => void;
}

const RobotModel = forwardRef<RobotModelHandle>(function RobotModel(_props, ref) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const controls = controlsRef.current;
      if (!controls) return;
      const camera = controls.object as THREE.PerspectiveCamera;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, 1.5);
      controls.update();
    },
    zoomOut: () => {
      const controls = controlsRef.current;
      if (!controls) return;
      const camera = controls.object as THREE.PerspectiveCamera;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, -1.5);
      controls.update();
    },
  }));

  return (
    <Canvas
      camera={{ position: [0, 1, 12], fov: 45 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      {/* Lighting — a touch less ambient for more form against the bright stage */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <directionalLight position={[-5, 3, -5]} intensity={1.6} />
      {/* <pointLight position={[-3, 2, 4]} intensity={1} color="#ed1c24" />
      <pointLight position={[3, -1, 3]} intensity={1} color="#ef4444" /> */}

      <Suspense fallback={<LoadingFallback />}>
        <Robot />
      </Suspense>

      <CameraController controlsRef={controlsRef} />
    </Canvas>
  );
});

export default RobotModel;
