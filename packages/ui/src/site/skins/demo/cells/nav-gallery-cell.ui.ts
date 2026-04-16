/**
 * @file packages/ui/src/site/skins/demo/cells/nav-gallery-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Override UI — nav gallery cell (thème Démo).
 */

import type { SiteNavGalleryUiOverride } from "@compoz/ui/site/site-ui.types";

export const demoNavGalleryUi: SiteNavGalleryUiOverride = {
  overlayContent: "text-2xl font-bold",
} as const;
