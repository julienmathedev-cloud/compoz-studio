/**
 * @file packages/ui/src/settings/theme/theme-font-runtime.ts
 * @layer ui/settings/theme
 *
 * @description
 * Resolves canonical theme font ids to the CSS font-family values applied at runtime.
 *
 * @remarks
 * Font ids come from core theme constants; CSS variables are exposed by the Next apps through `next/font` at layout level.
 */

import {
  DEFAULT_THEME_FONT_ID,
  type ThemeFontId,
} from "@compoz/core/constants/theme/theme-fonts";

const THEME_FONT_CSS_VARS: Readonly<Record<ThemeFontId, string>> = {
  inter: "var(--font-inter)",
  manrope: "var(--font-manrope)",
  "plus-jakarta-sans": "var(--font-plus-jakarta-sans)",
  "dm-sans": "var(--font-dm-sans)",
  outfit: "var(--font-outfit)",
  sora: "var(--font-sora)",
  urbanist: "var(--font-urbanist)",
  "space-grotesk": "var(--font-space-grotesk)",

  "playfair-display": "var(--font-playfair-display)",
  "cormorant-garamond": "var(--font-cormorant-garamond)",
  lora: "var(--font-lora)",
  merriweather: "var(--font-merriweather)",
  "source-serif-4": "var(--font-source-serif-4)",
  "libre-baskerville": "var(--font-libre-baskerville)",
  spectral: "var(--font-spectral)",

  "bebas-neue": "var(--font-bebas-neue)",
  "abril-fatface": "var(--font-abril-fatface)",
  oswald: "var(--font-oswald)",
  pacifico: "var(--font-pacifico)",
  caveat: "var(--font-caveat)",
  "fjalla-one": "var(--font-fjalla-one)",
} as const;

/** Resolves a theme font id to a runtime CSS variable, with a defensive default fallback. */
export function resolveThemeFontFamily(
  fontId: string | null | undefined,
): string {
  const safeId =
    typeof fontId === "string" && fontId in THEME_FONT_CSS_VARS
      ? (fontId as ThemeFontId)
      : DEFAULT_THEME_FONT_ID;

  return THEME_FONT_CSS_VARS[safeId];
}
