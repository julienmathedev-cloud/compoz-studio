/**
 * @file packages/ui/src/site/skins/lola/cells/zoom-gallery-cell.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — preview overview site (thème Lola).
 */

import type { SiteZoomGalleryUiOverride } from "@compoz/ui/site/site-ui.types";
import { lolaLightboxUi } from "@compoz/ui/site/skins/lola/molecules/lightbox.ui";

export const lolaZoomGalleryUi: SiteZoomGalleryUiOverride = {
  figure: "relative w-full overflow-hidden rounded-lg bg-muted/30",
  image: "object-contain",
  overlayPanel: "bg-gradient-to-t from-white to-white/70",
  overlayContent: "text-muted-foreground text-sm font-semibold",
  lightbox: lolaLightboxUi,
};
