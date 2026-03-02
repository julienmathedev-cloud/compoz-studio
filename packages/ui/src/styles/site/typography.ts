/**
 * @file packages/ui/src/styles/site/typography.ts
 * @layer styles/public
 *
 * @description
 * Tokens typographiques PUBLIC pour le rendu “prose” (rich text + contenus).
 */

import {
  PROSE_BASE,
  PROSE_CLASSNAME,
  PROSE_HEADINGS,
} from "@compoz/ui/styles/shared/typography";

export const PUBLIC_PROSE_BASE = PROSE_BASE.join(" ");
export const PUBLIC_PROSE_HEADINGS = PROSE_HEADINGS.join(" ");
export const PUBLIC_PROSE = PROSE_CLASSNAME;
