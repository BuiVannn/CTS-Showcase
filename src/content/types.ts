// Typed, bilingual content layer (replaces Payload CMS).
// Every user-facing string is `Localized`; brand names / proper nouns stay plain.

export type Locale = "en" | "vi";

export type Localized<T = string> = { en: T; vi: T };

export interface LocalImage {
  src: string;
  alt: Localized;
}

export type IconKey = "mic" | "paintbrush" | "film" | "music" | "graduation" | "signature" | "bluetooth";

export type EcosystemCategory =
  | "ai-voice"
  | "creative-ai"
  | "video-ai"
  | "learning-ai"
  | "connectivity";

export interface ShowcaseItem {
  id: string;
  title: string; // "Robot Clover", "VEX Robotics" — kept as-is
  category: Localized;
  description: Localized;
  image: LocalImage;
}

export interface EcosystemApp {
  id: string;
  name: string; // brand name (PTalk, …)
  slug: string;
  year: number;
  category: EcosystemCategory;
  categoryLabel: Localized;
  icon: IconKey;
  excerpt: Localized; // short — home grid
  description: Localized; // long — /products
  features: Localized<string[]>;
  tags: Localized<string[]>;
  downloadHref: string;
  image: LocalImage;
  logo?: string; // public path to a tile logo, e.g. "/img/logos/ptalk.png"; falls back to `icon`
  device?: boolean; // true → show the "order physical device" block on the detail page
}

export interface TeamMember {
  id: string;
  name: string;
  role?: Localized;
  image: LocalImage;
}

export interface Partner {
  name: string;
  url: string;
  logo?: LocalImage;
}

export interface NavLink {
  id: string; // anchor ("#showcase") or path ("/products")
  label: Localized;
}

export interface SiteConfig {
  siteName: Localized;
  siteNameShort: string; // "CTS Lab"
  hero: {
    headline: string; // "CTS LAB"
    eyebrow: Localized;
    subtitle: Localized;
    location: Localized;
  };
  mission: Localized;
  signature: string; // "CTS Lab, PTIT"
  contact: {
    email: string;
    phone: string;
    address: Localized;
  };
  social: {
    github?: string;
    facebook?: string;
    youtube?: string;
    email: string;
  };
  nav: NavLink[];
  footerDescription: Localized;
  footerTagline: Localized;
  videoUrl: string;
}
