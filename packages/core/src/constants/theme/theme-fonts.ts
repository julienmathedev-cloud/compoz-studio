/**
 * @file packages/core/src/constants/theme/theme-fonts.ts
 * @layer core/constants/theme
 * @description Supported theme fonts and selection helpers.
 */

export const THEME_FONT_CATEGORIES = ["sans", "serif", "display"] as const;

export type ThemeFontCategory = (typeof THEME_FONT_CATEGORIES)[number];

export type ThemeFontDefinition = Readonly<{
  id: string;
  label: string;
  category: ThemeFontCategory;
  description: string;
  /**
   * Value persisted in theme settings.
   * V1 stores the CSS stack directly to stay compatible with the current model.
   */
  fontFamily: string;
}>;

export const THEME_FONTS = [
  {
    id: "inter",
    label: "Inter",
    category: "sans",
    description: "Moderne · neutre",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "manrope",
    label: "Manrope",
    category: "sans",
    description: "Premium · moderne",
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    category: "sans",
    description: "Design · polyvalent",
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    category: "sans",
    description: "Lisible · équilibré",
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: "outfit",
    label: "Outfit",
    category: "sans",
    description: "Startup · tech",
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "sora",
    label: "Sora",
    category: "sans",
    description: "SaaS · impactant",
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "urbanist",
    label: "Urbanist",
    category: "sans",
    description: "Design · UX",
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    category: "sans",
    description: "Tech · affirmé",
    fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  },

  {
    id: "playfair-display",
    label: "Playfair Display",
    category: "serif",
    description: "Élégant · éditorial",
    fontFamily: '"Playfair Display", ui-serif, Georgia, serif',
  },
  {
    id: "cormorant-garamond",
    label: "Cormorant Garamond",
    category: "serif",
    description: "Artistique · luxe",
    fontFamily: '"Cormorant Garamond", ui-serif, Georgia, serif',
  },
  {
    id: "lora",
    label: "Lora",
    category: "serif",
    description: "Éditorial · moderne",
    fontFamily: "Lora, ui-serif, Georgia, serif",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    category: "serif",
    description: "Classique · lisible",
    fontFamily: "Merriweather, ui-serif, Georgia, serif",
  },
  {
    id: "source-serif-4",
    label: "Source Serif 4",
    category: "serif",
    description: "Institutionnel · sobre",
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  },
  {
    id: "libre-baskerville",
    label: "Libre Baskerville",
    category: "serif",
    description: "Traditionnel · éditorial",
    fontFamily: '"Libre Baskerville", ui-serif, Georgia, serif',
  },
  {
    id: "spectral",
    label: "Spectral",
    category: "serif",
    description: "Éditorial · raffiné",
    fontFamily: '"Spectral", ui-serif, Georgia, serif',
  },

  {
    id: "bebas-neue",
    label: "Bebas Neue",
    category: "display",
    description: "Titre · impact",
    fontFamily: '"Bebas Neue", Impact, sans-serif',
  },
  {
    id: "abril-fatface",
    label: "Abril Fatface",
    category: "display",
    description: "Display · éditorial",
    fontFamily: '"Abril Fatface", Georgia, serif',
  },
  {
    id: "oswald",
    label: "Oswald",
    category: "display",
    description: "Titre · moderne",
    fontFamily: "Oswald, ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "pacifico",
    label: "Pacifico",
    category: "display",
    description: "Lifestyle · chaleureux",
    fontFamily: "Pacifico, cursive",
  },
  {
    id: "caveat",
    label: "Caveat",
    category: "display",
    description: "Manuscrit · léger",
    fontFamily: "Caveat, cursive",
  },
  {
    id: "fjalla-one",
    label: "Fjalla One",
    category: "display",
    description: "Fort · condensé",
    fontFamily: '"Fjalla One", ui-sans-serif, system-ui, sans-serif',
  },
] as const satisfies readonly ThemeFontDefinition[];

export type ThemeFontId = (typeof THEME_FONTS)[number]["id"];

export const DEFAULT_THEME_FONT_ID: ThemeFontId = "inter";

export const THEME_FONT_CATEGORY_LABEL: Readonly<
  Record<ThemeFontCategory, string>
> = {
  sans: "Sans-serif",
  serif: "Serif",
  display: "Display / signature",
} as const;

export function getThemeFontsByCategory(category: ThemeFontCategory) {
  return THEME_FONTS.filter((font) => font.category === category);
}

export function getThemeFontById(id: string | null | undefined) {
  return THEME_FONTS.find((font) => font.id === id);
}

export function getThemeFontByFontFamily(
  fontFamily: string | null | undefined,
) {
  return THEME_FONTS.find((font) => font.fontFamily === fontFamily);
}
