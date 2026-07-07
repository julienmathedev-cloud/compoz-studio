/**
 * @file packages/ui/src/site/skins/demo/molecules/lightbox.ui.ts
 * @layer ui/site/skins/demo/molecules
 *
 * @description
 * Defines the demo skin overrides for the site lightbox.
 */

import type { SiteLightboxUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoLightboxUi: SiteLightboxUiOverride = {
  overlay: "backdrop-blur-md",
} as const;
