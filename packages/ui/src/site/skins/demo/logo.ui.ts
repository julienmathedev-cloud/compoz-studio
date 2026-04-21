/**
 * @file packages/ui/src/site/skins/demo/logo.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — logo site (thème Démo).
 */

import type { SiteLogoUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoLogoUi: SiteLogoUiOverride = {
  link: "rounded-lg overflow-hidden motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
} as const;
