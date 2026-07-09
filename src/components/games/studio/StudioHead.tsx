"use client";

import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Reveal from "@/components/ui/Reveal";

type Page = "dashboard" | "new" | "edit";

export default function StudioHead({ page, titleSuffix }: { page: Page; titleSuffix?: string }) {
  const { t } = useLocale();
  const base = [
    { label: "CTS Lab", href: "/" },
    { label: t(ui.games.breadcrumb), href: "/games" },
  ];
  const crumbs =
    page === "dashboard"
      ? [...base, { label: t(ui.studio.pageTitle) }]
      : [
          ...base,
          { label: t(ui.studio.pageTitle), href: "/games/studio" },
          { label: page === "new" ? t(ui.studio.bcNew) : t(ui.studio.bcEdit) },
        ];
  const titleKey =
    page === "dashboard" ? ui.studio.pageTitle : page === "new" ? ui.studio.newTitle : ui.studio.editTitle;
  const leadKey = page === "dashboard" ? ui.studio.dashboardLead : page === "new" ? ui.studio.newLead : undefined;

  return (
    <Reveal>
      <Breadcrumb items={crumbs} />
      <span className="eyebrow eyebrow-draw mt-4 block">{t(ui.studio.pageTitle)}</span>
      <h1 className="text-section mt-2 text-ink">
        {t(titleKey)}
        {titleSuffix ? `: ${titleSuffix}` : ""}
      </h1>
      {leadKey && <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">{t(leadKey)}</p>}
    </Reveal>
  );
}
