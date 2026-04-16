/**
 * @file packages/ui/src/site/skins/demo/mobile-menu.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI pour le menu mobile du site (thème Demo).
 *
 * @remarks
 * - Renforce les micro-interactions du menu mobile.
 * - Repose sur le socle structurel du thème Default.
 */

import type { SiteMobileMenuUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoMobileMenuUi: SiteMobileMenuUiOverride = {
  triggerButton:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
  closeButton:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
  interactive:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
  childInteractive:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
  socialLink:
    "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97]",
};
