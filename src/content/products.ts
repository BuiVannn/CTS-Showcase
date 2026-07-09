import { ecosystem, vrDevices } from "./ecosystem";
import type { EcosystemApp } from "./types";

/** Repository seam: today reads the static `ecosystem` array; swap to an API/DB
 *  later without touching consumers. */
export function getProducts(): EcosystemApp[] {
  return ecosystem;
}

export function getProduct(slug: string): EcosystemApp | undefined {
  return [...ecosystem, ...vrDevices].find((p) => p.slug === slug);
}

// Downloadable apps, in curated order. Excludes core/device products that
// aren't downloadable apps (PTalk is a core product + physical device, so it
// stays in Products but has no download UI anywhere). Single source of truth
// for BOTH the /download page order AND whether a product shows download
// buttons on the grid + detail pages.
const DOWNLOAD_APP_SLUGS = ["unilearn", "viet-creative", "kidmentor", "ptalk-signature", "p-connect"];

export function getDownloadApps(): EcosystemApp[] {
  return DOWNLOAD_APP_SLUGS
    .map((slug) => getProduct(slug))
    .filter((a): a is EcosystemApp => a !== undefined);
}

/** True if the product is a downloadable app (shows download buttons); false
 *  for core/device products like PTalk. */
export function isDownloadApp(slug: string): boolean {
  return DOWNLOAD_APP_SLUGS.includes(slug);
}

/** VR-headset products for the VR Device group on /download. */
export function getVrDevices(): EcosystemApp[] {
  return vrDevices;
}
