/**
 * @file packages/ui/src/site/skins/lola/global.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — preview overview public (thème Lola).
 *
 * @remarks
 * - Compose les skins existants du header et du footer.
 * - Ajoute un style minimal pour la zone de contenu factice de l’overview.
 * - Fournit uniquement des classes Tailwind (aucune logique).
 */

import { lolaNavGalleryUi } from "@compoz/ui/site/skins/lola/blocks/nav-gallery-block.ui";
import { lolaZoomGalleryUi } from "@compoz/ui/site/skins/lola/blocks/zoom-gallery-block.ui";
import { lolaFooterUi } from "@compoz/ui/site/skins/lola/footer.ui";
import { lolaHeaderUi } from "@compoz/ui/site/skins/lola/header.ui";
import { lolaPagerUi } from "@compoz/ui/site/skins/lola/pager.ui";
import { lolaSystemLoadingUi } from "@compoz/ui/site/skins/lola/system-loading.ui";
import { lolaSystemPageUi } from "@compoz/ui/site/skins/lola/system-page.ui";
import type { PublicGlobalUiOverride } from "@compoz/ui/site/public-ui.types";

export const lolaGlobalUi: PublicGlobalUiOverride = {
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
