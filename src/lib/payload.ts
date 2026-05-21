import { getPayload } from "payload";
import config from "@payload-config";
import type { TypedLocale } from "payload";

// ----- Types (derived from Payload collections) -----

export interface ProductData {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  category: string;
  year: number;
  image?: { url: string; alt?: string; sizes?: Record<string, { url: string }> };
  tags?: { tag: string }[];
  featured?: boolean;
  order?: number;
}

export interface TeamData {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image?: { url: string; alt?: string; sizes?: Record<string, { url: string }> };
  social?: {
    linkedin?: string;
    github?: string;
    email?: string;
    website?: string;
  };
  highlight?: boolean;
  order?: number;
}

export interface PartnerData {
  name: string;
  logo?: { url: string; alt?: string };
  url?: string;
  order?: number;
}

export interface SiteSettingsData {
  siteName: string;
  siteDescription?: string;
  heroHeadline: string;
  heroSubtitle?: string;
  heroBadge?: string;
  missionStatement?: string;
  aboutDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  socialLinks?: {
    github?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    email?: string;
  };
}

// ----- API Helpers -----

export async function getProducts(locale: TypedLocale = "en"): Promise<ProductData[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products",
    locale,
    sort: "order",
    limit: 100,
  });
  return result.docs as unknown as ProductData[];
}

export async function getFeaturedProducts(locale: TypedLocale = "en"): Promise<ProductData[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products",
    locale,
    where: { featured: { equals: true } },
    sort: "order",
    limit: 20,
  });
  return result.docs as unknown as ProductData[];
}

export async function getProductBySlug(
  slug: string,
  locale: TypedLocale = "en"
): Promise<ProductData | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products",
    locale,
    where: { slug: { equals: slug } },
    limit: 1,
  });
  return (result.docs[0] as unknown as ProductData) || null;
}

export async function getTeam(locale: TypedLocale = "en"): Promise<TeamData[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "team",
    locale,
    sort: "order",
    limit: 100,
  });
  return result.docs as unknown as TeamData[];
}

export async function getSiteSettings(locale: TypedLocale = "en"): Promise<SiteSettingsData> {
  const payload = await getPayload({ config });
  const result = await payload.findGlobal({
    slug: "site-settings",
    locale,
  });
  return result as unknown as SiteSettingsData;
}

export async function getPartnersData(
  locale: TypedLocale = "en"
): Promise<{ heading: string; partnersList: PartnerData[] }> {
  const payload = await getPayload({ config });
  const result = await payload.findGlobal({
    slug: "partners",
    locale,
  });
  return result as unknown as { heading: string; partnersList: PartnerData[] };
}

export async function submitContact(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config });
    await payload.create({
      collection: "contact-submissions",
      data,
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
