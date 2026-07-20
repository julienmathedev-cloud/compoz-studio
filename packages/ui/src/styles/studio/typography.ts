/**
 * @file packages/ui/src/styles/studio/typography.ts
 * @layer ui/styles/studio
 *
 * @description
 * Defines shared Studio typography class tokens for headings, text variants, and UI component mappings.
 */

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
  "tracking-wide",
] as const;

export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export const HEADINGS: Readonly<Record<HeadingTag, readonly string[]>> = {
  h1: TITLE_H1,
  h2: TITLE_H2,
  h3: TITLE_H3,
  h4: TITLE_H4,
  h5: TITLE_H5,
  h6: TITLE_H6,
} as const;

export const TEXT_BASE = ["text-sm", "text-foreground"] as const;

export const TEXT_MUTED = ["text-sm", "text-muted-foreground"] as const;

export const TEXT_ERROR = [
  "text-sm",
  "font-medium",
  "text-destructive",
] as const;

export const TEXT_META = ["text-xs", "text-muted-foreground"] as const;

export type TextVariant = "base" | "muted" | "error" | "meta";

export const TEXT_VARIANT_STYLES: Readonly<
  Record<TextVariant, readonly string[]>
> = {
  base: TEXT_BASE,
  muted: TEXT_MUTED,
  error: TEXT_ERROR,
  meta: TEXT_META,
} as const;
