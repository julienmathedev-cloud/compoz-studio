/**
 * @file packages/ui/src/site/skins/demo/pager.ui.ts
 * @layer ui/site/skins/demo
 *
 * @description
 * Defines the demo skin overrides for public site detail page pagination.
 */

import type { SiteDetailPagerUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoPagerUi: SiteDetailPagerUiOverride = {
  wrapper:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
} as const;
