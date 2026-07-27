/**
 * @file packages/ui/src/site/skins/portfolio/global.ui.ts
 * @layer ui/site/skins/portfolio
 *
 * @description
 * Composes the portfolio public site skin overrides from layout and cell UI class maps.
 */

import type { SiteGlobalUiOverride } from "@compoz/ui/site/site-ui.types";
import { portfolioBlockSectionUi } from "@compoz/ui/site/skins/portfolio/block-section.ui";
import { portfolioButtonsUi } from "@compoz/ui/site/skins/portfolio/cells/buttons-cell.ui";
import { portfolioCardUi } from "@compoz/ui/site/skins/portfolio/cells/card-cell.ui";
import { portfolioCarouselUi } from "@compoz/ui/site/skins/portfolio/cells/carousel-cell.ui";
import { portfolioExtendedCardUi } from "@compoz/ui/site/skins/portfolio/cells/extended-card-cell.ui";
import { portfolioFormUi } from "@compoz/ui/site/skins/portfolio/cells/form-cell.ui";
import { portfolioHeadingUi } from "@compoz/ui/site/skins/portfolio/cells/heading-cell.ui";
import { portfolioImageUi } from "@compoz/ui/site/skins/portfolio/cells/image-cell.ui";
import { portfolioRichTextUi } from "@compoz/ui/site/skins/portfolio/cells/richtext-cell.ui";
import { portfolioStepsUi } from "@compoz/ui/site/skins/portfolio/cells/steps-cell.ui";
import { portfolioStructuredCardUi } from "@compoz/ui/site/skins/portfolio/cells/structured-card-cell.ui";
import { portfolioTestimonialsUi } from "@compoz/ui/site/skins/portfolio/cells/testimonials-cell.ui";
import { portfolioTimelineUi } from "@compoz/ui/site/skins/portfolio/cells/timeline-cell.ui";
import { portfolioHeaderUi } from "@compoz/ui/site/skins/portfolio/header.ui";
import { portfolioPagerUi } from "@compoz/ui/site/skins/portfolio/pager.ui";

export const portfolioGlobalUi: SiteGlobalUiOverride = {
  header: portfolioHeaderUi,
  cells: {
    buttons: portfolioButtonsUi,
    card: portfolioCardUi,
    extendedCard: portfolioExtendedCardUi,
    carousel: portfolioCarouselUi,
    form: portfolioFormUi,
    heading: portfolioHeadingUi,
    image: portfolioImageUi,
    steps: portfolioStepsUi,
    structuredCard: portfolioStructuredCardUi,
    testimonials: portfolioTestimonialsUi,
    timeline: portfolioTimelineUi,
    richText: portfolioRichTextUi,
  },
  blockSection: portfolioBlockSectionUi,
  pager: portfolioPagerUi,
} as const;
