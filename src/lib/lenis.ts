import Lenis from "lenis";

let instance: Lenis | null = null;

/** Get the current Lenis instance (null if not initialised). */
export function getLenis(): Lenis | null {
  return instance;
}

/** Create (or return existing) Lenis instance. */
export function createLenis(): Lenis {
  if (instance) return instance;

  instance = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 2,
    infinite: false,
  });

  return instance;
}

/** Tear down Lenis and release the reference. */
export function destroyLenis(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
