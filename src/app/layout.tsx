import type { Metadata } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import SuppressThreeWarnings from "@/components/SuppressThreeWarnings";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Bricolage Grotesque is a variable font — no `weight` needed (and never
// combine `weight` with `axes`). Powers all display headings via --font-display.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CTS Lab - Creative Technologies and Simulation Lab, PTIT",
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
      className={`${beVietnam.variable} ${bricolage.variable} antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground font-[family-name:var(--font-be-vietnam)] grain-overlay">
        <SuppressThreeWarnings />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
