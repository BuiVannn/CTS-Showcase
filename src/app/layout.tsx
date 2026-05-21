import type { Metadata } from "next";
import { Be_Vietnam_Pro, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import SuppressThreeWarnings from "@/components/SuppressThreeWarnings";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CTS Lab — Creative Technologies and Simulation Lab, PTIT",
  description:
    "CTS Lab at the Posts & Telecommunications Institute of Technology develops cutting-edge STEM products, educational tools, and research.",
  keywords: ["STEM", "PTIT", "CTS", "Creative Technologies", "Simulation", "Innovation", "Education", "Technology"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${beVietnam.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body className="min-h-screen bg-white text-[#111111] font-[family-name:var(--font-be-vietnam)] grain-overlay">
        <SuppressThreeWarnings />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
