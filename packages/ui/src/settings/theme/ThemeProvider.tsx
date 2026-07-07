"use client";

/**
 * @file packages/ui/src/settings/theme/ThemeProvider.tsx
 * @layer ui/settings/theme
 *
 * @description
 * Applies runtime theme CSS variables and exposes the current theme through React context.
 *
 * @remarks
 * Shared by Studio preview, draft rendering, and public rendering; visual theme application stays isolated in this DOM boundary.
 */

import type { CSSProperties, PropsWithChildren } from "react";
import { createContext, useContext, useMemo } from "react";

import { themeSettingsToCssVars } from "@compoz/ui/settings/theme/theme-css-vars";
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";

type ThemeProviderProps = PropsWithChildren<{
  theme: ThemeSettingsShape | null | undefined;
}>;

type ThemeContextValue = Readonly<{
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
