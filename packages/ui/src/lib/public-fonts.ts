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
}>;

/**
 * Source de vérité runtime public :
 * - clé métier
 * - URL Google Fonts à injecter dynamiquement
 */
const PUBLIC_FONTS: Readonly<Record<PublicFontKey, PublicFontConfig>> = {
  inter: {
    key: "inter",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  },

  manrope: {
    key: "manrope",
    href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
  },

  "plus-jakarta-sans": {
    key: "plus-jakarta-sans",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  },

  "dm-sans": {
    key: "dm-sans",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap",
  },

  outfit: {
    key: "outfit",
    href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",
  },

  sora: {
    key: "sora",
    href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap",
  },

  urbanist: {
    key: "urbanist",
    href: "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap",
  },

  "space-grotesk": {
    key: "space-grotesk",
    href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  },

  "playfair-display": {
    key: "playfair-display",
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&display=swap",
  },

  "cormorant-garamond": {
    key: "cormorant-garamond",
    href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap",
  },

  lora: {
    key: "lora",
    href: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
  },

  merriweather: {
    key: "merriweather",
    href: "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap",
  },

  "source-serif-4": {
    key: "source-serif-4",
    href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600;700&display=swap",
  },

  "libre-baskerville": {
    key: "libre-baskerville",
    href: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap",
  },

  "bebas-neue": {
    key: "bebas-neue",
    href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
  },

  "abril-fatface": {
    key: "abril-fatface",
    href: "https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap",
  },

  oswald: {
    key: "oswald",
    href: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap",
  },

  pacifico: {
    key: "pacifico",
    href: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap",
  },

  caveat: {
    key: "caveat",
    href: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap",
  },

  "fjalla-one": {
    key: "fjalla-one",
    href: "https://fonts.googleapis.com/css2?family=Fjalla+One&display=swap",
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
