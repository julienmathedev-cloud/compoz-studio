/**
 * @file packages/ui/src/styles/site/typography.ts
 * @layer styles/site
 *
 * @description
 * Tokens typographiques SITE pour le rendu “prose” (rich text + contenus).
 *
 * @remarks
 * Utilisés côté site (public) et côté studio (preview/renderer).
 */

import {
  PROSE_BASE,
  PROSE_CLASSNAME,
  PROSE_HEADINGS,
} from "@compoz/ui/styles/shared/typography";

export const SITE_PROSE_BASE = PROSE_BASE.join(" ");
export const SITE_PROSE_HEADINGS = PROSE_HEADINGS.join(" ");
export const SITE_PROSE = PROSE_CLASSNAME;
