/**
 * Static film-grain overlay for a tactile, premium surface. Pure CSS/SVG, no
 * runtime cost or motion — safe under reduced motion. Very low opacity so it
 * never harms legibility.
 */
export default function GrainOverlay() {
  const noise =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>`
    );
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
      style={{ backgroundImage: `url("${noise}")`, backgroundSize: "120px 120px" }}
    />
  );
}
