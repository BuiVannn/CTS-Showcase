"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import ViewerChrome from "@/components/viewer/ViewerChrome";
import ViewerEntry from "@/components/viewer/ViewerEntry";
import { CAMPUS_MODE, parseViewerMessage, type ViewerMode } from "@/lib/vr-viewer";

/**
 * Fullscreen VR tour. Drives the krpano iframe from `mode.src` state so the
 * "Trung tâm CIE" location can swap the viewport to its standalone sub-tour
 * (the krpano app.js posts a cts-vr-load message; see vr-viewer.ts). A branded
 * entry overlay covers each load: a "hero" arrival on first open, a light
 * loader on subsequent tour swaps.
 */
export default function VRTourShell() {
  const { t } = useLocale();
  const [mode, setMode] = useState<ViewerMode>(CAMPUS_MODE);
  const [ready, setReady] = useState(false);
  const [showEntry, setShowEntry] = useState(true);
  // isFirstLoad drives the variant prop (render-safe state, not a ref).
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  // Ref mirrors isFirstLoad so the onLoad callback can read the current value
  // without a stale closure — it is never read during render.
  const isFirstLoadRef = useRef(true);

  // Swap tours when the krpano app.js asks (same-origin, validated).
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const next = parseViewerMessage(event.data, event.origin, window.location.origin);
      if (!next || next.src === mode.src) return;
      isFirstLoadRef.current = false;
      setIsFirstLoad(false);
      setMode(next);
      setReady(false);
      setShowEntry(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mode.src]);

  // onLoad: mark iframe ready; for non-first loads the loader auto-dismisses here.
  function handleLoad() {
    setReady(true);
    if (!isFirstLoadRef.current) setShowEntry(false);
  }

  const isCie = mode.area === "cie";
  const back = isCie
    ? {
        label: t(ui.vrTour.backToCampus),
        onClick: () => {
          isFirstLoadRef.current = false;
          setIsFirstLoad(false);
          setMode(CAMPUS_MODE);
          setReady(false);
          setShowEntry(true);
        },
      }
    : { label: t(ui.vrTour.backHome), href: "/" };
  const status = isCie ? t(ui.vrTour.statusCie) : t(ui.vrTour.statusCampus);

  return (
    <ViewerChrome back={back} label={t(ui.vrTour.eyebrow)} status={status}>
      <iframe
        key={mode.src}
        src={mode.src}
        title="PTIT Virtual Tour"
        onLoad={handleLoad}
        className="absolute inset-0 z-10 h-full w-full border-0"
        allow="fullscreen; autoplay; xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
      />
      {showEntry && (
        <ViewerEntry
          variant={isFirstLoad ? "hero" : "loader"}
          title={isCie ? t(ui.vrTour.statusCie) : t(ui.vrTour.entryTitle)}
          lead={t(ui.vrTour.entryLead)}
          meta={status}
          ready={ready}
          onEnter={() => setShowEntry(false)}
        />
      )}
    </ViewerChrome>
  );
}
