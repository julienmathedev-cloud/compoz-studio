/**
 * @file packages/ui/src/site/skins/demo/cells/zoom-gallery-cell.ui.ts
 * @layer ui/site/skins/demo/cells
 *
 * @description
 * Defines the demo skin overrides for zoom gallery cells.
 */

import type { SiteZoomGalleryUiOverride } from "@compoz/ui/site/site-ui.types";
import { demoLightboxUi } from "@compoz/ui/site/skins/demo/molecules/lightbox.ui";

export const demoZoomGalleryUi: SiteZoomGalleryUiOverride = {
  overlayContent: "text-popover-foreground text-2xl font-bold",
  lightbox: demoLightboxUi,
} as const;
