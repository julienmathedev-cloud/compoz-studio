"use client";

/**
 * @file apps/studio/src/features/theme/AdminThemeProvider.tsx
 * @layer ui/theme
 *
 * @description
 * Provider de thème pour l’admin (light/dark) — scope `.admin-theme`.
 *
 * @remarks
 * - Persiste le thème dans `localStorage`.
 * - Applique/retire la classe `dark` sur le wrapper `.admin-theme`.
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

type AdminTheme = "light" | "dark";

type AdminThemeProviderProps = Readonly<{
  children: ReactNode;
}>;

type AdminThemeContextValue = Readonly<{
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggle: () => void;
}>;

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

const STORAGE_KEY = "compoz.admin.theme";

function applyThemeToAdminRoot(theme: AdminTheme) {
  const root = document.querySelector<HTMLElement>(".admin-theme");
  if (!root) return;

  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function readInitialTheme(): AdminTheme {
  // Ce fichier est "use client", mais on garde un guard ultra safe.
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(STORAGE_KEY) as AdminTheme | null;
  return stored === "light" ? "light" : "dark";
}

export function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  // ✅ Init sans effet → pas de warning React.
  const [theme, setThemeState] = useState<AdminTheme>(() => readInitialTheme());

  // ✅ L’effet ne fait que synchroniser les “external systems” (DOM + storage)
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    applyThemeToAdminRoot(theme);
  }, [theme]);

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<AdminThemeContextValue>(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return ctx;
}
