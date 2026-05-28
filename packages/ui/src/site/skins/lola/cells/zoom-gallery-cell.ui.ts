/**
 * @file packages/ui/src/site/skins/lola/cells/zoom-gallery-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — preview overview site (thème Lola).
 */

import type { SiteZoomGalleryUiOverride } from "@compoz/ui/site/site-ui.types";

export const lolaZoomGalleryUi: SiteZoomGalleryUiOverride = {
  figure: "relative w-full overflow-hidden rounded-lg bg-muted/30",
  image: "object-contain",
  overlayPanel: "bg-gradient-to-t from-black/95 to-black/50",
  overlayContent: "text-white text-sm font-semibold",
};
