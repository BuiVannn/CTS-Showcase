import type { Metadata } from "next";
import { Unbounded, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale";
import SmoothScroll from "@/components/SmoothScroll";

// Display — distinctive rounded-geometric, includes the Vietnamese subset.
const display = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

// Body — clean, native Vietnamese coverage.
const body = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Mono — numbers, tags, code-like meta.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CTS Lab — Creative Technologies and Simulation Lab, PTIT",
  description:
    "CTS Lab at the Posts & Telecommunications Institute of Technology builds robots, immersive VR worlds, and AI learning tools that turn abstract lessons into hands-on experiences.",
  keywords: [
    "STEM",
    "PTIT",
    "CTS Lab",
    "Creative Technologies",
    "Simulation",
    "Robotics",
    "AI Education",
    "VR",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
    >
      <body className="min-h-screen bg-bg text-ink">
        <LocaleProvider>
          <SmoothScroll />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
