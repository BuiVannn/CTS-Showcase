import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CTS Lab - PTIT Virtual Tour",
  description:
    "Explore PTIT campus in 360° virtual reality. Walk through buildings, labs, library, and more.",
};

export default function VRTourPage() {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)]">
      {/* Bright on-brand loading shell — hidden once the tour iframe paints */}
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="accent-line-short" />
        <span className="text-label">PTIT Virtual Tour</span>
        <p className="text-sm text-[var(--text-muted)]">
          Loading the 360° campus experience…
        </p>
      </div>
      <iframe
        src="/vr-tour/tour.html"
        title="PTIT Virtual Tour"
        className="absolute inset-0 z-10 w-full h-full border-0"
        allow="fullscreen; autoplay; xr-spatial-tracking"
        allowFullScreen
      />
    </div>
  );
}
