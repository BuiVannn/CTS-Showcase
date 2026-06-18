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
