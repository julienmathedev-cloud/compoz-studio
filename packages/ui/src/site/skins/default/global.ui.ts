/**
 * @file packages/ui/src/site/skins/default/global.ui.ts
 * @layer ui/public/skins
 *
 * @description
 * Skin UI — site public (thème Default).
 *
 * @remarks
 * - Compose header/footer/systemPage.
 * - Fournit les valeurs minimales pour le renderer (container + H1 layout).
 * - Fournit uniquement des classes Tailwind (aucune logique).
 */

import { defaultCarouselUi } from "@compoz/ui/site/skins/default/blocks/carousel-block.ui";
import { defaultImageUi } from "@compoz/ui/site/skins/default/blocks/image-block.ui";
import { defaultNavGalleryUi } from "@compoz/ui/site/skins/default/blocks/nav-gallery-block.ui";
import { defaultRichTextUi } from "@compoz/ui/site/skins/default/blocks/richtext-block.ui";
import { defaultZoomGalleryUi } from "@compoz/ui/site/skins/default/blocks/zoom-gallery-block.ui";
import { defaultFooterUi } from "@compoz/ui/site/skins/default/footer.ui";
import { defaultHeaderUi } from "@compoz/ui/site/skins/default/header.ui";
import { defaultLayoutSectionUi } from "@compoz/ui/site/skins/default/layout-section.ui";
import { defaultPagerUi } from "@compoz/ui/site/skins/default/pager.ui";
import { defaultSystemLoadingUi } from "@compoz/ui/site/skins/default/system-loading.ui";
import { defaultSystemPageUi } from "@compoz/ui/site/skins/default/system-page.ui";
import type { PublicGlobalUi } from "@compoz/ui/site/public-ui.types";

export const defaultGlobalUi: PublicGlobalUi = {
  header: defaultHeaderUi,
  footer: defaultFooterUi,

  body: {
    // Neutre : pas de fond par défaut (laisse le layout décider).
    surface: "bg-background",
    pageHeading: {
      h1: "sr-only",
    },
    spacing: "space-y-6",
    paddingTop: "pt-10",
    paddingBottom: "pb-10",
  },
  blocks: {
    richText: defaultRichTextUi,
    image: defaultImageUi,
    carousel: defaultCarouselUi,
    navGallery: defaultNavGalleryUi,
    zoomGallery: defaultZoomGalleryUi,
  },
  pager: defaultPagerUi,
  layoutSection: defaultLayoutSectionUi,
  systemPage: defaultSystemPageUi,
  systemLoading: defaultSystemLoadingUi,
} as const;
