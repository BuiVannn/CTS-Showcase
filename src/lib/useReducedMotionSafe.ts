"use client";

import { useSyncExternalStore } from "react";

/**
 * Hydration-safe reduced-motion. Returns false on the server (and during the
 * first client render so SSR and hydration agree), then the device's real
 * preference. Uses useSyncExternalStore to avoid the setState-in-effect
 * anti-pattern while still being reactive to media-query changes.
 *
 * Use this in components that branch structurally on reduced motion.
 */

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
