/**
 * @file packages/ui/src/site/skins/démo/global.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — site (thème Démo).
 *
 * @remarks
 * - Compose header/footer/systemPage.
 * - Fournit les valeurs minimales pour le renderer (container + H1 layout).
 * - Fournit uniquement des classes Tailwind (aucune logique).
 */

import type { SiteGlobalUiOverride } from "@compoz/ui/site/site-ui.types";
import { demoCardsUi } from "@compoz/ui/site/skins/demo/cells/cards-cell.ui";
import { demoCardsExtendedUi } from "@compoz/ui/site/skins/demo/cells/cards-extended-cell.ui";
import { demoCarouselUi } from "@compoz/ui/site/skins/demo/cells/carousel-cell.ui";
import { demoHeadingUi } from "@compoz/ui/site/skins/demo/cells/heading-cell.ui";
import { demoNavGalleryUi } from "@compoz/ui/site/skins/demo/cells/nav-gallery-cell.ui";
import { demoStepsUi } from "@compoz/ui/site/skins/demo/cells/steps-cell.ui";
import { demoStructuredCardUi } from "@compoz/ui/site/skins/demo/cells/structured-card-cell.ui";
import { demoTimelineUi } from "@compoz/ui/site/skins/demo/cells/timeline-cell.ui";
import { demoZoomGalleryUi } from "@compoz/ui/site/skins/demo/cells/zoom-gallery-cell.ui";
import { demoFooterUi } from "@compoz/ui/site/skins/demo/footer.ui";
import { demoHeaderUi } from "@compoz/ui/site/skins/demo/header.ui";
import { demoPagerUi } from "@compoz/ui/site/skins/demo/pager.ui";

export const demoGlobalUi: SiteGlobalUiOverride = {
  header: demoHeaderUi,
  footer: demoFooterUi,
  cells: {
    cards: demoCardsUi,
    cardsExtended: demoCardsExtendedUi,
    carousel: demoCarouselUi,
    heading: demoHeadingUi,
    navGallery: demoNavGalleryUi,
    steps: demoStepsUi,
    structuredCard: demoStructuredCardUi,
    timeline: demoTimelineUi,
    zoomGallery: demoZoomGalleryUi,
  },

  pager: demoPagerUi,
} as const;
