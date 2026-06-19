/**
 * @file packages/ui/src/site/skins/portfolio/global.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — site (thème Portfolio).
 *
 * @remarks
 * - Compose header/footer/systemPage.
 * - Fournit les valeurs minimales pour le renderer (container + H1 layout).
 * - Fournit uniquement des classes Tailwind (aucune logique).
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
import { portfolioTimelineUi } from "@compoz/ui/site/skins/portfolio/cells/timeline-cell.ui";
import { portfolioHeaderUi } from "@compoz/ui/site/skins/portfolio/header.ui";

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
    timeline: portfolioTimelineUi,
    richText: portfolioRichTextUi,
  },
  blockSection: portfolioBlockSectionUi,
} as const;
