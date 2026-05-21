import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductsAnimations from "@/components/ProductsAnimations";
import {
  Shield,
  Smartphone,
  Heart,
  Bot,
  ArrowRight,
  Check,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Products — CTS Lab",
  description:
    "Explore our unified ecosystem of apps. One account, single sign-on — access Kid Mentor, Elder Care, P-Assistant, and more.",
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
    id: "kid-mentor",
    name: "Kid Mentor",
    slug: "kid-mentor",
    description:
      "AI-powered learning companion for children. Personalized lessons, progress tracking, and safe content curation.",
    features: [
      "Adaptive learning paths powered by AI",
      "Progress dashboard for parents & teachers",
      "Safe, curated content library",
    ],
    icon: <Smartphone size={28} />,
    color: "#dc2626",
    downloadHref: "#",
  },
  {
    id: "elder-care",
    name: "Elder Care",
    slug: "elder-care",
    description:
      "Smart health monitoring and companion app for elderly family members. Medication reminders, activity tracking, and emergency alerts.",
    features: [
      "Medication & appointment reminders",
      "Real-time health monitoring & alerts",
      "Family-connected emergency system",
    ],
    icon: <Heart size={28} />,
    color: "#ef4444",
    downloadHref: "#",
  },
  {
    id: "p-assistant",
    name: "P-Assistant",
    slug: "p-assistant",
    description:
      "Your personal AI assistant for daily tasks, scheduling, and smart home integration. One account, infinite possibilities.",
    features: [
      "Natural language task management",
      "Calendar & smart home integration",
      "Cross-app data sync via SSO",
    ],
    icon: <Bot size={28} />,
    color: "#b91c1c",
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
              <h1 className="text-section font-[family-name:var(--font-space-grotesk)] text-[#111111] mb-6">
                PRODUCTS
              </h1>
              <p className="text-lg text-zinc-500 max-w-2xl leading-relaxed">
                Explore our unified ecosystem of applications. Sign in once with
                your CTS account and access every app seamlessly.
              </p>
            </div>
          </section>

          {/* ── Ecosystem Banner ── */}
          <section className="pb-16 lg:pb-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="ecosystem-banner relative overflow-hidden rounded-sm bg-gradient-to-r from-[#111111] to-zinc-800 px-8 py-10 lg:px-16 lg:py-14">
                {/* Subtle red glow */}
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#dc2626]/20 blur-[80px]" />

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-12">
                  <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-[#dc2626]/20 rounded-sm">
                    <Shield size={28} className="text-[#dc2626]" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-semibold text-white font-[family-name:var(--font-space-grotesk)] mb-2">
                      One Account · Single Sign-On · Unified Ecosystem
                    </h2>
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
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
                <h2 className="text-2xl lg:text-3xl font-semibold text-[#111111] font-[family-name:var(--font-space-grotesk)]">
                  Download Our Apps
                </h2>
                <div className="accent-line-short mt-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {downloadApps.map((app) => (
                  <div
                    key={app.id}
                    id={app.slug}
                    className="download-card editorial-card overflow-hidden scroll-mt-24"
                  >
                    {/* Icon header */}
                    <div className="px-6 pt-6 pb-4">
                      <div
                        className="w-14 h-14 flex items-center justify-center rounded-sm mb-5"
                        style={{ backgroundColor: `${app.color}10` }}
                      >
                        <span style={{ color: app.color }}>{app.icon}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-[#111111] font-[family-name:var(--font-space-grotesk)] mb-2">
                        {app.name}
                      </h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        {app.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="px-6 pb-4">
                      <ul className="space-y-2.5">
                        {app.features.map((feat, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-sm text-zinc-600"
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
                        className="inline-flex items-center gap-2 px-6 py-3 border text-sm font-medium tracking-wider uppercase rounded-sm transition-all duration-300 w-full justify-center"
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
                <p className="text-sm text-zinc-500 mb-4">
                  Interested in our research and other projects?
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-[#dc2626] text-sm font-medium tracking-wider uppercase hover:text-[#ef4444] transition-colors"
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
