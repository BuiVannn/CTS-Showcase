import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale";
import { ThemeProvider } from "@/lib/theme-context";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ui/ScrollProgress";
import PageTransition from "@/components/ui/PageTransition";

// Display — clean geometric sans, includes the Vietnamese subset.
const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
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
      data-theme="light"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
    >
      <body className="min-h-screen bg-bg text-ink">
        {/* No-flash theme: the 'cts-theme' key + 'light' default must match THEME_STORAGE_KEY/resolveTheme in src/lib/theme.ts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='cts-theme',s=localStorage.getItem(k);var t=(s==='dark')?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
        <ThemeProvider>
          <LocaleProvider>
            <ScrollProgress />
            <SmoothScroll />
            <PageTransition>{children}</PageTransition>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
