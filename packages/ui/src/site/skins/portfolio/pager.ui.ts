/**
 * @file packages/ui/src/site/skins/portfolio/pager.ui.ts
 * @layer ui/site/skins/portfolio
 *
 * @description
 * Defines the portfolio skin overrides for public detail page pagination.
 */

import type { SiteDetailPagerUiOverride } from "@compoz/ui/site/site-ui.types";

export const portfolioPagerUi: SiteDetailPagerUiOverride = {
  link: "group hover:text-primary focus-visible:text-primary motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-out",

  label:
    "relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-300 after:ease-out group-hover:after:w-full group-focus-visible:after:w-full",
} as const;
