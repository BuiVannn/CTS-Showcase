/**
 * Viewfinder HUD: four brand-blue corner ticks plus a thin blue→red gradient
 * accent line along the top of the viewport. Purely decorative — it sits above
 * the tour iframe but never intercepts pointer events. The single "signature"
 * element of the Immersive Viewer; everything else stays quiet.
 */
export default function ViewerFrame() {
  const corners = [
    "left-3 top-3 border-l-2 border-t-2",
    "right-3 top-3 border-r-2 border-t-2",
    "left-3 bottom-3 border-l-2 border-b-2",
    "right-3 bottom-3 border-r-2 border-b-2",
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {/* top scan-line accent */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, var(--blue), var(--red))", opacity: 0.7 }}
      />
      {/* corner ticks */}
      {corners.map((pos) => (
        <span
          key={pos}
          className={`absolute h-4 w-4 rounded-[2px] ${pos}`}
          style={{ borderColor: "var(--blue)", opacity: 0.65 }}
        />
      ))}
    </div>
  );
}
