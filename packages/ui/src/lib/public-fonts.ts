/**
 * @file packages/ui/src/lib/public-fonts.ts
 * @layer ui/lib
 *
 * @description
 * Fonts publiques dynamiques pour les sites générés.
 *
 * @remarks
 * - Contrairement à `next/font`, ce fichier ne bundle aucune police.
 * - Il charge uniquement la police réellement utilisée par le tenant courant.
 * - Les polices sont self-hosted via `/public/fonts/...`
 * - Compatible avec le runtime actuel basé sur `var(--font-*)`.
 * - IMPORTANT :
 *   cette whitelist doit rester alignée avec `THEME_FONTS`
 *   (packages/core/src/constants/theme/theme-fonts.ts)
 */

export type PublicFontKey =
  | "inter"
  | "manrope"
  | "plus-jakarta-sans"
  | "dm-sans"
  | "outfit"
  | "sora"
  | "urbanist"
  | "space-grotesk"
  | "playfair-display"
  | "cormorant-garamond"
  | "lora"
  | "merriweather"
  | "source-serif-4"
  | "libre-baskerville"
  | "spectral"
  | "bebas-neue"
  | "abril-fatface"
  | "oswald"
  | "pacifico"
  | "caveat"
  | "fjalla-one";

type PublicFontConfig = Readonly<{
  key: PublicFontKey;
  href: string;
  preloadHref: string;
  variableName: `--font-${string}`;
  fontFamily: string;
}>;

/**
 * Source de vérité runtime public :
 * - clé métier
 * - CSS local self-hosted
 * - variable CSS runtime
 * - stack CSS réelle
 */
