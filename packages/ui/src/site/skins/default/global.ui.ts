/**
 * @file packages/ui/src/site/skins/default/global.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — site (thème Default).
 *
 * @remarks
 * - Compose header/footer/systemPage.
 * - Fournit les valeurs minimales pour le renderer (container + H1 layout).
 * - Fournit uniquement des classes Tailwind (aucune logique).
 */

import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";
import { defaultBlockSectionUi } from "@compoz/ui/site/skins/default/block-section.ui";
import { defaultButtonsUi } from "@compoz/ui/site/skins/default/cells/buttons-cell.ui";
import { defaultCardCollectionUi } from "@compoz/ui/site/skins/default/cells/card-collection-cell.ui";
import { defaultCardsUi } from "@compoz/ui/site/skins/default/cells/cards-cell.ui";
import { defaultCardsExtendedUi } from "@compoz/ui/site/skins/default/cells/cards-extended-cell.ui";
import { defaultCarouselUi } from "@compoz/ui/site/skins/default/cells/carousel-cell.ui";
import { defaultFormUi } from "@compoz/ui/site/skins/default/cells/form-cell.ui";
import { defaultHeadingUi } from "@compoz/ui/site/skins/default/cells/heading-cell.ui";
import { defaultImageUi } from "@compoz/ui/site/skins/default/cells/image-cell.ui";
import { defaultNavGalleryUi } from "@compoz/ui/site/skins/default/cells/nav-gallery-cell.ui";
import { defaultRichTextUi } from "@compoz/ui/site/skins/default/cells/richtext-cell.ui";
import { defaultSeparatorUi } from "@compoz/ui/site/skins/default/cells/separator-cell.ui";
import { defaultSpacerUi } from "@compoz/ui/site/skins/default/cells/spacer-cell.ui";
import { defaultStepsUi } from "@compoz/ui/site/skins/default/cells/steps-cell.ui";
import { defaultStructuredCardUi } from "@compoz/ui/site/skins/default/cells/structured-card-cell.ui";
import { defaultTestimonialsUi } from "@compoz/ui/site/skins/default/cells/testimonials-cell.ui";
import { defaultTimelineUi } from "@compoz/ui/site/skins/default/cells/timeline-cell.ui";
import { defaultZoomGalleryUi } from "@compoz/ui/site/skins/default/cells/zoom-gallery-cell.ui";
import { defaultFooterUi } from "@compoz/ui/site/skins/default/footer.ui";
import { defaultHeaderUi } from "@compoz/ui/site/skins/default/header.ui";
import { defaultPagerUi } from "@compoz/ui/site/skins/default/pager.ui";
import { defaultRevealUi } from "@compoz/ui/site/skins/default/reveal.ui";
import { defaultSystemLoadingUi } from "@compoz/ui/site/skins/default/system-loading.ui";
import { defaultSystemPageUi } from "@compoz/ui/site/skins/default/system-page.ui";

export const defaultGlobalUi: SiteGlobalUi = {
  header: defaultHeaderUi,
  footer: defaultFooterUi,

  cells: {
    richText: defaultRichTextUi,
    image: defaultImageUi,
    carousel: defaultCarouselUi,
    navGallery: defaultNavGalleryUi,
    zoomGallery: defaultZoomGalleryUi,
    cardCollection: defaultCardCollectionUi,
    cards: defaultCardsUi,
    cardsExtended: defaultCardsExtendedUi,
    steps: defaultStepsUi,
    testimonials: defaultTestimonialsUi,
    structuredCard: defaultStructuredCardUi,
    heading: defaultHeadingUi,
    spacer: defaultSpacerUi,
    separator: defaultSeparatorUi,
    buttons: defaultButtonsUi,
    form: defaultFormUi,
    timeline: defaultTimelineUi,
  },

  reveal: defaultRevealUi,
  pager: defaultPagerUi,
  blockSection: defaultBlockSectionUi,
  systemPage: defaultSystemPageUi,
  systemLoading: defaultSystemLoadingUi,
} as const;
