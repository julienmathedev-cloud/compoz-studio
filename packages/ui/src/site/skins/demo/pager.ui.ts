/**
 * @file packages/ui/src/site/skins/demo/pager.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — pager site (thème Démo).
 */

import type { SiteDetailPagerUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoPagerUi: SiteDetailPagerUiOverride = {
  wrapper:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
} as const;