const PUBLIC_FONTS: Readonly<Record<PublicFontKey, PublicFontConfig>> = {
  inter: {
    key: "inter",
    href: "/fonts/inter/inter.css",
    preloadHref: "/fonts/inter/inter-latin-wght-normal.woff2",
    variableName: "--font-inter",
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },

  manrope: {
    key: "manrope",
    href: "/fonts/manrope/manrope.css",
    preloadHref: "/fonts/manrope/manrope-latin-wght-normal.woff2",
    variableName: "--font-manrope",
    fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  },

  "plus-jakarta-sans": {
    key: "plus-jakarta-sans",
    href: "/fonts/plus-jakarta-sans/plus-jakarta-sans.css",
    preloadHref:
      "/fonts/plus-jakarta-sans/plus-jakarta-sans-latin-wght-normal.woff2",
    variableName: "--font-plus-jakarta-sans",
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  },

  "dm-sans": {
    key: "dm-sans",
    href: "/fonts/dm-sans/dm-sans.css",
    preloadHref: "/fonts/dm-sans/dm-sans-latin-wght-normal.woff2",
    variableName: "--font-dm-sans",
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  },

  outfit: {
    key: "outfit",
    href: "/fonts/outfit/outfit.css",
    preloadHref: "/fonts/outfit/outfit-latin-wght-normal.woff2",
    variableName: "--font-outfit",
    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
  },

  sora: {
    key: "sora",
    href: "/fonts/sora/sora.css",
    preloadHref: "/fonts/sora/sora-latin-wght-normal.woff2",
    variableName: "--font-sora",
    fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif',
  },

  urbanist: {
    key: "urbanist",
    href: "/fonts/urbanist/urbanist.css",
    preloadHref: "/fonts/urbanist/urbanist-latin-wght-normal.woff2",
    variableName: "--font-urbanist",
    fontFamily: '"Urbanist", ui-sans-serif, system-ui, sans-serif',
  },

  "space-grotesk": {
    key: "space-grotesk",
    href: "/fonts/space-grotesk/space-grotesk.css",
    preloadHref:
      "/fonts/space-grotesk/space-grotesk-latin-wght-normal.woff2",
    variableName: "--font-space-grotesk",
    fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  },

  "playfair-display": {
    key: "playfair-display",
    href: "/fonts/playfair-display/playfair-display.css",
    preloadHref:
      "/fonts/playfair-display/playfair-display-latin-wght-normal.woff2",
    variableName: "--font-playfair-display",
    fontFamily: '"Playfair Display", ui-serif, Georgia, serif',
  },

  "cormorant-garamond": {
    key: "cormorant-garamond",
    href: "/fonts/cormorant-garamond/cormorant-garamond.css",
    preloadHref:
      "/fonts/cormorant-garamond/cormorant-garamond-latin-wght-normal.woff2",
    variableName: "--font-cormorant-garamond",
    fontFamily: '"Cormorant Garamond", ui-serif, Georgia, serif',
  },

  lora: {
    key: "lora",
    href: "/fonts/lora/lora.css",
    preloadHref: "/fonts/lora/lora-latin-wght-normal.woff2",
    variableName: "--font-lora",
    fontFamily: '"Lora", ui-serif, Georgia, serif',
  },

  merriweather: {
    key: "merriweather",
    href: "/fonts/merriweather/merriweather.css",
    preloadHref:
      "/fonts/merriweather/merriweather-latin-wght-normal.woff2",
    variableName: "--font-merriweather",
    fontFamily: '"Merriweather", ui-serif, Georgia, serif',
  },

  "source-serif-4": {
    key: "source-serif-4",
    href: "/fonts/source-serif-4/source-serif-4.css",
    preloadHref:
      "/fonts/source-serif-4/source-serif-4-latin-wght-normal.woff2",
    variableName: "--font-source-serif-4",
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  },

  "libre-baskerville": {
    key: "libre-baskerville",
    href: "/fonts/libre-baskerville/libre-baskerville.css",
    preloadHref:
      "/fonts/libre-baskerville/libre-baskerville-latin-wght-normal.woff2",
    variableName: "--font-libre-baskerville",
    fontFamily: '"Libre Baskerville", ui-serif, Georgia, serif',
  },

  spectral: {
    key: "spectral",
    href: "/fonts/spectral/spectral.css",
    preloadHref: "/fonts/spectral/spectral-latin-500-normal.woff2",
    variableName: "--font-spectral",
    fontFamily: '"Spectral", ui-serif, Georgia, serif',
  },

  "bebas-neue": {
    key: "bebas-neue",
    href: "/fonts/bebas-neue/bebas-neue.css",
    preloadHref: "/fonts/bebas-neue/bebas-neue-v16-latin-regular.woff2",
    variableName: "--font-bebas-neue",
    fontFamily: '"Bebas Neue", Impact, sans-serif',
  },

  "abril-fatface": {
    key: "abril-fatface",
    href: "/fonts/abril-fatface/abril-fatface.css",
    preloadHref:
      "/fonts/abril-fatface/abril-fatface-v25-latin-regular.woff2",
    variableName: "--font-abril-fatface",
    fontFamily: '"Abril Fatface", Georgia, serif',
  },

  oswald: {
    key: "oswald",
    href: "/fonts/oswald/oswald.css",
    preloadHref: "/fonts/oswald/oswald-latin-wght-normal.woff2",
    variableName: "--font-oswald",
    fontFamily: '"Oswald", ui-sans-serif, system-ui, sans-serif',
  },

  pacifico: {
    key: "pacifico",
    href: "/fonts/pacifico/pacifico.css",
    preloadHref: "/fonts/pacifico/pacifico-v23-latin-regular.woff2",
    variableName: "--font-pacifico",
    fontFamily: '"Pacifico", cursive',
  },

  caveat: {
    key: "caveat",
    href: "/fonts/caveat/caveat.css",
    preloadHref: "/fonts/caveat/caveat-latin-wght-normal.woff2",
    variableName: "--font-caveat",
    fontFamily: '"Caveat", cursive',
  },

  "fjalla-one": {
    key: "fjalla-one",
    href: "/fonts/fjalla-one/fjalla-one.css",
    preloadHref: "/fonts/fjalla-one/fjalla-one-v16-latin-regular.woff2",
    variableName: "--font-fjalla-one",
    fontFamily: '"Fjalla One", ui-sans-serif, system-ui, sans-serif',
  },
};

function isPublicFontKey(value: string): value is PublicFontKey {
  return value in PUBLIC_FONTS;
}

export function resolveFontPreloadHref(
  fontId: string | null | undefined,
): string | null {
  const key = String(fontId ?? "").trim();

  return isPublicFontKey(key) ? PUBLIC_FONTS[key].preloadHref : null;
}

/**
 * Résout la config runtime d’une police publique.
 *
 * @remarks
 * Fallback sécurisé :
 * si une police inconnue arrive (ancien tenant / donnée corrompue),
 * on force Inter.
 */
export function resolvePublicFontConfig(
  fontKey: string | null | undefined,
): PublicFontConfig {
  const key = String(fontKey ?? "").trim();

  if (isPublicFontKey(key)) {
    return PUBLIC_FONTS[key];
  }

  return PUBLIC_FONTS.inter;
}

/**
 * Résout les fonts nécessaires au rendu d’un thème, dans l’ordre body puis
 * heading, sans charger deux fois la même font.
 */
export function resolvePublicThemeFonts(
  bodyFont: string | null | undefined,
  headingFont: string | null | undefined,
): readonly PublicFontConfig[] {
  const bodyConfig = resolvePublicFontConfig(bodyFont);
  const headingConfig = resolvePublicFontConfig(headingFont ?? bodyFont);

  return bodyConfig.key === headingConfig.key
    ? [bodyConfig]
    : [bodyConfig, headingConfig];
}
