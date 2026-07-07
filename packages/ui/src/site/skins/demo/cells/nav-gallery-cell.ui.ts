/**
 * @file packages/ui/src/site/skins/demo/cells/nav-gallery-cell.ui.ts
 * @layer ui/site/skins/demo/cells
 *
 * @description
 * Defines the demo skin overrides for navigation gallery cells.
 */

import type { SiteNavGalleryUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoNavGalleryUi: SiteNavGalleryUiOverride = {
  overlayContent: "text-2xl font-bold",
} as const;
