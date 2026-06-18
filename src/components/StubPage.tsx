"use client";

import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function StubPage({ titleVi, titleEn }: { titleVi: string; titleEn: string }) {
  const { t, locale } = useLocale();
  const title = locale === "vi" ? titleVi : titleEn;
  return (
    <section className="section pt-28">
      <Container>
        <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: title }]} />
        <div className="mt-10">
          <EmptyState title={t(ui.home.comingSoon)}>
            <p className="text-sm text-ink-2">{t(ui.home.underConstruction)}</p>
            <Button href="/" variant="ghost" size="sm">← {locale === "vi" ? "Về trang chủ" : "Back home"}</Button>
          </EmptyState>
        </div>
      </Container>
    </section>
  );
}
