"use client";

/**
 * @file apps/studio/src/features/theme/StudioThemeProvider.tsx
 * @layer ui/theme
 *
 * @description
 * Provider de thème pour le Studio (light/dark) — scope `.studio-theme`.
 *
 * @remarks
 * - Persiste le thème dans `localStorage`.
 * - Applique/retire la classe `dark` sur le wrapper `.studio-theme`.
 * - Ne modifie pas `<html>` pour éviter tout impact sur le rendu public.
 * - Compatible avec la preview en iframe.
 * - Strictement UI-only.
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

/**
 * Applique le thème sur le scope Studio (wrapper `.studio-theme`).
 *
 * @remarks
 * - On ne touche pas `<html>` : uniquement le wrapper Studio.
 * - La classe `dark` drive les variables Tailwind (darkMode="class").
 */
function applyThemeToStudioRoot(theme: StudioTheme): void {
  if (typeof document === "undefined") return;

  const root = document.querySelector<HTMLElement>(".studio-theme");
  if (!root) return;

  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

/**
 * Lit le thème initial depuis le storage.
 *
 * @remarks
 * - V0.5 : fallback par défaut en `light`.
 * - On n’active pas `system` pour l’instant.
 */
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
