/**
 * @file packages/ui/src/styles/site/typography.ts
 * @layer ui/styles/site
 *
 * @description
 * Re-exports shared prose typography tokens for public site rendering surfaces.
 */

import {
  PROSE_BASE,
  PROSE_CLASSNAME,
} from "@compoz/ui/styles/shared/typography";

export const SITE_PROSE_BASE = PROSE_BASE.join(" ");
export const SITE_PROSE = PROSE_CLASSNAME;
