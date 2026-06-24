import type { Metadata } from "next";
import VRTourShell from "@/components/VRTourShell";

export const metadata: Metadata = {
  title: "PTIT Virtual Tour",
  description:
    "Explore the PTIT campus in 360° virtual reality. Walk through buildings, labs, the library, and more.",
};

export default function VRTourPage() {
  return <VRTourShell />;
}
