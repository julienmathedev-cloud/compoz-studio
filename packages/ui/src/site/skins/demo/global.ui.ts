/**
 * @file packages/ui/src/site/skins/demo/global.ui.ts
 * @layer ui/site/skins/demo
 *
 * @description
 * Composes the demo public site skin overrides from layout, cell, and pager UI class maps.
 */

import type { SiteGlobalUiOverride } from "@compoz/ui/site/site-ui.types";
import { demoCarouselUi } from "@compoz/ui/site/skins/demo/cells/carousel-cell.ui";
import { demoCardUi } from "@compoz/ui/site/skins/demo/cells/card-cell.ui";
import { demoExtendedCardUi } from "@compoz/ui/site/skins/demo/cells/extended-card-cell.ui";
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
    card: demoCardUi,
    extendedCard: demoExtendedCardUi,
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
