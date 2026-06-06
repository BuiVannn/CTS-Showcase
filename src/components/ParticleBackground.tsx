"use client";

import { useRef, useMemo, useState, useEffect, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/** SSR-safe reduced-motion read (avoids setState-in-effect). */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );
}

// Random particle field — generated outside render so it stays pure.
function generateParticleField(count: number) {
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 15;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    vel[i * 3] = (Math.random() - 0.5) * 0.002;
    vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
  }
  return { positions: pos, velocities: vel };
}

function Particles({ count = 44 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(
    () => generateParticleField(count),
    [count]
  );

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3];
      posArray[i * 3 + 1] += velocities[i * 3 + 1];
      posArray[i * 3 + 2] += velocities[i * 3 + 2];

      // Wrap around
      if (posArray[i * 3] > 7.5) posArray[i * 3] = -7.5;
      if (posArray[i * 3] < -7.5) posArray[i * 3] = 7.5;
      if (posArray[i * 3 + 1] > 7.5) posArray[i * 3 + 1] = -7.5;
      if (posArray[i * 3 + 1] < -7.5) posArray[i * 3 + 1] = 7.5;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* Tuned to read as a subtle red drift on the bright canvas */}
      <pointsMaterial
        color="#ed1c24"
        size={0.034}
        transparent
        opacity={0.16}
        sizeAttenuation
      />
    </points>
  );
}

export default function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !containerRef.current) return;
    // Pause Three.js rendering when user scrolls far past hero
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [reduced]);

  // No drifting particles when the user prefers reduced motion.
  if (reduced) return null;

  return (
    <div
      ref={containerRef}
      className="particle-container fixed inset-0 -z-20 pointer-events-none overflow-hidden"
    >
      {visible && (
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          gl={{ alpha: true, antialias: true }}
          frameloop="always"
        >
          <Particles />
        </Canvas>
      )}
    </div>
  );
}
