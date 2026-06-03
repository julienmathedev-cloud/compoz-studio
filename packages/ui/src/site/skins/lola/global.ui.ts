/**
 * @file packages/ui/src/site/skins/lola/global.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — site (thème Lola).
 *
 * @remarks
 * - Override partiel du skin global.
 * - Aligne la structure sur `defaultGlobalUi`.
 * - Fournit uniquement les surcharges nécessaires au thème Lola.
 */

import type { SiteGlobalUiOverride } from "@compoz/ui/site/site-ui.types";
import { lolaBlockSectionUi } from "@compoz/ui/site/skins/lola/block-section.ui";
import { lolaZoomGalleryUi } from "@compoz/ui/site/skins/lola/cells/zoom-gallery-cell.ui";
import { lolaHeaderUi } from "@compoz/ui/site/skins/lola/header.ui";

export const lolaGlobalUi: SiteGlobalUiOverride = {
  header: lolaHeaderUi,
  cells: {
    zoomGallery: lolaZoomGalleryUi,
  },
  blockSection: lolaBlockSectionUi,
};
