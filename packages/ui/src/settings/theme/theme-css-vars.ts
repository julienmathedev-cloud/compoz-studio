/**
 * @file packages/ui/src/settings/theme/theme-css-vars.ts
 * @layer ui/runtime/theme
 *
 * @description
 * Helpers runtime pour transformer les `ThemeSettingsShape`
 * en variables CSS utilisables par le renderer du site.
 *
 * @remarks
 * - Utilisé par :
 *   - preview studio
 *   - site draft
 *   - site public
 * - Strictement runtime UI : aucune logique métier.
 */

import type { CSSProperties } from "react";

import type {
  PublicThemeTokensShape,
  ThemeSettingsShape,
} from "@compoz/validation/site/settings/theme/theme";

/**
 * Objet contenant des CSS custom properties.
 */
export type ThemeCssVars = Record<string, string>;

/* -------------------------------------------------------------------------- */
/* Token resolution                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Résout les tokens actifs (light / dark).
 *
 * @remarks
 * - `mode = light` → lightTokens
 * - `mode = dark` → darkTokens (si dark mode activé)
 * - `mode = system` → fallback light (support system plus tard)
 */
export function resolveThemeTokens(
  theme: ThemeSettingsShape,
): PublicThemeTokensShape {
  if (theme.enableDarkMode && theme.mode === "dark") {
    return theme.darkTokens;
  }

  return theme.lightTokens;
}

/* -------------------------------------------------------------------------- */
/* Tokens → CSS variables                                                     */
/* -------------------------------------------------------------------------- */

export function themeTokensToCssVars(
  tokens: PublicThemeTokensShape,
): ThemeCssVars {
  return {
    "--background": tokens.background,
    "--foreground": tokens.foreground,

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

/* -------------------------------------------------------------------------- */
/* Theme → CSS variables                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Transforme un `ThemeSettingsShape` en CSS variables.
 */
export function themeSettingsToCssVars(
  theme: ThemeSettingsShape,
): ThemeCssVars {
  const tokens = resolveThemeTokens(theme);
  return themeTokensToCssVars(tokens);
}

/**
 * Version directement utilisable dans `style={}` React.
 */
export function themeSettingsToCssStyle(
  theme: ThemeSettingsShape,
): CSSProperties {
  return themeSettingsToCssVars(theme) as CSSProperties;
}
