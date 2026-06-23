"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { sso } from "@/content/sso";
import { APP_ICONS } from "@/lib/app-icons";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

/**
 * "One account" launcher: a tile per ecosystem app (logo if provided, else the
 * app icon), linking to its detail page. Derives the app list from getProducts()
 * so it stays in sync as apps are added.
 */
export default function OneAccountApps() {
  const { t } = useLocale();
  const apps = getProducts();

  return (
    <div className="mt-5">
      <p className="text-sm leading-relaxed text-ink-2">{t(sso.lead)}</p>
      <Stagger className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {apps.map((app) => {
          const Icon = APP_ICONS[app.icon] ?? APP_ICONS.mic;
          return (
            <StaggerItem key={app.id}>
              <Link
                href={`/products/${app.slug}`}
                className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg p-3 transition-transform duration-300 hover:-translate-y-0.5 hover:border-blue"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface">
                  {app.logo ? (
                    <Image src={app.logo} alt={t(app.image.alt)} width={40} height={40} className="h-full w-full object-cover" />
                  ) : (
                    <Icon size={18} className="text-blue" aria-hidden />
                  )}
                </span>
                <span className="text-sm font-medium text-ink">{app.name}</span>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
      <p className="mt-4 text-sm font-medium text-dim">{t(sso.more)}</p>
    </div>
  );
}
