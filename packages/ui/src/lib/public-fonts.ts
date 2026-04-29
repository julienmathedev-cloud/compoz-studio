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
 * - Il conserve la compatibilité avec le runtime actuel basé sur `var(--font-*)`.
 * - Objectif :
 *   éviter de charger 20 fonts sur tous les sites alors qu’un tenant n’en utilise qu’une.
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
 * - URL Google Fonts à injecter dynamiquement
 * - variable CSS runtime
 * - stack CSS réelle
 */
const PUBLIC_FONTS: Readonly<Record<PublicFontKey, PublicFontConfig>> = {
  inter: {
    key: "inter",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    variableName: "--font-inter",
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },

  manrope: {
    key: "manrope",
    href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
    variableName: "--font-manrope",
    fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  },

  "plus-jakarta-sans": {
    key: "plus-jakarta-sans",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    variableName: "--font-plus-jakarta-sans",
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  },

  "dm-sans": {
    key: "dm-sans",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap",
    variableName: "--font-dm-sans",
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  },

  outfit: {
    key: "outfit",
    href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",
    variableName: "--font-outfit",
    fontFamily: '"Outfit", ui-sans-serif, system-ui, sans-serif',
  },

  sora: {
    key: "sora",
    href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap",
    variableName: "--font-sora",
    fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif',
  },

  urbanist: {
    key: "urbanist",
    href: "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap",
    variableName: "--font-urbanist",
    fontFamily: '"Urbanist", ui-sans-serif, system-ui, sans-serif',
  },

  "space-grotesk": {
    key: "space-grotesk",
    href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    variableName: "--font-space-grotesk",
    fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  },

  "playfair-display": {
    key: "playfair-display",
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&display=swap",
    variableName: "--font-playfair-display",
    fontFamily: '"Playfair Display", ui-serif, Georgia, serif',
  },

  "cormorant-garamond": {
    key: "cormorant-garamond",
    href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap",
    variableName: "--font-cormorant-garamond",
    fontFamily: '"Cormorant Garamond", ui-serif, Georgia, serif',
  },

  lora: {
    key: "lora",
    href: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
    variableName: "--font-lora",
    fontFamily: '"Lora", ui-serif, Georgia, serif',
  },

  merriweather: {
    key: "merriweather",
    href: "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap",
    variableName: "--font-merriweather",
    fontFamily: '"Merriweather", ui-serif, Georgia, serif',
  },

  "source-serif-4": {
    key: "source-serif-4",
    href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600;700&display=swap",
    variableName: "--font-source-serif-4",
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  },

  "libre-baskerville": {
    key: "libre-baskerville",
    href: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap",
    variableName: "--font-libre-baskerville",
    fontFamily: '"Libre Baskerville", ui-serif, Georgia, serif',
  },

  "bebas-neue": {
    key: "bebas-neue",
    href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
    variableName: "--font-bebas-neue",
    fontFamily: '"Bebas Neue", Impact, sans-serif',
  },

  "abril-fatface": {
    key: "abril-fatface",
    href: "https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap",
    variableName: "--font-abril-fatface",
    fontFamily: '"Abril Fatface", Georgia, serif',
  },

  oswald: {
    key: "oswald",
    href: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap",
    variableName: "--font-oswald",
    fontFamily: '"Oswald", ui-sans-serif, system-ui, sans-serif',
  },

  pacifico: {
    key: "pacifico",
    href: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap",
    variableName: "--font-pacifico",
    fontFamily: '"Pacifico", cursive',
  },

  caveat: {
    key: "caveat",
    href: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap",
    variableName: "--font-caveat",
    fontFamily: '"Caveat", cursive',
  },

  "fjalla-one": {
    key: "fjalla-one",
    href: "https://fonts.googleapis.com/css2?family=Fjalla+One&display=swap",
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
