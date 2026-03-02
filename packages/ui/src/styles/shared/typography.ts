/**
 * @file packages/ui/src/styles/shared/typography.ts
 * @layer styles/shared
 *
 * @description
 * Tokens typographiques PUBLIC pour le rendu “prose” (rich text + contenus).
 */

export const PROSE_BASE = [
  "prose",
  "prose-sm",
  "max-w-none",
  "dark:prose-invert",

  // spacing
  "prose-p:my-1",
  "prose-li:my-1",
  "prose-li:[&>p]:my-1",
  "prose-li:[&>p]:leading-relaxed",

  // lists
  "prose-ul:list-disc",
  "prose-ol:list-decimal",
  "prose-ul:pl-6",
  "prose-ol:pl-6",

  // quote
  "prose-blockquote:border-l-4",
  "prose-blockquote:pl-4",
  "prose-blockquote:italic",
  "prose-blockquote:text-muted-foreground",
] as const;

export const PROSE_HEADINGS = [
  "prose-h1:text-4xl prose-h1:font-bold prose-h1:leading-tight prose-h1:mt-3 prose-h1:mb-2",
  "prose-h2:text-3xl prose-h2:font-bold prose-h2:leading-tight prose-h2:mt-3 prose-h2:mb-2",
  "prose-h3:text-2xl prose-h3:font-bold prose-h3:mt-3 prose-h3:mb-2",
  "prose-h4:text-xl prose-h4:font-semibold prose-h4:mt-3 prose-h4:mb-2",
  "prose-h5:text-lg prose-h5:font-semibold prose-h5:mt-3 prose-h5:mb-2",
  "prose-h6:text-base prose-h6:font-semibold prose-h6:mt-3 prose-h6:mb-2",
] as const;

export const PROSE = [...PROSE_BASE, ...PROSE_HEADINGS] as const;
export const PROSE_CLASSNAME = PROSE.join(" ");

/**
 * Styles “orphans” : quand tu rends un <PublicHeading /> hors d’un container `prose`.
 * On aligne sur les tailles/marges de PROSE_HEADINGS.
 */
export const PUBLIC_HEADING = {
  h1: ["text-4xl", "font-bold", "leading-tight", "mt-3", "mb-2"] as const,
  h2: ["text-3xl", "font-bold", "leading-tight", "mt-3", "mb-2"] as const,
  h3: ["text-2xl", "font-bold", "mt-3", "mb-2"] as const,
  h4: ["text-xl", "font-semibold", "mt-3", "mb-2"] as const,
  h5: ["text-lg", "font-semibold", "mt-3", "mb-2"] as const,
  h6: ["text-base", "font-semibold", "mt-3", "mb-2"] as const,
} as const;

export type PublicHeadingTag = keyof typeof PUBLIC_HEADING;
