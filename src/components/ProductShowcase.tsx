"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";

interface Product {
  id: string;
  title: string;
  excerpt?: string;
  category: string;
  year: number;
  image?: { url: string; alt?: string };
  tags?: { tag: string }[];
  slug?: string;
}

interface ProductShowcaseProps {
  products?: Product[];
}

const categoryColors: Record<string, string> = {
  "ai-voice": "#dc2626",
  "creative-ai": "#ef4444",
  "video-ai": "#b91c1c",
  "learning-ai": "#dc2626",
  education: "#ef4444",
  communication: "#f87171",
};

const categoryLabels: Record<string, string> = {
  "ai-voice": "AI Voice",
  "creative-ai": "Creative AI",
  "video-ai": "Video AI",
  "learning-ai": "Learning AI",
  education: "Education",
  communication: "Communication",
};

const ecosystemApps: Product[] = [
  {
    id: "1",
    title: "PTalk",
    excerpt: "AI voice assistant for curriculum-aligned speaking practice — a safe space for every student to find their voice.",
    category: "ai-voice",
    year: 2025,
    image: { url: "/img/ptalk.jpg", alt: "PTalk" },
    tags: [{ tag: "AI" }, { tag: "Voice" }, { tag: "Education" }],
    slug: "ptalk",
  },
  {
    id: "2",
    title: "VietCreative",
    excerpt: "Vietnamese lessons, personal AI tutor, and smart drawing — an all-in-one creative studio on a tablet.",
    category: "creative-ai",
    year: 2025,
    image: { url: "/img/vietCreative.jpg", alt: "VietCreative" },
    tags: [{ tag: "Creative" }, { tag: "AI Tutor" }, { tag: "Vietnamese" }],
    slug: "viet-creative",
  },
  {
    id: "3",
    title: "Vision Tale",
    excerpt: "Write scripts, design characters, arrange scenes — then watch AI render your story into an animated video.",
    category: "video-ai",
    year: 2025,
    image: { url: "/img/vietCreative.jpg", alt: "Vision Tale" },
    tags: [{ tag: "Generative AI" }, { tag: "Video" }, { tag: "Storytelling" }],
    slug: "vision-tale",
  },
  {
    id: "4",
    title: "Unilearn",
    excerpt: "Dual-module AI: step-by-step math problem-solving on one side, music theory and composition on the other.",
    category: "learning-ai",
    year: 2025,
    image: { url: "/img/unilearn.jpg", alt: "Unilearn" },
    tags: [{ tag: "Math" }, { tag: "Music" }, { tag: "AI" }],
    slug: "unilearn",
  },
];

export default function ProductShowcase({ products }: ProductShowcaseProps) {
  const data = products && products.length > 0 ? products : ecosystemApps;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const cards = sectionRef.current.querySelectorAll(".product-card");

      gsap.fromTo(
        cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            once: true,
          },
        }
      );

      // Section title
      const title = sectionRef.current.querySelector(".section-title");
      if (title) {
        gsap.from(title, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: title,
            start: "top 85%",
            once: true,
          },
        });
      }
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id="products" className="section-spacing relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="section-title mb-16">
          <span className="text-label mb-4 block">Ecosystem</span>
          <h2 className="text-section font-[family-name:var(--font-space-grotesk)] text-[#111111]">
            APP HIGHLIGHTS
          </h2>
          <div className="accent-line-short mt-4" />
        </div>

        {/* Ecosystem badge */}
        <div className="flex items-center gap-3 mb-10 px-4 py-3 bg-[#dc2626]/5 border border-[#dc2626]/10 rounded-sm max-w-fit">
          <Shield size={16} className="text-[#dc2626] flex-shrink-0" />
          <span className="text-sm text-[#111111] font-medium">
            All apps connected via{" "}
            <span className="text-[#dc2626] font-semibold">Single Sign-On</span>
          </span>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((product) => (
            <div
              key={product.id}
              className="product-card editorial-card group cursor-pointer overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                {product.image?.url ? (
                  <Image
                    src={product.image.url}
                    alt={product.image.alt || product.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover will-change-transform transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <Image
                    src="/img/Logo_PTIT_University.png"
                    alt={product.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover will-change-transform transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />
                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className="px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-white"
                    style={{ backgroundColor: categoryColors[product.category] || "#dc2626" }}
                  >
                    {categoryLabels[product.category] || product.category}
                  </span>
                </div>
                {/* Year */}
                <div className="absolute top-3 right-3">
                  <span className="text-xs text-zinc-400 font-[family-name:var(--font-space-grotesk)]">
                    {product.year}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-[#111111] font-[family-name:var(--font-space-grotesk)] mb-2 group-hover:text-[#dc2626] transition-colors duration-150">
                  {product.title}
                </h3>
                {product.excerpt && (
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {product.excerpt}
                  </p>
                )}
                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {product.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] tracking-wider uppercase text-zinc-400 border border-black/5 px-2 py-0.5"
                      >
                        {t.tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Learn More link */}
                <Link
                  href={`/products${product.slug ? `#${product.slug}` : ""}`}
                  className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium tracking-wider uppercase text-[#dc2626] hover:text-[#ef4444] transition-colors"
                >
                  Learn More
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
