import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductsAnimations from "@/components/ProductsAnimations";
import {
  Shield,
  Mic,
  Paintbrush,
  Film,
  Music,
  MessageCircle,
  ArrowRight,
  Check,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Products — CTS Lab",
  description:
    "Explore our AI-powered educational ecosystem — PTalk, VietCreative, Vision Tale, Unilearn, and more from the STEM-AI Classroom.",
};

const defaultSettings = {
  siteName: "Creative Technologies and Simulation Lab",
  contactEmail: "contact@cts.ptit.edu.vn",
  contactPhone: "+84 xxx xxx xxx",
  contactAddress: "Posts & Telecommunications Institute of Technology, Hanoi, Vietnam",
  socialLinks: {
    github: "https://github.com/cts",
    facebook: "https://facebook.com/cts",
    youtube: "https://youtube.com/@cts",
    email: "contact@cts.ptit.edu.vn",
  },
};

interface DownloadApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  downloadHref: string;
}

const downloadApps: DownloadApp[] = [
  {
    id: "ptalk",
    name: "PTalk",
    slug: "ptalk",
    description:
      "An AI voice learning assistant that listens, responds, and guides students through curriculum-aligned exercises. Speak up, get instant feedback, and build confidence — a safe space for every student to find their voice.",
    features: [
      "AI-powered speech recognition & natural language processing",
      "Curriculum-aligned content following the national textbook program",
      "Instant spoken feedback with guided follow-up questions",
    ],
    icon: <Mic size={28} />,
    color: "#ed1c24",
    downloadHref: "#",
  },
  {
    id: "viet-creative",
    name: "VietCreative",
    slug: "viet-creative",
    description:
      "An all-in-one creative studio on a tablet — Vietnamese language lessons, a personal AI tutor for instant Q&A, and an intelligent drawing tool that transforms rough sketches into polished artwork.",
    features: [
      "Vietnamese language lessons with structured exercises",
      "Personal AI tutor for 1-on-1 Q&A anytime",
      "Smart drawing canvas with AI-assisted artwork completion",
    ],
    icon: <Paintbrush size={28} />,
    color: "#ef4444",
    downloadHref: "#",
  },
  {
    id: "vision-tale",
    name: "Vision Tale",
    slug: "vision-tale",
    description:
      "An AI-powered filmmaking tool where students write scripts, design custom characters, and arrange scene-by-scene storyboards — then watch their vision rendered into a fully animated video.",
    features: [
      "Generative AI video rendering from text prompts",
      "Deep character customization & scene-by-scene control",
      "Storyboard workflow teaching narrative structure & visual logic",
    ],
    icon: <Film size={28} />,
    color: "#b91c1c",
    downloadHref: "#",
  },
  {
    id: "unilearn",
    name: "Unilearn",
    slug: "unilearn",
    description:
      "A dual-module AI platform that sharpens both hemispheres of the brain — step-by-step math problem solving with guided hints, and interactive music theory, rhythm training, and basic composition.",
    features: [
      "AI-guided math from basic to advanced with step-by-step hints",
      "Music theory, rhythm training, and basic composition module",
      "Balanced left-brain logic and right-brain creativity development",
    ],
    icon: <Music size={28} />,
    color: "#ed1c24",
    downloadHref: "#",
  },
];

export default function ProductsPage() {
  const settings = defaultSettings;

  return (
    <>
      <Navbar siteName={settings.siteName} showSectionLinks={false} />

      <ProductsAnimations>
        <main className="flex-1 relative">
          {/* ── Hero Banner ── */}
          <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 relative">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="accent-line-short mb-8" />
              <span className="text-label mb-4 block">Our Apps</span>
              <h1 className="text-section font-[family-name:var(--font-display)] text-[var(--ink)] mb-6">
                Products
              </h1>
              <p className="text-lg text-[var(--text-muted)] max-w-2xl leading-relaxed">
                Explore our unified ecosystem of applications. Sign in once with
                your CTS account and access every app seamlessly.
              </p>
            </div>
          </section>

          {/* ── Ecosystem Banner ── */}
          <section className="pb-16 lg:pb-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="ecosystem-banner relative overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-r from-[var(--red)] to-[var(--red-dark)] px-8 py-10 lg:px-16 lg:py-14 shadow-[var(--shadow-red)]">
                {/* Soft light glow */}
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/15 blur-[80px]" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-12">
                  <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-white/15 rounded-[var(--radius-md)]">
                    <Shield size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-semibold text-white font-[family-name:var(--font-display)] mb-2">
                      One Account · Single Sign-On · Unified Ecosystem
                    </h2>
                    <p className="text-sm text-white/85 leading-relaxed max-w-xl">
                      Every CTS Lab application shares a single authentication
                      system. Create your account once and enjoy seamless access
                      across all our products.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Download Cards ── */}
          <section className="pb-16 lg:pb-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="products-section-title mb-12">
                <h2 className="text-2xl lg:text-3xl font-semibold text-[var(--ink)] font-[family-name:var(--font-display)]">
                  Download Our Apps
                </h2>
                <div className="accent-line-short mt-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {downloadApps.map((app) => (
                  <div
                    key={app.id}
                    id={app.slug}
                    className="download-card surface-card overflow-hidden scroll-mt-24"
                  >
                    {/* Icon header */}
                    <div className="px-6 pt-6 pb-4">
                      <div
                        className="w-14 h-14 flex items-center justify-center rounded-[var(--radius-md)] mb-5"
                        style={{ backgroundColor: `${app.color}14` }}
                      >
                        <span style={{ color: app.color }}>{app.icon}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--ink)] font-[family-name:var(--font-display)] mb-2">
                        {app.name}
                      </h3>
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {app.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="px-6 pb-4">
                      <ul className="space-y-2.5">
                        {app.features.map((feat, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-sm text-[var(--text-muted)]"
                          >
                            <Check
                              size={14}
                              className="flex-shrink-0 mt-0.5"
                              style={{ color: app.color }}
                            />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Download button */}
                    <div className="px-6 pb-6 pt-2">
                      <a
                        href={app.downloadHref}
                        className="inline-flex items-center gap-2 px-6 py-3 border text-sm font-medium tracking-wider uppercase rounded-[var(--radius-sm)] transition-all duration-300 w-full justify-center hover:bg-[var(--red-softer)] hover:-translate-y-0.5"
                        style={{
                          borderColor: app.color,
                          color: app.color,
                        }}
                      >
                        Download
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA Footer ── */}
          <section className="products-cta pb-24 lg:pb-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="text-center">
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Interested in our research and other projects?
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-[var(--red-dark)] text-sm font-medium tracking-wider uppercase hover:text-[var(--red)] transition-colors"
                >
                  Explore our full ecosystem
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </ProductsAnimations>

      <Footer
        siteName={settings.siteName}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        contactAddress={settings.contactAddress}
        socialLinks={settings.socialLinks}
      />
    </>
  );
}
