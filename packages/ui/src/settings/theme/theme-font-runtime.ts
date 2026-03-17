/**
 * @file packages/ui/src/settings/theme/theme-font-runtime.ts
 * @layer ui/runtime/theme
 *
 * @description
 * Résolution runtime des polices du thème :
 * convertit un `ThemeFontId` canonique en valeur CSS réellement appliquée.
 *
 * @remarks
 * - Source de vérité métier : `@compoz/core/constants/theme/theme-fonts`
 * - Ici : projection runtime UI uniquement.
 * - Les variables CSS (`--font-*`) sont exposées par les apps Next
 *   via `next/font` au niveau du layout.
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

  "bebas-neue": "var(--font-bebas-neue)",
  "abril-fatface": "var(--font-abril-fatface)",
  oswald: "var(--font-oswald)",
  pacifico: "var(--font-pacifico)",
  caveat: "var(--font-caveat)",
  "fjalla-one": "var(--font-fjalla-one)",
} as const;

/**
 * Résout l’id de police canonique vers la variable CSS runtime.
 *
 * @remarks
 * - Fallback défensif sur `DEFAULT_THEME_FONT_ID`.
 * - Retourne toujours une valeur exploitable dans `style.fontFamily`.
 */
export function resolveThemeFontFamily(
  fontId: string | null | undefined,
): string {
  const safeId =
    typeof fontId === "string" && fontId in THEME_FONT_CSS_VARS
      ? (fontId as ThemeFontId)
      : DEFAULT_THEME_FONT_ID;

  return THEME_FONT_CSS_VARS[safeId];
}
