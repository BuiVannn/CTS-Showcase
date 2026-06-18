"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { THEME_STORAGE_KEY, resolveTheme, nextTheme, type Theme } from "./theme";

const EVENT = "cts-theme-change";

function readTheme(): Theme {
  try {
    return resolveTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "light";
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

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server snapshot is "light" — matches the inline no-flash script default,
  // so no hydration mismatch.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(() => setTheme(nextTheme(readTheme())), [setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
