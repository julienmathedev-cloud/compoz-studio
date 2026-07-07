/**
 * @file packages/ui/src/site/skins/lola/global.ui.ts
 * @layer ui/site/skins/lola
 *
 * @description
 * Composes the Lola public site skin overrides from layout and cell UI class maps.
 */

import type { SiteGlobalUiOverride } from "@compoz/ui/site/site-ui.types";
import { lolaBlockSectionUi } from "@compoz/ui/site/skins/lola/block-section.ui";
import { lolaCarouselUi } from "@compoz/ui/site/skins/lola/cells/carousel-cell.ui";
import { lolaHeadingUi } from "@compoz/ui/site/skins/lola/cells/heading-cell.ui";
import { lolaImageUi } from "@compoz/ui/site/skins/lola/cells/image-cell.ui";
import { lolaZoomGalleryUi } from "@compoz/ui/site/skins/lola/cells/zoom-gallery-cell.ui";
import { lolaHeaderUi } from "@compoz/ui/site/skins/lola/header.ui";

export const lolaGlobalUi: SiteGlobalUiOverride = {
  header: lolaHeaderUi,
  cells: {
    image: lolaImageUi,
    carousel: lolaCarouselUi,
    heading: lolaHeadingUi,
    zoomGallery: lolaZoomGalleryUi,
  },
  blockSection: lolaBlockSectionUi,
};
