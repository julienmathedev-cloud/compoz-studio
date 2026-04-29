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
  | "bebas-neue"
  | "abril-fatface"
  | "oswald"
  | "pacifico"
  | "caveat"
  | "fjalla-one";

type PublicFontConfig = Readonly<{
  key: PublicFontKey;
  href: string;
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
    variableName: "--font-inter",
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },

  manrope: {
    key: "manrope",
    href: "/fonts/manrope/manrope.css",
    variableName: "--font-manrope",
    fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  },

  "plus-jakarta-sans": {
    key: "plus-jakarta-sans",
    href: "/fonts/plus-jakarta-sans/plus-jakarta-sans.css",
    variableName: "--font-plus-jakarta-sans",
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  },

  "dm-sans": {
    key: "dm-sans",
    href: "/fonts/dm-sans/dm-sans.css",
    variableName: "--font-dm-sans",
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  },

  outfit: {
    key: "outfit",
    href: "/fonts/outfit/outfit.css",
    variableName: "--font-outfit",
    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
  },

  sora: {
    key: "sora",
    href: "/fonts/sora/sora.css",
    variableName: "--font-sora",
    fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif',
  },

  urbanist: {
    key: "urbanist",
    href: "/fonts/urbanist/urbanist.css",
    variableName: "--font-urbanist",
    fontFamily: '"Urbanist", ui-sans-serif, system-ui, sans-serif',
  },

  "space-grotesk": {
    key: "space-grotesk",
    href: "/fonts/space-grotesk/space-grotesk.css",
    variableName: "--font-space-grotesk",
    fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  },

  "playfair-display": {
    key: "playfair-display",
    href: "/fonts/playfair-display/playfair-display.css",
    variableName: "--font-playfair-display",
    fontFamily: '"Playfair Display", ui-serif, Georgia, serif',
  },

  "cormorant-garamond": {
    key: "cormorant-garamond",
    href: "/fonts/cormorant-garamond/cormorant-garamond.css",
    variableName: "--font-cormorant-garamond",
    fontFamily: '"Cormorant Garamond", ui-serif, Georgia, serif',
  },

  lora: {
    key: "lora",
    href: "/fonts/lora/lora.css",
    variableName: "--font-lora",
    fontFamily: '"Lora", ui-serif, Georgia, serif',
  },

  merriweather: {
    key: "merriweather",
    href: "/fonts/merriweather/merriweather.css",
    variableName: "--font-merriweather",
    fontFamily: '"Merriweather", ui-serif, Georgia, serif',
  },

  "source-serif-4": {
    key: "source-serif-4",
    href: "/fonts/source-serif-4/source-serif-4.css",
    variableName: "--font-source-serif-4",
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  },

  "libre-baskerville": {
    key: "libre-baskerville",
    href: "/fonts/libre-baskerville/libre-baskerville.css",
    variableName: "--font-libre-baskerville",
    fontFamily: '"Libre Baskerville", ui-serif, Georgia, serif',
  },

  "bebas-neue": {
    key: "bebas-neue",
    href: "/fonts/bebas-neue/bebas-neue.css",
    variableName: "--font-bebas-neue",
    fontFamily: '"Bebas Neue", Impact, sans-serif',
  },

  "abril-fatface": {
    key: "abril-fatface",
    href: "/fonts/abril-fatface/abril-fatface.css",
    variableName: "--font-abril-fatface",
    fontFamily: '"Abril Fatface", Georgia, serif',
  },

  oswald: {
    key: "oswald",
    href: "/fonts/oswald/oswald.css",
    variableName: "--font-oswald",
    fontFamily: '"Oswald", ui-sans-serif, system-ui, sans-serif',
  },

  pacifico: {
    key: "pacifico",
    href: "/fonts/pacifico/pacifico.css",
    variableName: "--font-pacifico",
    fontFamily: '"Pacifico", cursive',
  },

  caveat: {
    key: "caveat",
    href: "/fonts/caveat/caveat.css",
    variableName: "--font-caveat",
    fontFamily: '"Caveat", cursive',
  },

  "fjalla-one": {
    key: "fjalla-one",
    href: "/fonts/fjalla-one/fjalla-one.css",
    variableName: "--font-fjalla-one",
    fontFamily: '"Fjalla One", ui-sans-serif, system-ui, sans-serif',
  },
};

function isPublicFontKey(value: string): value is PublicFontKey {
  return value in PUBLIC_FONTS;
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
