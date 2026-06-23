import CountUp from "@/components/ui/CountUp";

export interface Stat {
  value: string;
  unit?: string;
  label: string;
}

export default function StatBand({ items }: { items: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border md:grid-cols-4">
      {items.map((s, i) => (
        <div key={i} className="bg-bg p-5">
          <div className="font-mono text-3xl font-bold text-ink sm:text-4xl">
            <CountUp value={s.value} />
            {s.unit && <span className="text-blue">{s.unit}</span>}
          </div>
          <div className="mt-1 text-xs text-dim">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
