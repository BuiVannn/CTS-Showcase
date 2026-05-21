"use client";

import { useEffect } from "react";

/**
 * Suppresses the THREE.Clock deprecation warning emitted by @react-three/fiber internals.
 * R3F v9 still creates a THREE.Clock internally, which Three.js r172+ marks as deprecated
 * in favor of THREE.Timer. This is an upstream issue — remove once R3F migrates to Timer.
 */
export default function SuppressThreeWarnings() {
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === "string") {
        if (
          args[0].includes("THREE.Clock") &&
          args[0].includes("deprecated")
        ) {
          return;
        }

        if (args[0].startsWith("Lenis: Target not found")) {
          return;
        }
      }
      originalWarn.apply(console, args);
    };
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
