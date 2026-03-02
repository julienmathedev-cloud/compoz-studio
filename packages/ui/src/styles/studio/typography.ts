/**
 * @file packages/ui/src/styles/studio/typography.ts
 * @layer styles/admin
 * @description
 * Tokens typographiques pour l’admin : titres H1 → H6, variantes de texte (base, muted, error, meta),
 * et mapping utilisé par les composants <Heading /> et <Text />.
 *
 * Responsabilités :
 * - Fournir des classes Tailwind réutilisables pour tous les titres et textes de l’admin.
 * - Assurer la cohérence visuelle et hiérarchique.
 * - Exposer des mappings HEADINGS et TEXT_VARIANT_STYLES pour usage dans les composants UI.
 */

/* ---------------------------------------------------------------------------
 * TITRES (H1 → H6)
 * Styles hiérarchiques utilisés dans tout l’admin via <Heading>.
 * ------------------------------------------------------------------------- */

export const TITLE_LOGO = [
  "text-lg",
  "md:text-xl",
  "font-bold",
  "font-leading-tight",
] as const;

export const TITLE_H1 = [
  "text-2xl",
  "md:text-3xl",
  "font-semibold",
  "text-foreground",
  "tracking-tight",
] as const;

export const TITLE_H2 = [
  "text-xl",
  "md:text-2xl",
  "font-semibold",
  "text-foreground",
] as const;

export const TITLE_H3 = ["text-lg", "font-medium", "text-foreground"] as const;

export const TITLE_H4 = [
  "text-base",
  "font-medium",
  "text-foreground",
] as const;

export const TITLE_H5 = ["text-sm", "font-medium", "text-foreground"] as const;

export const TITLE_H6 = [
  "text-xs",
  "font-semibold",
  "text-foreground",
  "uppercase",
  "tracking-wide", // donne un aspect “label” très lisible en admin
] as const;

/* ---------------------------------------------------------------------------
 * MAPPING → utilisé par <Heading /> pour résoudre un tag en tokens typographiques.
 * ------------------------------------------------------------------------- */

export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export const HEADINGS: Readonly<Record<HeadingTag, readonly string[]>> = {
  h1: TITLE_H1,
  h2: TITLE_H2,
  h3: TITLE_H3,
  h4: TITLE_H4,
  h5: TITLE_H5,
  h6: TITLE_H6,
} as const;

/* ---------------------------------------------------------------------------
 * TEXTE (base, muted, error)
 * Variantes courantes utilisées dans les formulaires, hints, panneaux, etc.
 * ------------------------------------------------------------------------- */

export const TEXT_BASE = ["text-sm", "text-foreground"] as const;

export const TEXT_MUTED = ["text-sm", "text-muted-foreground"] as const;

export const TEXT_ERROR = [
  "text-sm",
  "font-medium",
  "text-destructive",
] as const;

export const TEXT_META = ["text-xs", "text-muted-foreground"] as const;

/**
 * Variantes typographiques disponibles pour le texte admin.
 * - `base`  : texte standard.
 * - `muted` : texte secondaire (descriptions, hints).
 * - `error` : texte d’erreur (validation, messages bloquants).
 */
export type TextVariant = "base" | "muted" | "error" | "meta";

/**
 * Mapping des variantes vers les tokens de typographie.
 * Utilisé par le composant <Text /> côté UI.
 */
export const TEXT_VARIANT_STYLES: Readonly<
  Record<TextVariant, readonly string[]>
> = {
  base: TEXT_BASE,
  muted: TEXT_MUTED,
  error: TEXT_ERROR,
  meta: TEXT_META,
} as const;
