/**
 * @file packages/ui/src/site/skins/demo/molecules/lightbox.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — lightbox site (thème Démo).
 */

import type { SiteLightboxUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoLightboxUi: SiteLightboxUiOverride = {
  overlay: "backdrop-blur-md",
} as const;
