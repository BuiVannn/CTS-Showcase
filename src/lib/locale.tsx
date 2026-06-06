"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { Locale, Localized } from "@/content/types";

const STORAGE_KEY = "cts-locale";
const EVENT = "cts-locale-change";

function readLocale(): Locale {
  try {
    return localStorage.getItem(STORAGE_KEY) === "vi" ? "vi" : "en";
  } catch {
    return "en";
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Resolve a localized value to the active locale. */
  t: <T>(value: Localized<T>) => T;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // External-store read avoids setState-in-effect AND hydration mismatch:
  // SSR + first paint use the "en" server snapshot, then the stored value
  // is applied after hydration.
  const locale = useSyncExternalStore(subscribe, readLocale, () => "en" as Locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: <T,>(v: Localized<T>): T => v[locale],
    }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
