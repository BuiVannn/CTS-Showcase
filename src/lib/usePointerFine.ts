"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(cb: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}
function getServerSnapshot(): boolean {
  return false;
}

/** True only on devices with a fine, hovering pointer (mouse/trackpad). */
export function usePointerFine(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
