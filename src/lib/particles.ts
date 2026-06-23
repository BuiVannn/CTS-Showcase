/**
 * Particle count scaled to viewport area, with a hard cap and a floor. Keeps
 * the network dense enough to read on large screens without unbounded cost on
 * huge ones, and never so sparse it disappears on small screens.
 */
export function particleCount(
  width: number,
  height: number,
  opts: { density?: number; cap?: number; min?: number } = {}
): number {
  const { density = 16000, cap = 70, min = 14 } = opts;
  const raw = Math.round((width * height) / density);
  return Math.max(min, Math.min(cap, raw));
}

/** Line opacity that fades linearly from 1 (touching) to 0 (>= maxDist). */
export function lineAlpha(dist: number, maxDist: number): number {
  if (dist >= maxDist) return 0;
  return 1 - dist / maxDist;
}
