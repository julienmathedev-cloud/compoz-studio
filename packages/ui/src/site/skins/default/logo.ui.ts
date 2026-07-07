/**
 * @file packages/ui/src/site/skins/default/logo.ui.ts
 * @layer ui/site/skins/default
 *
 * @description
 * Defines the default skin classes for the public site logo.
 */

import type { SiteLogoUi } from "@compoz/ui/site/site-ui.types";

export const defaultLogoUi: SiteLogoUi = {
  link: "inline-flex cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",

  image: "h-10 w-auto md:h-12 lg:h-14 select-none",

  sizes: "(max-width: 768px) 120px, 160px",
} as const;
