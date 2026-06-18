export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "cts-theme"; // NOTE: also hardcoded in the no-flash inline script in src/app/layout.tsx — keep in sync.

/** Resolve a stored value to a concrete theme. Default light; system pref is
 *  intentionally NOT consulted here (brand decision — see design spec §4). */
export function resolveTheme(stored: string | null): Theme {
  return stored === "dark" ? "dark" : "light";
}

export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}
