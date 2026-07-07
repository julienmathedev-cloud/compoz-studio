/**
 * @file packages/ui/src/styles/shared/typography.ts
 * @layer ui/styles/shared
 *
 * @description
 * Defines shared prose typography class tokens for rich text and content rendering.
 */

export const PROSE_BASE = [
  "text-foreground",
  "prose",
  "prose-sm",
  "max-w-none",
  "dark:prose-invert",
  "prose-strong:text-foreground",
  "prose-a:text-foreground",

  "prose-p:my-1",
  "prose-li:my-1",
  "prose-li:[&>p]:my-1",
  "prose-li:[&>p]:leading-relaxed",

  "prose-ul:list-disc",
  "prose-ol:list-decimal",
  "prose-ul:pl-6",
  "prose-ol:pl-6",

  // Custom list variants rely on TipTap list metadata.
  "[&_ul[data-list-variant=check]]:!list-none",
  "[&_ul[data-list-variant=arrow]]:!list-none",
  "[&_ul[data-list-variant=check]]:pl-0",
  "[&_ul[data-list-variant=arrow]]:pl-0",

  "[&_ul[data-list-variant=check]>li]:relative",
  "[&_ul[data-list-variant=arrow]>li]:relative",
  "[&_ul[data-list-variant=check]>li]:pl-6",
  "[&_ul[data-list-variant=arrow]>li]:pl-6",

  "[&_ul[data-list-variant=check]>li]:before:absolute",
  "[&_ul[data-list-variant=arrow]>li]:before:absolute",
  "[&_ul[data-list-variant=check]>li]:before:left-0",
  "[&_ul[data-list-variant=arrow]>li]:before:left-0",
  "[&_ul[data-list-variant=check]>li]:before:top-0",
  "[&_ul[data-list-variant=arrow]>li]:before:top-0",
  "[&_ul[data-list-variant=check]>li]:before:content-['✓']",
  "[&_ul[data-list-variant=arrow]>li]:before:content-['→']",

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
