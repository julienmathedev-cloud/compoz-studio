/**
 * @file packages/ui/src/settings/theme/theme-css-vars.ts
 * @layer ui/settings/theme
 *
 * @description
 * Converts runtime theme settings into CSS custom properties for site rendering.
 *
 * @remarks
 * Shared by Studio preview, draft rendering, and public rendering; no domain logic belongs here.
 */

import { resolveThemeFontFamily } from "@compoz/ui/settings/theme/theme-font-runtime";
import type {
  PublicThemeTokensShape,
  ThemeSettingsShape,
} from "@compoz/validation/site/settings/theme/theme";

export type ThemeCssVars = Record<string, string>;

/**
 * Resolves the active token set; `system` currently falls back to light tokens.
 */
export function resolveThemeTokens(
  theme: ThemeSettingsShape,
): PublicThemeTokensShape {
  if (theme.enableDarkMode && theme.mode === "dark") {
    return theme.darkTokens;
  }

  return theme.lightTokens;
}

export function themeTokensToCssVars(
  tokens: PublicThemeTokensShape,
): ThemeCssVars {
  return {
    "--background": tokens.background,
    "--foreground": tokens.foreground,

    "--chrome": tokens.chrome,

    "--card": tokens.card,
    "--card-foreground": tokens["card-foreground"],

    "--popover": tokens.popover,
    "--popover-foreground": tokens["popover-foreground"],

    "--primary": tokens.primary,
    "--primary-foreground": tokens["primary-foreground"],

    "--secondary": tokens.secondary,
    "--secondary-foreground": tokens["secondary-foreground"],

    "--muted": tokens.muted,
    "--muted-foreground": tokens["muted-foreground"],

    "--accent": tokens.accent,
    "--accent-foreground": tokens["accent-foreground"],

    "--destructive": tokens.destructive,
    "--destructive-foreground": tokens["destructive-foreground"],

    "--border": tokens.border,
    "--input": tokens.input,
    "--ring": tokens.ring,
  };
}

/** Converts theme settings to CSS variables, including resolved body and heading fonts. */
export function themeSettingsToCssVars(
  theme: ThemeSettingsShape,
): ThemeCssVars {
  const tokens = resolveThemeTokens(theme);
  const bodyFont = resolveThemeFontFamily(theme.fontFamily);
  const headingFont = resolveThemeFontFamily(
    theme.headingFont ?? theme.fontFamily,
  );

  return {
    ...themeTokensToCssVars(tokens),
    "--website-font-body": bodyFont,
    "--website-font-heading": headingFont,
  };
}
