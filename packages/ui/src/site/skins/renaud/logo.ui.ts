/**
 * @file packages/ui/src/site/skins/renaud/logo.ui.ts
 * @layer ui/site/skins/renaud
 *
 * @description
 * Defines the Renaud skin overrides for the public site logo.
 */

import type { SiteLogoUiOverride } from "@compoz/ui/site/site-ui.types";

export const renaudLogoUi: SiteLogoUiOverride = {
  image: "h-12 w-auto md:h-14 lg:h-18 select-none",
} as const;
