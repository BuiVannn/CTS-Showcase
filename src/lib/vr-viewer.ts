/** Static-asset URLs for the two krpano tours the shell can host. */
export const CAMPUS_TOUR_SRC = "/vr-tour/tour.html";
export const CIE_TOUR_SRC = "/vr-tour/vtour-cie/tour.html";

/** Message type the krpano app.js posts to the parent shell to swap tours. */
export const VR_LOAD_MESSAGE = "cts-vr-load";

export type ViewerArea = "campus" | "cie";

export interface ViewerMode {
  src: string;
  area: ViewerArea;
}

export const CAMPUS_MODE: ViewerMode = { src: CAMPUS_TOUR_SRC, area: "campus" };
export const CIE_MODE: ViewerMode = { src: CIE_TOUR_SRC, area: "cie" };

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
  if (d.src === CIE_TOUR_SRC) return CIE_MODE;
  if (d.src === CAMPUS_TOUR_SRC) return CAMPUS_MODE;
  return null;
}
