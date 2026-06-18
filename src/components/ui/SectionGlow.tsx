/**
 * Decorative backdrop: a faint tech grid fading from the top plus two soft
 * brand glows. Purely presentational (no hooks) — drop it as the first child
 * of a `relative` section. Reused across detail pages for a consistent header.
 */
export default function SectionGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(100% 65% at 50% 0%, #000 20%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(100% 65% at 50% 0%, #000 20%, transparent 72%)",
        }}
      />
      <div
        className="absolute -top-24 left-[16%] h-64 w-64 rounded-full blur-[110px]"
        style={{ background: "var(--blue-soft)" }}
      />
      <div
        className="absolute top-0 right-[14%] h-56 w-56 rounded-full blur-[110px]"
        style={{ background: "var(--red-soft)" }}
      />
    </div>
  );
}
