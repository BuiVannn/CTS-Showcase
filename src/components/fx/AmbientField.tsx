"use client";

import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

/**
 * Section-level atmosphere: a faint technical grid that brightens near the
 * cursor (via --mx/--my) plus two slow-drifting aurora blobs. Cool (blue) by
 * default; warm (red) for game/showcase areas. Pure transform/opacity motion.
 */
export default function AmbientField({ tone = "cool" }: { tone?: "cool" | "warm" }) {
  const reduce = useReducedMotionSafe();
  const a = tone === "warm" ? "var(--red-soft)" : "var(--blue-soft)";
  const b = tone === "warm" ? "var(--blue-soft)" : "var(--red-soft)";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* base grid */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
        }}
      />
      {/* aurora blobs */}
      <div
        className="absolute -top-24 right-[6%] h-72 w-72 rounded-full blur-[90px]"
        style={{ background: a, animation: reduce ? undefined : "aurora-drift 18s ease-in-out infinite" }}
      />
      <div
        className="absolute top-52 -left-12 h-64 w-64 rounded-full blur-[100px]"
        style={{ background: b, animation: reduce ? undefined : "aurora-drift 22s ease-in-out infinite reverse" }}
      />
    </div>
  );
}
