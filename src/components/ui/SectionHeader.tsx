import Link from "next/link";

export default function SectionHeader({
  eyebrow,
  title,
  cta,
}: {
  eyebrow: string;
  title: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="text-section mt-2 text-ink">{title}</h2>
      </div>
      {cta && (
        <Link href={cta.href} className="shrink-0 text-sm font-semibold text-blue hover:underline">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
