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
import { lolaNavGalleryUi } from "@compoz/ui/site/skins/lola/blocks/nav-gallery-block.ui";
import { lolaZoomGalleryUi } from "@compoz/ui/site/skins/lola/blocks/zoom-gallery-block.ui";
import { lolaFooterUi } from "@compoz/ui/site/skins/lola/footer.ui";
import { lolaHeaderUi } from "@compoz/ui/site/skins/lola/header.ui";
import { lolaPagerUi } from "@compoz/ui/site/skins/lola/pager.ui";
import { lolaSystemLoadingUi } from "@compoz/ui/site/skins/lola/system-loading.ui";
import { lolaSystemPageUi } from "@compoz/ui/site/skins/lola/system-page.ui";

export const lolaGlobalUi: SiteGlobalUiOverride = {
  header: lolaHeaderUi,
  footer: lolaFooterUi,

  body: {
    surface: "bg-gray-50",
  },

  cells: {
    navGallery: lolaNavGalleryUi,
    zoomGallery: lolaZoomGalleryUi,
  },

  pager: lolaPagerUi,
  systemPage: lolaSystemPageUi,
  systemLoading: lolaSystemLoadingUi,
};
