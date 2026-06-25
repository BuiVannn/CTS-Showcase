"use client";

import { Search, X } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import type { GameFilterState } from "@/lib/game-filter";

type Facets = { classifications: string[]; genres: string[]; tags: string[] };

const pill = (active: boolean) =>
  `rounded-[var(--radius-pill)] border px-3 py-1 text-xs capitalize transition-colors ${
    active ? "border-blue bg-blue text-white" : "border-border text-ink-2 hover:border-blue hover:text-blue"
  }`;

function PillGroup({ label, allLabel, options, value, onPick }: {
  label: string; allLabel: string; options: string[]; value: string | null; onPick: (v: string | null) => void;
}) {
  if (options.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-dim">{label}:</span>
      <button type="button" onClick={() => onPick(null)} className={pill(value === null)}>{allLabel}</button>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onPick(o)} className={pill(value === o)}>{o.replace(/_/g, " ")}</button>
      ))}
    </div>
  );
}

export default function GameFilters({ facets, state, onChange }: {
  facets: Facets; state: GameFilterState; onChange: (s: GameFilterState) => void;
}) {
  const { t } = useLocale();
  const allLabel = t(ui.games.allFilter);
  const hasActive = !!(state.query || state.classification || state.genre || state.tag);

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
        <input
          value={state.query}
          onChange={(e) => onChange({ ...state, query: e.target.value })}
          placeholder={t(ui.games.searchPlaceholder)}
          aria-label={t(ui.games.searchPlaceholder)}
          className="w-full rounded-[var(--radius-pill)] border border-border bg-card py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-blue"
        />
      </div>
      <PillGroup label={t(ui.games.filterClassification)} allLabel={allLabel} options={facets.classifications} value={state.classification} onPick={(v) => onChange({ ...state, classification: v })} />
      <PillGroup label={t(ui.games.filterGenre)} allLabel={allLabel} options={facets.genres} value={state.genre} onPick={(v) => onChange({ ...state, genre: v })} />
      <PillGroup label={t(ui.games.filterTag)} allLabel={allLabel} options={facets.tags} value={state.tag} onPick={(v) => onChange({ ...state, tag: v })} />
      {hasActive && (
        <button type="button" onClick={() => onChange({ query: "", classification: null, genre: null, tag: null })} className="inline-flex items-center gap-1 text-xs text-blue hover:underline">
          <X size={12} /> {t(ui.games.clearFilters)}
        </button>
      )}
    </div>
  );
}
