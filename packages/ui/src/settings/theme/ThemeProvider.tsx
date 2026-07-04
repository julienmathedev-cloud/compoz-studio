"use client";

/**
 * @file ui/src/settings/theme/ThemeProvider.tsx
 * @layer ui/runtime/theme
 *
 * @description
 * Provider runtime appliquant les variables CSS du thème
 * et exposant le thème courant via un contexte React.
 *
 * @remarks
 * Utilisé par :
 * - preview studio
 * - site draft
 * - site public
 *
 * Responsabilités runtime :
 * - appliquer les variables CSS
 * - appliquer la police
 * - appliquer la classe dark si nécessaire
 * - exposer `theme` via `useTheme()`
 *
 * Ce provider reste volontairement simple :
 * - application visuelle du thème via wrapper DOM
 * - exposition du thème courant via contexte dédié
 * - stabilisation des valeurs via `useMemo`
 */

import type { CSSProperties, PropsWithChildren } from "react";
import { createContext, useContext, useMemo } from "react";

import { themeSettingsToCssVars } from "@compoz/ui/settings/theme/theme-css-vars";
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";

type ThemeProviderProps = PropsWithChildren<{
  /** Settings de thème à appliquer au runtime. */
  theme: ThemeSettingsShape | null | undefined;
}>;

type ThemeContextValue = Readonly<{
  /** Thème courant normalisé. */
  theme: ThemeSettingsShape | null;
}>;

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const resolvedTheme = theme ?? null;

  const style = useMemo<CSSProperties | undefined>(() => {
    if (!resolvedTheme) {
      return undefined;
    }

    const vars = themeSettingsToCssVars(resolvedTheme);

    return {
      ...(vars as CSSProperties),
      fontFamily: "var(--website-font-body)",
    };
  }, [resolvedTheme]);

  const className = useMemo(() => {
    if (!resolvedTheme) {
      return undefined;
    }

    return resolvedTheme.enableDarkMode && resolvedTheme.mode === "dark"
      ? "dark"
      : undefined;
  }, [resolvedTheme]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedTheme,
    }),
    [resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <div data-site-theme-boundary="true" className={className} style={style}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

ThemeProvider.displayName = "ThemeProvider";

export function useTheme(): ThemeSettingsShape | null {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within <ThemeProvider />");
  }

  return context.theme;
}
