import { ecosystem } from "./ecosystem";
import type { EcosystemApp } from "./types";

/** Repository seam: today reads the static `ecosystem` array; swap to an API/DB
 *  later without touching consumers. */
export function getProducts(): EcosystemApp[] {
  return ecosystem;
}

export function getProduct(slug: string): EcosystemApp | undefined {
  return ecosystem.find((p) => p.slug === slug);
}

// Apps listed on the /download page, in curated order. Excludes core/device
// products that aren't downloadable apps (PTalk is a core product + physical
// device, so it stays in Products but not on the download page).
const DOWNLOAD_APP_SLUGS = ["unilearn", "viet-creative", "kidmentor", "ptalk-signature", "p-connect"];

export function getDownloadApps(): EcosystemApp[] {
  return DOWNLOAD_APP_SLUGS
    .map((slug) => getProduct(slug))
    .filter((a): a is EcosystemApp => a !== undefined);
}
