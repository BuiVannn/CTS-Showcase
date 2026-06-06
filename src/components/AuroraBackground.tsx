// Fixed, GPU-cheap gradient-mesh aurora that drifts behind all content.
// Pure CSS animation (disabled under prefers-reduced-motion via globals.css).
export default function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden bg-bg"
    >
      {/* Soft wash so the page never reads as flat white */}
      <div className="absolute inset-0 bg-[var(--gradient-soft)]" />

      <div
        className="aurora-blob aurora-1"
        style={{
          top: "-10%",
          left: "-5%",
          width: "55vw",
          height: "55vw",
          background:
            "radial-gradient(circle at 30% 30%, rgba(251,90,120,0.55), transparent 65%)",
        }}
      />
      <div
        className="aurora-blob aurora-2"
        style={{
          top: "5%",
          right: "-12%",
          width: "50vw",
          height: "50vw",
          background:
            "radial-gradient(circle at 60% 40%, rgba(142,141,245,0.5), transparent 65%)",
        }}
      />
      <div
        className="aurora-blob aurora-3"
        style={{
          bottom: "-15%",
          left: "20%",
          width: "48vw",
          height: "48vw",
          background:
            "radial-gradient(circle at 50% 50%, rgba(79,210,192,0.42), transparent 65%)",
        }}
      />
      <div
        className="aurora-blob aurora-1"
        style={{
          bottom: "-5%",
          right: "10%",
          width: "38vw",
          height: "38vw",
          animationDelay: "-8s",
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,194,168,0.45), transparent 65%)",
        }}
      />

      {/* Top fade keeps text legible near the hero */}
      <div className="absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-[var(--bg)]/60 to-transparent" />
    </div>
  );
}
