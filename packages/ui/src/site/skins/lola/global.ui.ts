/**
 * @file packages/ui/src/site/skins/lola/global.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — preview overview site (thème Lola).
 *
 * @remarks
 * - Compose les skins existants du header et du footer.
 * - Ajoute un style minimal pour la zone de contenu factice de l’overview.
 * - Fournit uniquement des classes Tailwind (aucune logique).
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
    pageHeading: { h1: "sr-only" },
  },

  blocks: {
    navGallery: lolaNavGalleryUi,
    zoomGallery: lolaZoomGalleryUi,
  },

  pager: lolaPagerUi,
  systemPage: lolaSystemPageUi,
  systemLoading: lolaSystemLoadingUi,
};
