"use client";

/**
 * @file apps/studio/src/features/theme/StudioThemeProvider.tsx
 * @layer studio/features/theme
 *
 * @description
 * Theme provider for the Studio UI scoped to the `.studio-theme` wrapper.
 *
 * @remarks
 * - Persists the selected Studio theme in `localStorage`.
 * - Applies `dark` only on the Studio wrapper so public rendering and iframe preview remain isolated.
 * - System theme detection is intentionally not enabled yet.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type StudioTheme = "light" | "dark";

type StudioThemeProviderProps = Readonly<{
  children: ReactNode;
}>;

type StudioThemeContextValue = Readonly<{
  theme: StudioTheme;
  setTheme: (theme: StudioTheme) => void;
  toggle: () => void;
}>;

const StudioThemeContext = createContext<StudioThemeContextValue | null>(null);

const STORAGE_KEY = "compoz.studio.theme";
const DEFAULT_THEME: StudioTheme = "light";

/** Applies the Studio theme without mutating the document `<html>` element. */
function applyThemeToStudioRoot(theme: StudioTheme): void {
  if (typeof document === "undefined") return;

  const root = document.querySelector<HTMLElement>(".studio-theme");
  if (!root) return;

  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

/** Reads the stored Studio theme, falling back to light until system mode is supported. */
function readInitialTheme(): StudioTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : DEFAULT_THEME;
}

export function StudioThemeProvider({ children }: StudioThemeProviderProps) {
  const [theme, setThemeState] = useState<StudioTheme>(() =>
    readInitialTheme(),
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    applyThemeToStudioRoot(theme);
  }, [theme]);

  const setTheme = useCallback((next: StudioTheme) => {
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<StudioThemeContextValue>(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return (
    <StudioThemeContext.Provider value={value}>
      {children}
    </StudioThemeContext.Provider>
  );
}

export function useStudioTheme(): StudioThemeContextValue {
  const ctx = useContext(StudioThemeContext);

  if (!ctx) {
    throw new Error(
      "useStudioTheme must be used within <StudioThemeProvider />",
    );
  }

  return ctx;
}
