import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CTS Lab - PTIT Virtual Tour",
  description:
    "Explore PTIT campus in 360° virtual reality. Walk through buildings, labs, library, and more.",
};

export default function VRTourPage() {
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <iframe
        src="/vr-tour/tour.html"
        title="PTIT Virtual Tour"
        className="w-full h-full border-0"
        allow="fullscreen; autoplay; xr-spatial-tracking"
        allowFullScreen
      />
    </div>
  );
}
