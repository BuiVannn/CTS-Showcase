/** Map a 0..1 scroll progress to an active step index in [0, count-1]. */
export function activeStepFromProgress(progress: number, count: number): number {
  if (count <= 0) return 0;
  const clamped = Math.min(0.999999, Math.max(0, progress));
  return Math.min(count - 1, Math.floor(clamped * count));
}
