/**
 * @file packages/ui/src/site/skins/demo/legal-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — menu légal site (thème Démo).
 */

import type { SiteLegalMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoLegalMenuUi: SiteLegalMenuUiOverride = {
  interactive:
    "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
} as const;
