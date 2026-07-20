/** Static-asset URLs for the krpano tours the shell can host. */
export const CAMPUS_TOUR_SRC = "/vr-tour/tour.html";
export const CIE_TOUR_SRC = "/vr-tour/vtour-cie/tour.html";
export const FPT_TOUR_SRC = "/vr-tour/vtour-fpt/tour.html";
export const VIETTEL_TOUR_SRC = "/vr-tour/vtour-viettel/tour.html";

/** Message type the krpano app.js posts to the parent shell to swap tours. */
export const VR_LOAD_MESSAGE = "cts-vr-load";

export type ViewerArea = "campus" | "cie" | "fpt" | "viettel";

export interface ViewerMode {
  src: string;
  area: ViewerArea;
}

export const CAMPUS_MODE: ViewerMode = { src: CAMPUS_TOUR_SRC, area: "campus" };
export const CIE_MODE: ViewerMode = { src: CIE_TOUR_SRC, area: "cie" };
export const FPT_MODE: ViewerMode = { src: FPT_TOUR_SRC, area: "fpt" };
export const VIETTEL_MODE: ViewerMode = { src: VIETTEL_TOUR_SRC, area: "viettel" };

/**
 * Every tour the shell is allowed to load, keyed by its static-asset URL.
 * A Map (not a plain object) so an attacker-supplied `src` such as
 * "__proto__" or "constructor" cannot match an inherited property.
 */
const MODES_BY_SRC = new Map<string, ViewerMode>([
  [CAMPUS_TOUR_SRC, CAMPUS_MODE],
  [CIE_TOUR_SRC, CIE_MODE],
  [FPT_TOUR_SRC, FPT_MODE],
  [VIETTEL_TOUR_SRC, VIETTEL_MODE],
]);

/**
 * Validate a window `message` event payload from the tour iframe. Returns the
 * ViewerMode to load, or null if the message is not a trusted, same-origin
 * cts-vr-load instruction for a known tour.
 */
export function parseViewerMessage(
  data: unknown,
  origin: string,
  expectedOrigin: string,
): ViewerMode | null {
  if (origin !== expectedOrigin) return null;
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.type !== VR_LOAD_MESSAGE) return null;
  if (typeof d.src !== "string") return null;
  return MODES_BY_SRC.get(d.src) ?? null;
}
