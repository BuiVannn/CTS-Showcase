import type { Metadata } from "next";
import VRTourShell from "@/components/VRTourShell";

export const metadata: Metadata = {
  title: "CTS Lab — PTIT Virtual Tour",
  description:
    "Explore the PTIT campus in 360° virtual reality. Walk through buildings, labs, the library, and more.",
};

export default function VRTourPage() {
  return (
    <div className="fixed inset-0 z-50 bg-bg">
      <VRTourShell />
      <iframe
        src="/vr-tour/tour.html"
        title="PTIT Virtual Tour"
        className="absolute inset-0 z-10 h-full w-full border-0"
        allow="fullscreen; autoplay; xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
      />
    </div>
  );
}
